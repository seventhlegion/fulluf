import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { Message } from './entities/message.entity';
import { MessageReaction } from './entities/message-reaction.entity';
import { EncryptionService } from '../common/encryption.service';
import { MediaStorageService } from './services/media-storage.service';
import { ReactionService } from './services/reaction.service';
import { MessageMapperService } from './services/message-mapper.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, MessageReaction]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('auth.jwtSecret'),
        signOptions: { expiresIn: config.get<string>('auth.jwtExpiresIn') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatGateway,
    EncryptionService,
    MediaStorageService,
    ReactionService,
    MessageMapperService,
  ],
  exports: [ChatService],
})
export class ChatModule {}
