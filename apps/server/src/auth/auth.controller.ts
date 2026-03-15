import { Body, Controller, Post, Req, UnauthorizedException, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  login(@Body() dto: LoginDto, @Req() req: { ip?: string }) {
    const ip = req.ip ?? (req as { connection?: { remoteAddress?: string } }).connection?.remoteAddress ?? '127.0.0.1';
    return this.auth.login(dto, ip);
  }

  @Post('refresh')
  refresh(@Body() body: { refreshToken: string }) {
    if (!body?.refreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }
    return this.auth.refresh(body.refreshToken);
  }
}
