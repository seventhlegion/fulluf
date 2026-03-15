import { IsString, IsEnum, IsOptional, MinLength, ValidateIf } from 'class-validator';

export class CreateMessageDto {
  @IsEnum(['text', 'image', 'video', 'audio', 'file'])
  type!: 'text' | 'image' | 'video' | 'audio' | 'file';

  @ValidateIf((o) => o.type === 'text')
  @IsString()
  @MinLength(1, { message: 'Content is required for text messages' })
  content!: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsString()
  replyToId?: string;
}
