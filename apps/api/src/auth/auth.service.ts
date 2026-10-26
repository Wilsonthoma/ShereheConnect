import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email';
import { verifyEmailTemplate, resetPasswordTemplate } from '../email/templates';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RequestContext } from './helpers/request-context.helper';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly OTP_MAX_ATTEMPTS = 5;

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  /* ============================================
     REGISTER
     ============================================ */
  async register(dto: RegisterDto, ctx?: RequestContext) {
    const normalizedPhone = this.normalizePhone(dto.phone);
    const role = dto.role || 'ATTENDEE';
    const requiresVerification = role === 'ORGANIZER';

    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { phone: normalizedPhone }] },
    });

    if (existing) {
      if (existing.email === dto.email) {
        throw new ConflictException('Email is already registered');
      }
      throw new ConflictException('Phone number is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    let otp: string | null = null;
    let otpHash: string | null = null;
    let expires: Date | null = null;

    if (requiresVerification) {
      otp = this.generateOTP();
      otpHash = this.hashToken(otp);
      expires = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: normalizedPhone,
        passwordHash,
        fullName: dto.fullName,
        role,
        status: 'ACTIVE',
        emailVerified: !requiresVerification,
        emailVerifiedAt: requiresVerification ? null : new Date(),
        emailVerificationToken: otpHash,
        emailVerificationExpires: expires,
        emailVerificationAttempts: 0,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (role === 'ORGANIZER') {
      await this.prisma.organizerProfile.create({
        data: {
          userId: user.id,
          businessName: dto.fullName,
          organizerType: 'INDIVIDUAL',
          county: 'Nairobi',
          kycStatus: 'PENDING',
        },
      });

      if (otp) {
        const template = verifyEmailTemplate({
          fullName: user.fullName,
          otp,
          expiryMinutes: this.OTP_EXPIRY_MINUTES,
        });
        // EmailModule injection removed; using env directly
        this.sendEmailFallback(user.email, template).catch((err) =>
          this.logger.error('OTP email failed:', err),
        );
      }
    }

    this.logger.log(`New ${role} registered: ${user.email}`);

    const { accessToken, refreshToken } = await this.signTokens(
      user.id,
      user.email,
      user.role,
      false,
    );

    // Record login session
    if (ctx) {
      await this.recordSession(user.id, ctx);
    }

    return {
      user: { ...user, requiresVerification },
      accessToken,
      refreshToken,
    };
  }

  /* ============================================
     LOGIN
     ============================================ */
  async login(dto: LoginDto, ctx?: RequestContext) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (user.status !== 'ACTIVE') throw new UnauthorizedException('Account is not active');

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const remember = dto.remember === true;
    const { accessToken, refreshToken } = await this.signTokens(
      user.id,
      user.email,
      user.role,
      remember,
    );

    if (ctx) {
      await this.recordSession(user.id, ctx);
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
      },
      accessToken,
      refreshToken,
    };
  }

  /* ============================================
     REFRESH ACCESS TOKEN
     ============================================ */
  async refresh(refreshToken: string, ctx?: RequestContext) {
    const tokenHash = this.hashToken(refreshToken);

    const user = await this.prisma.user.findFirst({
      where: {
        refreshToken: tokenHash,
        refreshTokenExpires: { gt: new Date() },
        status: 'ACTIVE',
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate — issue new access + refresh tokens
    // Preserve "remember me" duration if still valid
    const wasRemembered =
      user.refreshTokenExpires &&
      user.refreshTokenExpires.getTime() - Date.now() > 7 * 24 * 60 * 60 * 1000;

    const { accessToken, refreshToken: newRefreshToken } = await this.signTokens(
      user.id,
      user.email,
      user.role,
      !!wasRemembered,
    );

    // Update session activity
    await this.prisma.loginSession.updateMany({
      where: { userId: user.id, isActive: true },
      data: { lastActiveAt: new Date() },
    });

    this.logger.log(`Token refreshed: ${user.email}`);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  /* ============================================
     LOGOUT ALL DEVICES
     ============================================ */
  async logoutAll(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken: null,
        refreshTokenExpires: null,
        refreshTokenCreatedAt: null,
      },
    });

    await this.prisma.loginSession.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false, revokedAt: new Date() },
    });

    this.logger.log(`All sessions revoked: ${user.email}`);
    return { message: 'Logged out from all devices' };
  }

  /* ============================================
     GET LOGIN SESSIONS
     ============================================ */
  async getSessions(userId: string) {
    const sessions = await this.prisma.loginSession.findMany({
      where: { userId },
      orderBy: { lastActiveAt: 'desc' },
      take: 20,
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        deviceLabel: true,
        isActive: true,
        lastActiveAt: true,
        createdAt: true,
        revokedAt: true,
      },
    });

    return { sessions };
  }

  /* ============================================
     VERIFY OTP
     ============================================ */
  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) throw new BadRequestException('Invalid email or code');

    if (user.emailVerified) {
      return { message: 'Email is already verified', alreadyVerified: true };
    }

    if (user.emailVerificationAttempts >= this.OTP_MAX_ATTEMPTS) {
      throw new BadRequestException(
        'Too many incorrect attempts. Please request a new code.',
      );
    }

    if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
      throw new BadRequestException('Code has expired. Please request a new one.');
    }

    const otpHash = this.hashToken(dto.otp);
    if (otpHash !== user.emailVerificationToken) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerificationAttempts: user.emailVerificationAttempts + 1 },
      });
      const remaining = this.OTP_MAX_ATTEMPTS - (user.emailVerificationAttempts + 1);
      throw new BadRequestException(
        remaining > 0
          ? `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
          : 'Invalid code. Please request a new one.',
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationExpires: null,
        emailVerificationAttempts: 0,
      },
    });

    this.logger.log(`Email verified via OTP: ${user.email}`);
    return { message: 'Email verified successfully', verified: true };
  }

  /* ============================================
     RESEND OTP
     ============================================ */
  async resendOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      return { message: 'If your email is registered, a code has been sent.' };
    }

    if (user.emailVerified) {
      return { message: 'Email is already verified', alreadyVerified: true };
    }

    const otp = this.generateOTP();
    const otpHash = this.hashToken(otp);
    const expires = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: otpHash,
        emailVerificationExpires: expires,
        emailVerificationAttempts: 0,
      },
    });

    const template = verifyEmailTemplate({
      fullName: user.fullName,
      otp,
      expiryMinutes: this.OTP_EXPIRY_MINUTES,
    });
    await this.sendEmailFallback(user.email, template);

    this.logger.log(`OTP resent: ${user.email}`);
    return { message: 'A new code has been sent to your email.' };
  }

  /* ============================================
     FORGOT PASSWORD
     ============================================ */
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      return { message: 'If your email is registered, a reset link has been sent.' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: tokenHash,
        passwordResetExpires: expires,
      },
    });

    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;
    const template = resetPasswordTemplate({
      fullName: user.fullName,
      resetUrl,
    });
    await this.sendEmailFallback(user.email, template);

    this.logger.log(`Password reset requested: ${user.email}`);
    return { message: 'If your email is registered, a reset link has been sent.' };
  }

  /* ============================================
     RESET PASSWORD
     ============================================ */
  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashToken(dto.token);

    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: tokenHash,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        passwordChangedAt: new Date(),
        // Revoke all sessions for security
        refreshToken: null,
        refreshTokenExpires: null,
        refreshTokenCreatedAt: null,
      },
    });

    await this.prisma.loginSession.updateMany({
      where: { userId: user.id, isActive: true },
      data: { isActive: false, revokedAt: new Date() },
    });

    this.logger.log(`Password reset: ${user.email}`);
    return { message: 'Password reset successfully. You can now log in.' };
  }

  /* ============================================
     CHANGE PASSWORD
     ============================================ */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
        // Revoke all sessions on password change
        refreshToken: null,
        refreshTokenExpires: null,
        refreshTokenCreatedAt: null,
      },
    });

    await this.prisma.loginSession.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false, revokedAt: new Date() },
    });

    return { message: 'Password changed successfully. Please log in again.' };
  }

  /* ============================================
     UPDATE PROFILE
     ============================================ */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const data: { fullName?: string; phone?: string } = {};

    if (dto.fullName) data.fullName = dto.fullName.trim();

    if (dto.phone) {
      const normalized = this.normalizePhone(dto.phone);
      if (normalized !== user.phone) {
        const taken = await this.prisma.user.findUnique({
          where: { phone: normalized },
        });
        if (taken) throw new ConflictException('Phone number is already registered');
        data.phone = normalized;
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        status: true,
        emailVerified: true,
      },
    });

    this.logger.log(`Profile updated: ${updated.email}`);
    return { message: 'Profile updated successfully', user: updated };
  }

  /* ============================================
     HELPERS
     ============================================ */

  private async signTokens(
    userId: string,
    email: string,
    role: string,
    remember: boolean,
  ) {
    const payload = { sub: userId, email, role };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    const refreshExpiry = remember
      ? (process.env.JWT_REFRESH_REMEMBER_IN || '30d')
      : (process.env.JWT_REFRESH_EXPIRES_IN || '7d');

    const refreshToken = crypto.randomBytes(48).toString('hex');
    const refreshHash = this.hashToken(refreshToken);

    const expiresAt = this.computeExpiry(refreshExpiry);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken: refreshHash,
        refreshTokenExpires: expiresAt,
        refreshTokenCreatedAt: new Date(),
      },
    });

    return { accessToken, refreshToken };
  }

  private async recordSession(userId: string, ctx: RequestContext) {
    try {
      await this.prisma.loginSession.create({
        data: {
          userId,
          ipAddress: ctx.ipAddress?.slice(0, 45),
          userAgent: ctx.userAgent?.slice(0, 500),
          deviceLabel: ctx.deviceLabel?.slice(0, 100),
        },
      });
    } catch (err) {
      this.logger.error('Failed to record session:', err);
    }
  }

  /**
   * Fallback email sender when EmailModule isn't injected.
   * Uses Resend SDK directly to avoid circular dependency.
   */
  private async sendEmailFallback(
    to: string,
    template: { subject: string; html: string; text: string },
  ): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      this.logger.warn(`Email skipped (no API key): to=${to}`);
      return;
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'ShereheConnect <onboarding@resend.dev>',
          to,
          subject: template.subject,
          html: template.html,
          text: template.text,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        this.logger.error(`Email send failed: ${err}`);
        return;
      }

      const data = (await res.json()) as { id?: string };
      this.logger.log(`Email sent: ${data.id} → ${to}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Email exception: ${msg}`);
    }
  }

  private computeExpiry(expiry: string): Date {
    const match = /^(\d+)([smhd])$/.exec(expiry);
    if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return new Date(Date.now() + value * multipliers[unit]);
  }

  private generateOTP(): string {
    const digits = '0123456789';
    let otp = '';
    const bytes = crypto.randomBytes(6);
    for (let i = 0; i < 6; i++) {
      otp += digits[bytes[i] % 10];
    }
    return otp;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private normalizePhone(phone: string): string {
    if (phone.startsWith('0')) return '+254' + phone.slice(1);
    if (phone.startsWith('254')) return '+' + phone;
    return phone;
  }
}
