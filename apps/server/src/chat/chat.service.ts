import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { Message, MessageType } from './entities/message.entity';
import { MessageReaction } from './entities/message-reaction.entity';
import { EncryptionService } from '../common/encryption.service';

export interface CreateMessageDto {
  type: MessageType;
  content: string; // plain text or base64 for media
  mimeType?: string;
  replyToId?: string;
}

export interface ReplyPreview {
  id: string;
  type: MessageType;
  content: string;
  senderHash: string;
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  userReacted: boolean;
}

export interface MessageResponse {
  id: string;
  type: MessageType;
  content: string;
  mimeType?: string;
  senderHash: string;
  createdAt: Date;
  replyToId?: string;
  replyTo?: ReplyPreview;
  reactions?: ReactionSummary[];
}

@Injectable()
export class ChatService {
  private readonly uploadDir: string;

  constructor(
    @InjectRepository(Message)
    private repo: Repository<Message>,
    @InjectRepository(MessageReaction)
    private reactionRepo: Repository<MessageReaction>,
    private encryption: EncryptionService,
    config: ConfigService,
  ) {
    this.uploadDir = path.join(process.cwd(), 'uploads');
  }

  private async ensureUploadDir(): Promise<void> {
    await fs.mkdir(this.uploadDir, { recursive: true });
  }

  private randomId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  async create(
    senderHash: string,
    dto: CreateMessageDto,
    file?: Express.Multer.File,
  ): Promise<MessageResponse> {
    let contentEncrypted: string;

    if (dto.type === 'text') {
      const payload = JSON.stringify({ body: dto.content });
      contentEncrypted = this.encryption.encrypt(payload);
    } else {
      // Media: use uploaded file or base64 from content
      const mediaPath = await this.saveMedia(dto, file);
      const payload = JSON.stringify({
        mediaPath,
        mimeType: dto.mimeType ?? file?.mimetype ?? 'application/octet-stream',
      });
      contentEncrypted = this.encryption.encrypt(payload);
    }

    const msg = this.repo.create({
      contentEncrypted,
      type: dto.type,
      senderHash,
      replyToId: dto.replyToId ?? null,
    });
    const saved = await this.repo.save(msg);
    return await this.toResponse(saved, undefined);
  }

  private async saveMedia(
    dto: CreateMessageDto,
    file?: Express.Multer.File,
  ): Promise<string> {
    await this.ensureUploadDir();
    const ext = this.getExtension(dto.mimeType ?? file?.mimetype);
    const filename = `${this.randomId()}${ext}.enc`;

    let data: Buffer;
    if (file?.buffer) {
      data = file.buffer;
    } else if (dto.content) {
      data = Buffer.from(dto.content, 'base64');
    } else {
      throw new BadRequestException('No media content provided');
    }

    const encrypted = this.encryption.encryptBuffer(data);
    const filepath = path.join(this.uploadDir, filename);
    await fs.writeFile(filepath, encrypted);
    return filename;
  }

