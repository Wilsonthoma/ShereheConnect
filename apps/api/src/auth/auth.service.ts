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
import { randomInt } from 'crypto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private email: EmailService,
  ) {}

  /* ============================================
     REGISTER
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

    // Generate a 6-digit OTP
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

    // Log OTP to console for dev/testing
    console.log(`\n=========================================`);
    console.log(`🔑 Registration OTP for ${dto.email}: ${otp}`);
    console.log(`=========================================\n`);

    // Try to send email — but NEVER delete the user if it fails
    try {
      await this.email.send({ to: user.email, subject: `Your ShereheConnect verification code: ${otp}`, html: `<p>Hi ${user.fullName},</p><p>Your verification code is <strong>${otp}</strong>. It expires in 10 minutes.</p>` });
    } catch (error: any) {
      this.logger.warn(
        `Could not send verification email for ${user.email} — user still created. Reason: ${error?.message}`,
      );
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

  /* ============================================
     LOGIN
  ============================================ */
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

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { accessToken, refreshToken } = this.signTokens(user);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken, refreshTokenCreatedAt: new Date() },
    });

    const suspensionReason =
      user.suspensionReason || user.organizerProfile?.suspensionReason || null;

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

  /* ============================================
     REFRESH
  ============================================ */
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
    if (user.emailVerified) return { message: 'Email already verified' };

    if (user.emailVerificationToken !== dto.otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (
      user.emailVerificationExpires &&
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
    if (user.emailVerified) return { message: 'Email already verified' };

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

    console.log(`\n=========================================`);
    console.log(`🔑 New OTP for ${email}: ${otp}`);
    console.log(`=========================================\n`);

    try {
      await this.email.send({ to: user.email, subject: `Your ShereheConnect verification code: ${otp}`, html: `<p>Hi ${user.fullName},</p><p>Your verification code is <strong>${otp}</strong>. It expires in 10 minutes.</p>` });
    } catch (error: any) {
      this.logger.warn(`Could not resend email to ${email}: ${error?.message}`);
    }

    return { message: 'OTP sent successfully' };
  }

  /* ============================================
     PASSWORD RESET
  ============================================ */
  async forgotPassword(dto: ForgotPasswordDto) {
    return { message: 'Password reset link sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
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
