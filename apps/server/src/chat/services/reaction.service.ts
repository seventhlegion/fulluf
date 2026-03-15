import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageReaction } from '../entities/message-reaction.entity';
import type { ReactionSummary } from '../types';

@Injectable()
export class ReactionService {
  constructor(
    @InjectRepository(MessageReaction)
    private repo: Repository<MessageReaction>,
  ) {}

  async toggleReaction(
    messageId: string,
    senderHash: string,
    emoji: string,
  ): Promise<ReactionSummary[]> {
    const trimmed = emoji.trim().slice(0, 16);
    if (!trimmed) throw new BadRequestException('Invalid emoji');

    const existing = await this.repo.findOne({
      where: { messageId, senderHash, emoji: trimmed },
    });
    if (existing) {
      await this.repo.remove(existing);
    } else {
      await this.repo.save(
        this.repo.create({ messageId, senderHash, emoji: trimmed }),
      );
    }
    return this.getReactionsForMessage(messageId, senderHash);
  }

  async getReactionsForMessage(
    messageId: string,
    currentUserHash?: string,
  ): Promise<ReactionSummary[]> {
    const reactions = await this.repo.find({
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

  async getReactionsForBroadcast(
    messageId: string,
  ): Promise<{ emoji: string; count: number; senders: string[] }[]> {
    const reactions = await this.repo.find({ where: { messageId } });
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
}
