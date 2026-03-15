import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { EncryptionService } from '../common/encryption.service';
import { MediaStorageService } from './services/media-storage.service';
import { MessageMapperService } from './services/message-mapper.service';
import { ReactionService } from './services/reaction.service';
import type { CreateMessageInput, MessageResponse } from './types';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private repo: Repository<Message>,
    private encryption: EncryptionService,
    private mediaStorage: MediaStorageService,
    private messageMapper: MessageMapperService,
    private reactionService: ReactionService,
  ) {}

  async create(
    senderHash: string,
    dto: CreateMessageInput,
    file?: Express.Multer.File,
  ): Promise<MessageResponse> {
    let contentEncrypted: string;

    if (dto.type === 'text') {
      const payload = JSON.stringify({ body: dto.content });
      contentEncrypted = this.encryption.encrypt(payload);
    } else {
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
    return this.messageMapper.toResponse(saved, undefined);
  }

  private async saveMedia(
    dto: CreateMessageInput,
    file?: Express.Multer.File,
  ): Promise<string> {
    let data: Buffer;
    if (file?.buffer) {
      data = file.buffer;
    } else if (dto.content) {
      data = Buffer.from(dto.content, 'base64');
    } else {
      throw new BadRequestException('No media content provided');
    }

    const mimeType = dto.mimeType ?? file?.mimetype ?? 'application/octet-stream';
    return this.mediaStorage.saveMedia(mimeType, data);
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
    return Promise.all(
      messages.map((m) => this.messageMapper.toResponse(m, currentUserHash)),
    );
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
      const cursor = await this.repo.findOne({
        where: { id: opts.before },
        select: ['createdAt'],
      });
      if (!cursor) return [];
      qb.andWhere('m.createdAt < :createdAt', { createdAt: cursor.createdAt });
      qb.orderBy('m.createdAt', 'DESC').take(limit);
      const rows = await qb.getMany();
      return Promise.all(
        rows.reverse().map((m) => this.messageMapper.toResponse(m, currentUserHash)),
      );
    }

    if (opts.after) {
      const cursor = await this.repo.findOne({
        where: { id: opts.after },
        select: ['createdAt'],
      });
      if (!cursor) return [];
      qb.andWhere('m.createdAt > :createdAt', { createdAt: cursor.createdAt });
      qb.take(limit);
      const rows = await qb.getMany();
      return Promise.all(
        rows.map((m) => this.messageMapper.toResponse(m, currentUserHash)),
      );
    }

    const rows = await this.repo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return Promise.all(
      rows.reverse().map((m) => this.messageMapper.toResponse(m, currentUserHash)),
    );
  }

  async getMedia(filename: string): Promise<{ buffer: Buffer; mimeType: string }> {
    return this.mediaStorage.getMedia(filename);
  }

  async toggleReaction(
    messageId: string,
    senderHash: string,
    emoji: string,
  ): Promise<MessageResponse['reactions']> {
    const msg = await this.repo.findOne({ where: { id: messageId } });
    if (!msg) throw new BadRequestException('Message not found');
    return this.reactionService.toggleReaction(messageId, senderHash, emoji);
  }

  /** Returns reactions with senders for broadcast (clients compute userReacted locally) */
  async getReactionsForBroadcast(
    messageId: string,
  ): Promise<{ emoji: string; count: number; senders: string[] }[]> {
    return this.reactionService.getReactionsForBroadcast(messageId);
  }
}