  private getExtension(mime?: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'audio/mpeg': '.mp3',
      'audio/ogg': '.ogg',
      'audio/wav': '.wav',
      'audio/webm': '.weba',
      'application/pdf': '.pdf',
      'text/csv': '.csv',
      'text/plain': '.txt',
      'application/zip': '.zip',
      'application/x-zip-compressed': '.zip',
      'application/x-rar-compressed': '.rar',
      'application/vnd.rar': '.rar',
    };
    return map[mime ?? ''] ?? '';
  }

  async findAll(
    limit = 100,
    offset = 0,
    currentUserHash?: string,
  ): Promise<MessageResponse[]> {
    const messages = await this.repo.find({
      order: { createdAt: 'ASC' },
      take: limit,
      skip: offset,
    });
    return Promise.all(messages.map((m) => this.toResponse(m, currentUserHash)));
  }

  /** Cursor-based pagination for infinite scroll. Returns messages in ASC order (oldest first). */
  async findPaginated(opts: {
    limit?: number;
    before?: string;
    after?: string;
    currentUserHash?: string;
  }): Promise<MessageResponse[]> {
    const limit = Math.min(opts.limit ?? 30, 50);
    const currentUserHash = opts.currentUserHash;
    const qb = this.repo.createQueryBuilder('m').orderBy('m.createdAt', 'ASC');

    if (opts.before) {
      const cursor = await this.repo.findOne({ where: { id: opts.before }, select: ['createdAt'] });
      if (!cursor) return [];
      qb.andWhere('m.createdAt < :createdAt', { createdAt: cursor.createdAt });
      qb.orderBy('m.createdAt', 'DESC').take(limit);
      const rows = await qb.getMany();
      return Promise.all(rows.reverse().map((m) => this.toResponse(m, currentUserHash)));
    }

    if (opts.after) {
      const cursor = await this.repo.findOne({ where: { id: opts.after }, select: ['createdAt'] });
      if (!cursor) return [];
      qb.andWhere('m.createdAt > :createdAt', { createdAt: cursor.createdAt });
      qb.take(limit);
      const rows = await qb.getMany();
      return Promise.all(rows.map((m) => this.toResponse(m, currentUserHash)));
    }

    const rows = await this.repo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return Promise.all(rows.reverse().map((m) => this.toResponse(m, currentUserHash)));
  }

  async getMedia(filename: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const filepath = path.join(this.uploadDir, filename);
    try {
      const encrypted = await fs.readFile(filepath);
      const decrypted = this.encryption.decryptBuffer(encrypted);
      const mimeType = this.guessMime(filename);
      return { buffer: decrypted, mimeType };
    } catch {
      throw new BadRequestException('Media not found');
    }
  }

  private guessMime(filename: string): string {
    const ext = path.extname(filename).replace('.enc', '');
    const map: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mp3': 'audio/mpeg',
      '.ogg': 'audio/ogg',
      '.wav': 'audio/wav',
      '.weba': 'audio/webm',
      '.pdf': 'application/pdf',
      '.csv': 'text/csv',
      '.txt': 'text/plain',
      '.zip': 'application/zip',
      '.rar': 'application/vnd.rar',
    };
    return map[ext] ?? 'application/octet-stream';
  }

  async toggleReaction(
    messageId: string,
    senderHash: string,
    emoji: string,
  ): Promise<ReactionSummary[]> {
    const msg = await this.repo.findOne({ where: { id: messageId } });
    if (!msg) throw new BadRequestException('Message not found');

    const trimmed = emoji.trim().slice(0, 16);
    if (!trimmed) throw new BadRequestException('Invalid emoji');

    const existing = await this.reactionRepo.findOne({
      where: { messageId, senderHash, emoji: trimmed },
    });
    if (existing) {
      await this.reactionRepo.remove(existing);
    } else {
      await this.reactionRepo.save(
        this.reactionRepo.create({ messageId, senderHash, emoji: trimmed }),
      );
    }
    return this.getReactionsForMessage(messageId, senderHash);
  }

  async getReactionsForMessage(
    messageId: string,
    currentUserHash?: string,
  ): Promise<ReactionSummary[]> {
    const reactions = await this.reactionRepo.find({
      where: { messageId },
    });
    const byEmoji = new Map<string, { count: number; senders: Set<string> }>();
    for (const r of reactions) {
      const entry = byEmoji.get(r.emoji) ?? { count: 0, senders: new Set<string>() };
      entry.count++;
      entry.senders.add(r.senderHash);
      byEmoji.set(r.emoji, entry);
    }
    return Array.from(byEmoji.entries()).map(([emoji, { count, senders }]) => ({
      emoji,
      count,
      userReacted: !!(currentUserHash && senders.has(currentUserHash)),
    }));
  }

  /** Returns reactions with senders for broadcast (clients compute userReacted locally) */
  async getReactionsForBroadcast(messageId: string): Promise<{ emoji: string; count: number; senders: string[] }[]> {
    const reactions = await this.reactionRepo.find({ where: { messageId } });
    const byEmoji = new Map<string, string[]>();
    for (const r of reactions) {
      const arr = byEmoji.get(r.emoji) ?? [];
      arr.push(r.senderHash);
      byEmoji.set(r.emoji, arr);
    }
    return Array.from(byEmoji.entries()).map(([emoji, senders]) => ({
      emoji,
      count: senders.length,
      senders,
    }));
  }

  private async toResponse(msg: Message, currentUserHash?: string): Promise<MessageResponse> {
    const decrypted = this.encryption.decrypt(msg.contentEncrypted);
    const parsed = JSON.parse(decrypted) as { body?: string; mediaPath?: string; mimeType?: string };

    let base: MessageResponse;
    if (msg.type === 'text') {
      base = {
        id: msg.id,
        type: msg.type,
        content: parsed.body ?? '',
        senderHash: msg.senderHash,
        createdAt: msg.createdAt,
      };
    } else {
      base = {
        id: msg.id,
        type: msg.type,
        content: parsed.mediaPath ?? '',
        mimeType: parsed.mimeType,
        senderHash: msg.senderHash,
        createdAt: msg.createdAt,
      };
    }

    if (msg.replyToId) {
      base.replyToId = msg.replyToId;
      const replied = await this.repo.findOne({ where: { id: msg.replyToId } });
      if (replied) {
        const dec = this.encryption.decrypt(replied.contentEncrypted);
        const p = JSON.parse(dec) as { body?: string; mediaPath?: string };
        base.replyTo = {
          id: replied.id,
          type: replied.type,
          content: replied.type === 'text' ? (p.body ?? '') : (p.mediaPath ?? ''),
          senderHash: replied.senderHash,
        };
      }
    }
    base.reactions = await this.getReactionsForMessage(msg.id, currentUserHash);
    return base;
  }
}
