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

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly OTP_MAX_ATTEMPTS = 5;

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private email: EmailService,
  ) {}

  /* ============================================
     REGISTER
     - ATTENDEE: auto-verified, no OTP
     - ORGANIZER: requires OTP verification
     ============================================ */
  async register(dto: RegisterDto) {
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

    // Only organizers need OTP verification
    let otp: string | null = null;
    let otpHash: string | null = null;
    let expires: Date | null = null;

    if (requiresVerification) {
      otp = this.generateOTP();
      otpHash = this.hashOTP(otp);
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
        // Attendees auto-verified; organizers need OTP
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

      // Send OTP email only to organizers
      if (otp) {
        const template = verifyEmailTemplate({
          fullName: user.fullName,
          otp,
          expiryMinutes: this.OTP_EXPIRY_MINUTES,
        });
        this.email
          .send({ to: user.email, ...template })
          .catch((err) => this.logger.error('OTP email failed:', err));
      }
    }

    this.logger.log(`New ${role} registered: ${user.email}`);

    const token = await this.signToken(user.id, user.email, user.role);

    return {
      user: {
        ...user,
        requiresVerification,
      },
      accessToken: token,
    };
  }

  /* ============================================
     LOGIN
     ============================================ */
  async login(dto: LoginDto) {
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

    const token = await this.signToken(user.id, user.email, user.role);

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
      accessToken: token,
    };
  }

  /* ============================================
     VERIFY OTP
     ============================================ */
  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException('Invalid email or code');
    }

    if (user.emailVerified) {
      return { message: 'Email is already verified', alreadyVerified: true };
    }

    if (user.emailVerificationAttempts >= this.OTP_MAX_ATTEMPTS) {
      throw new BadRequestException(
        'Too many incorrect attempts. Please request a new code.',
      );
    }

    if (
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date()
    ) {
      throw new BadRequestException('Code has expired. Please request a new one.');
    }

    const otpHash = this.hashOTP(dto.otp);
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
    const otpHash = this.hashOTP(otp);
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
    await this.email.send({ to: user.email, ...template });

    this.logger.log(`OTP resent: ${user.email}`);
    return { message: 'A new code has been sent to your email.' };
  }

  /* ============================================
     FORGOT PASSWORD (link-based)
     ============================================ */
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      return { message: 'If your email is registered, a reset link has been sent.' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
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
    await this.email.send({ to: user.email, ...template });

    this.logger.log(`Password reset requested: ${user.email}`);
    return { message: 'If your email is registered, a reset link has been sent.' };
  }

  /* ============================================
     RESET PASSWORD
     ============================================ */
  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');

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
      },
    });

    this.logger.log(`Password reset: ${user.email}`);
    return { message: 'Password reset successfully. You can now log in.' };
  }

  /* ============================================
     CHANGE PASSWORD (logged in)
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
      },
    });

    return { message: 'Password changed successfully' };
  }

  /* ============================================
     UPDATE PROFILE (logged in)
     ============================================ */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const data: { fullName?: string; phone?: string } = {};

    if (dto.fullName) {
      data.fullName = dto.fullName.trim();
    }

    if (dto.phone) {
      const normalized = this.normalizePhone(dto.phone);
      if (normalized !== user.phone) {
        const taken = await this.prisma.user.findUnique({
          where: { phone: normalized },
        });
        if (taken) {
          throw new ConflictException('Phone number is already registered');
        }
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
  private generateOTP(): string {
    const digits = '0123456789';
    let otp = '';
    const bytes = crypto.randomBytes(6);
    for (let i = 0; i < 6; i++) {
      otp += digits[bytes[i] % 10];
    }
    return otp;
  }

  private hashOTP(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  private async signToken(userId: string, email: string, role: string) {
    return this.jwt.signAsync({ sub: userId, email, role });
  }

  private normalizePhone(phone: string): string {
    if (phone.startsWith('0')) return '+254' + phone.slice(1);
    if (phone.startsWith('254')) return '+' + phone;
    return phone;
  }
}
