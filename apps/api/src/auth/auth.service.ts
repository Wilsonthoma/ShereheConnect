import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const normalizedPhone = this.normalizePhone(dto.phone);

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { phone: normalizedPhone }],
      },
    });

    if (existing) {
      if (existing.email === dto.email) {
        throw new ConflictException('Email is already registered');
      }
      throw new ConflictException('Phone number is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: normalizedPhone,
        passwordHash,
        fullName: dto.fullName,
        role: 'ATTENDEE',
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    this.logger.log(`New user registered: ${user.email}`);

    const token = await this.signToken(user.id, user.email, user.role);

    return {
      user,
      accessToken: token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = await this.signToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
      },
      accessToken: token,
    };
  }

  private async signToken(userId: string, email: string, role: string) {
    return this.jwt.signAsync({
      sub: userId,
      email,
      role,
    });
  }

  private normalizePhone(phone: string): string {
    if (phone.startsWith('0')) {
      return '+254' + phone.slice(1);
    }
    if (phone.startsWith('254')) {
      return '+' + phone;
    }
    return phone;
  }
}

