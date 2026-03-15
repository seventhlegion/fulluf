export type MessageType = "text" | "image" | "video" | "audio" | "file";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  username: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  username: string;
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  userReacted: boolean;
}

export interface ReplyPreview {
  id: string;
  type: MessageType;
  content: string;
  senderHash: string;
}

export interface Message {
  id: string;
  type: MessageType;
  content: string;
  mimeType?: string;
  senderHash: string;
  createdAt: string;
  replyToId?: string;
  replyTo?: ReplyPreview;
  reactions?: ReactionSummary[];
}

export interface CreateMessageRequest {
  type: MessageType;
  content: string;
  mimeType?: string;
  replyToId?: string;
}
