import type { MessageType } from '../entities/message.entity';

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

export interface CreateMessageInput {
  type: MessageType;
  content: string;
  mimeType?: string;
  replyToId?: string;
}
