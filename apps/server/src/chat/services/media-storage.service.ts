import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { EncryptionService } from '../../common/encryption.service';
import { MIME_TO_EXT, EXT_TO_MIME } from '../constants/mime-maps';

@Injectable()
export class MediaStorageService {
  private readonly uploadDir: string;

  constructor(
    private encryption: EncryptionService,
    config: ConfigService,
  ) {
    this.uploadDir = path.join(process.cwd(), 'uploads');
  }

  async ensureUploadDir(): Promise<void> {
    await fs.mkdir(this.uploadDir, { recursive: true });
  }

  getExtension(mime?: string): string {
    return MIME_TO_EXT[mime ?? ''] ?? '';
  }

  guessMime(filename: string): string {
    const ext = path.extname(filename).replace('.enc', '');
    return EXT_TO_MIME[ext] ?? 'application/octet-stream';
  }

  private randomId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  async saveMedia(
    mimeType: string,
    data: Buffer,
  ): Promise<string> {
    await this.ensureUploadDir();
    const ext = this.getExtension(mimeType);
    const filename = `${this.randomId()}${ext}.enc`;

    const encrypted = this.encryption.encryptBuffer(data);
    const filepath = path.join(this.uploadDir, filename);
    await fs.writeFile(filepath, encrypted);
    return filename;
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
}
