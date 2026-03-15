import { Injectable } from '@nestjs/common';
import * as crypto from 'node:crypto';

const SALT = 'fulluf-chat-anonymous';
const HASH_PREFIX_LENGTH = 8;

@Injectable()
export class HashService {
  /**
   * Creates an anonymous user hash from IP address.
   * Same IP always produces the same hash (deterministic).
   */
  hashIpToUsername(ip: string): string {
    const hash = crypto
      .createHash('sha256')
      .update(ip + SALT)
      .digest('hex');
    return `#${hash.slice(0, HASH_PREFIX_LENGTH)}`;
  }
}
