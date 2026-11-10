import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { verifyEmailTemplate } from '../email/templates/verify-email.template';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private email: EmailService,
  ) {}

  /* ============================================
     REGISTER & LOGIN
  ============================================ */

  async register(dto: RegisterDto, context?: any) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { phone: dto.phone }],
      },
    });

    if (existingUser) {
      throw new BadRequestException('Email or phone number is already in use.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // 1. Generate a 6-digit OTP
    const otp = randomInt(100000, 1000000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        fullName: dto.fullName,
        role: dto.role || 'ATTENDEE',
        status: 'ACTIVE',
        emailVerificationToken: otp,
        emailVerificationExpires: expires,
      },
    });

    try {
      await this.sendVerificationOtp(user.email, user.fullName, otp);
    } catch (error) {
      await this.prisma.user.delete({ where: { id: user.id } });
      throw error;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
      },
      message: 'Verification code sent. Please verify your email.',
      requiresVerification: true,
    };
  }

  async login(dto: LoginDto, context?: any) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { organizerProfile: true },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials.');
    if (user.status === 'DELETED')
      throw new UnauthorizedException('This account has been deleted.');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials.');
    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in.',
      );
    }

    const suspensionReason =
      user.suspensionReason || user.organizerProfile?.suspensionReason || null;
    if (user.status === 'SUSPENDED') {
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
        accessToken: null,
        refreshToken: null,
      };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { accessToken, refreshToken } = this.signTokens(user);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken, refreshTokenCreatedAt: new Date() },
    });

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

  async refresh(refreshToken: string, context?: any) {
    let payload: { sub: string; email: string; role: string };
    try {
      payload = this.jwt.verify(refreshToken) as any;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || user.status === 'DELETED') {
      throw new UnauthorizedException('User not found or inactive.');
    }

    if (user.refreshToken && user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Refresh token has been rotated.');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      this.signTokens(user);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: newRefreshToken,
        refreshTokenCreatedAt: new Date(),
      },
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  /* ============================================
     OTP & VERIFICATION
  ============================================ */

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) throw new NotFoundException('User not found');
    if (user.emailVerified) {
      return { message: 'Email already verified', alreadyVerified: true };
    }

    if (user.emailVerificationToken !== dto.otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date()
    ) {
      throw new BadRequestException('OTP has expired');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  async resendOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');
    if (user.emailVerified) {
      return { message: 'Email already verified', alreadyVerified: true };
    }

    const otp = randomInt(100000, 1000000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: otp,
        emailVerificationExpires: expires,
        emailVerificationAttempts: { increment: 1 },
      },
    });

    await this.sendVerificationOtp(user.email, user.fullName, otp);

    return { message: 'OTP sent successfully', alreadyVerified: false };
  }

  private async sendVerificationOtp(email: string, fullName: string, otp: string) {
    const template = verifyEmailTemplate({ fullName, otp, expiryMinutes: 10 });
    const result = await this.email.send({
      to: email,
      ...template,
    });

    if (!result.success) {
      throw new ServiceUnavailableException(
        'Could not send verification email. Please try again.',
      );
    }
  }

  /* ============================================
     PASSWORD RESET
  ============================================ */

  async forgotPassword(dto: ForgotPasswordDto) {
    // Implement your forgot password logic here
    return { message: 'Password reset link sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    // Implement your reset password logic here
    return { message: 'Password reset successfully' };
  }

  /* ============================================
     PROFILE & SECURITY
  ============================================ */

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { ...dto },
    });
    return {
      message: 'Profile updated',
      user: { id: user.id, fullName: user.fullName },
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    return { message: 'Password changed successfully' };
  }

  async logoutAll(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null, refreshTokenCreatedAt: null },
    });
    return { message: 'Logged out from all devices' };
  }

  async getSessions(userId: string) {
    return this.prisma.loginSession.findMany({
      where: { userId, isActive: true },
      orderBy: { lastActiveAt: 'desc' },
    });
  }

  /* ============================================
     JWT HELPER
  ============================================ */

  private signTokens(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwt.sign(payload),
      refreshToken: this.jwt.sign(payload, { expiresIn: '7d' }),
    };
  }
}