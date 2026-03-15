import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatService, MessageResponse, ReactionSummary } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import type { JwtPayload } from '../auth/auth.service';

interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

export interface MessagesRequestDto {
  before?: string;
  after?: string;
  limit?: number;
}

export interface ReactionToggleDto {
  messageId: string;
  emoji: string;
}

export interface ReactionUpdatedPayload {
  messageId: string;
  reactions: { emoji: string; count: number; senders: string[] }[];
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private chat: ChatService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token =
        client.handshake?.auth?.token ??
        (client.handshake?.headers?.authorization as string)?.replace('Bearer ', '');
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwt.verify<JwtPayload>(token, {
        secret: this.config.get<string>('auth.jwtSecret'),
      });
      (client as AuthenticatedSocket).user = payload;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(): void {
    // Optional: track online users
  }

  /** Broadcast new message to all connected clients (used by gateway and controller) */
  broadcastNewMessage(msg: MessageResponse): void {
    this.server.emit('message:new', msg);
  }

  /** Broadcast reaction update to all connected clients */
  broadcastReactionUpdated(messageId: string, reactions: { emoji: string; count: number; senders: string[] }[]): void {
    this.server.emit('reaction:updated', { messageId, reactions });
  }

  @SubscribeMessage('messages:request')
  async handleMessagesRequest(
    @MessageBody() dto: MessagesRequestDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<MessageResponse[]> {
    const limit = Math.min(dto.limit ?? 30, 50);
    const currentUserHash = client.user?.username;
    return this.chat.findPaginated({
      limit,
      before: dto.before,
      after: dto.after,
      currentUserHash,
    });
  }

  @SubscribeMessage('message:send')
  async handleMessageSend(
    @MessageBody() dto: CreateMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<MessageResponse> {
    const user = client.user;
    if (!user) throw new Error('Unauthorized');
    if (dto.type !== 'text') {
      throw new Error('Only text messages can be sent via WebSocket. Use REST for media.');
    }
    const msg = await this.chat.create(user.username, {
      type: dto.type,
      content: dto.content,
      mimeType: dto.mimeType,
      replyToId: dto.replyToId,
    });
    this.broadcastNewMessage(msg);
    return msg;
  }

  @SubscribeMessage('reaction:toggle')
  async handleReactionToggle(
    @MessageBody() dto: ReactionToggleDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<ReactionSummary[]> {
    const user = client.user;
    if (!user) throw new Error('Unauthorized');
    const reactions = await this.chat.toggleReaction(dto.messageId, user.username, dto.emoji);
    const forBroadcast = await this.chat.getReactionsForBroadcast(dto.messageId);
    this.broadcastReactionUpdated(dto.messageId, forBroadcast);
    return reactions;
  }
}
