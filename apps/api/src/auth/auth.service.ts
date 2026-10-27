import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private email: EmailService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { organizerProfile: true }, // Required to get Organizer suspension reason
    });

    if (!user) throw new UnauthorizedException('Invalid credentials.');
    
    // Block DELETED users entirely
    if (user.status === 'DELETED') {
      throw new UnauthorizedException('This account has been deleted.');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials.');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { accessToken, refreshToken } = this.signTokens(user);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken,
        refreshTokenCreatedAt: new Date(),
      },
    });

    // Determine the correct suspension reason (User level or Organizer level)
    const suspensionReason = user.suspensionReason || user.organizerProfile?.suspensionReason || null;

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        suspensionReason,
      },
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; email: string; role: string };
    try {
      payload = this.jwt.verify(refreshToken) as any;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status === 'DELETED') {
      throw new UnauthorizedException('User not found or inactive.');
    }

    if (user.refreshToken && user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Refresh token has been rotated.');
    }

    const { accessToken, refreshToken: newRefreshToken } = this.signTokens(user);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken, refreshTokenCreatedAt: new Date() },
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  private signTokens(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwt.sign(payload),
      refreshToken: this.jwt.sign(payload, { expiresIn: '7d' }),
    };
  }
}
