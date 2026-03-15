import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../entities/message.entity';
import { EncryptionService } from '../../common/encryption.service';
import { ReactionService } from './reaction.service';
import type { MessageResponse, ReplyPreview } from '../types';

@Injectable()
export class MessageMapperService {
  constructor(
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
    private encryption: EncryptionService,
    private reactionService: ReactionService,
  ) {}

  async toResponse(msg: Message, currentUserHash?: string): Promise<MessageResponse> {
    const decrypted = this.encryption.decrypt(msg.contentEncrypted);
    const parsed = JSON.parse(decrypted) as {
      body?: string;
      mediaPath?: string;
      mimeType?: string;
    };

    const base: MessageResponse = {
      id: msg.id,
      type: msg.type,
      content: msg.type === 'text' ? (parsed.body ?? '') : (parsed.mediaPath ?? ''),
      mimeType: msg.type !== 'text' ? parsed.mimeType : undefined,
      senderHash: msg.senderHash,
      createdAt: msg.createdAt,
    };

    if (msg.replyToId) {
      base.replyToId = msg.replyToId;
      const replyPreview = await this.resolveReplyPreview(msg.replyToId);
      if (replyPreview) base.replyTo = replyPreview;
    }

    base.reactions = await this.reactionService.getReactionsForMessage(
      msg.id,
      currentUserHash,
    );
    return base;
  }

  private async resolveReplyPreview(replyToId: string): Promise<ReplyPreview | null> {
    const replied = await this.messageRepo.findOne({
      where: { id: replyToId },
    });
    if (!replied) return null;

    const dec = this.encryption.decrypt(replied.contentEncrypted);
    const p = JSON.parse(dec) as { body?: string; mediaPath?: string };
    return {
      id: replied.id,
      type: replied.type,
      content: replied.type === 'text' ? (p.body ?? '') : (p.mediaPath ?? ''),
      senderHash: replied.senderHash,
    };
  }
}
