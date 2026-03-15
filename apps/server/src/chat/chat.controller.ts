import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/types';
import type { MessageResponse } from './types';

const multerMem = memoryStorage();

@Controller('chat')
export class ChatController {
  constructor(
    private chat: ChatService,
    private gateway: ChatGateway,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('messages')
  async getMessages(
    @Req() req: { user: JwtPayload },
    @Query('limit') limit?: string,
    @Query('before') before?: string,
    @Query('after') after?: string,
  ): Promise<MessageResponse[]> {
    const opts = {
      limit: limit ? Math.min(parseInt(limit, 10) || 30, 50) : 30,
      before,
      after,
      currentUserHash: req.user.username,
    };
    return this.chat.findPaginated(opts);
  }

  @UseGuards(JwtAuthGuard)
  @Post('messages/media')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multerMem,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async createMediaMessage(
    @Req() req: { user: JwtPayload; file?: Express.Multer.File; body?: { type?: string; mimeType?: string; replyToId?: string } },
  ): Promise<MessageResponse> {
    const file = req.file;
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const type = (req.body?.type ?? 'image') as 'image' | 'video' | 'audio' | 'file';
    const dto = {
      type,
      content: '',
      mimeType: req.body?.mimeType ?? file.mimetype,
      replyToId: req.body?.replyToId,
    };
    const msg = await this.chat.create(req.user.username, dto, file);
    this.gateway.broadcastNewMessage(msg);
    return msg;
  }

  @UseGuards(JwtAuthGuard)
  @Get('media/:filename')
  async getMedia(
    @Param('filename') filename: string,
    @Res({ passthrough: false }) res: { setHeader: (name: string, value: string) => void; send: (body: Buffer) => void },
  ): Promise<void> {
    const { buffer, mimeType } = await this.chat.getMedia(filename);
    res.setHeader('Content-Type', mimeType);
    res.send(buffer);
  }
}
