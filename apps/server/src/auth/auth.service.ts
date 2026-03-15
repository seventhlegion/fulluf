import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { HashService } from '../common/hash.service';

export interface JwtPayload {
  sub: string; // hashed username (from IP)
  username: string; // same hash for display
}

export interface RefreshPayload extends JwtPayload {
  type: 'refresh';
}

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private config: ConfigService,
    private hash: HashService,
  ) {}

  validateCredentials(username: string, password: string): boolean {
    const expectedUser = this.config.get<string>('auth.username');
    const expectedPass = this.config.get<string>('auth.password');
    return username === expectedUser && password === expectedPass;
  }

  login(
    dto: { username: string; password: string },
    clientIp: string,
  ): { accessToken: string; refreshToken: string; username: string } {
    if (!this.validateCredentials(dto.username, dto.password)) {
      throw new UnauthorizedException('Invalid username or password');
    }
    const hashedUsername = this.hash.hashIpToUsername(clientIp);
    const payload: JwtPayload = {
      sub: hashedUsername,
      username: hashedUsername,
    };
    const accessToken = this.jwt.sign(payload, {
      expiresIn: this.config.get<string>('auth.jwtExpiresIn'),
    });
    const refreshToken = this.jwt.sign(
      { ...payload, type: 'refresh' } as RefreshPayload,
      { expiresIn: this.config.get<string>('auth.jwtRefreshExpiresIn') },
    );
    return { accessToken, refreshToken, username: hashedUsername };
  }

  refresh(refreshToken: string): { accessToken: string; refreshToken: string; username: string } {
    try {
      const payload = this.jwt.verify<RefreshPayload>(refreshToken);
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }
      const { type: _t, ...basePayload } = payload;
      const accessToken = this.jwt.sign(basePayload, {
        expiresIn: this.config.get<string>('auth.jwtExpiresIn'),
      });
      const newRefreshToken = this.jwt.sign(
        { ...basePayload, type: 'refresh' } as RefreshPayload,
        { expiresIn: this.config.get<string>('auth.jwtRefreshExpiresIn') },
      );
      return {
        accessToken,
        refreshToken: newRefreshToken,
        username: basePayload.username,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  validatePayload(payload: JwtPayload): JwtPayload {
    return payload;
  }
}
