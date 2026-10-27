import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserStatus, KycStatus } from '@prisma/client';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateKycDto } from './dto/update-kyc.dto';

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListUsersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.role) where.role = query.role;
    if (query.status) where.status = query.status;
    if (query.q) {
      where.OR = [
        { email: { contains: query.q, mode: 'insensitive' } },
        { fullName: { contains: query.q, mode: 'insensitive' } },
        { phone: { contains: query.q } },
      ];
    }

    const since = new Date(Date.now() - ONLINE_WINDOW_MS);

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, phone: true, fullName: true, role: true,
          status: true, emailVerified: true, phoneVerified: true, profileImageUrl: true,
          lastLoginAt: true, createdAt: true,
          loginSessions: {
            where: { isActive: true }, orderBy: { lastActiveAt: 'desc' }, take: 1, select: { lastActiveAt: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const items = rows.map((u) => {
      const lastActive = u.loginSessions?.[0]?.lastActiveAt ?? null;
      const isOnline = lastActive ? lastActive >= since : false;
      const { loginSessions, ...rest } = u;
      return { ...rest, lastActiveAt: lastActive, isOnline };
    });

    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        organizerProfile: true,
        loginSessions: { where: { isActive: true }, orderBy: { lastActiveAt: 'desc' }, take: 10 },
        _count: { select: { bookings: true, approvedEvents: true, notifications: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const since = new Date(Date.now() - ONLINE_WINDOW_MS);
    const lastActive = user.loginSessions[0]?.lastActiveAt ?? null;
    const isOnline = lastActive ? lastActive >= since : false;

    const { passwordHash, refreshToken, refreshTokenExpires, refreshTokenCreatedAt, ...safe } = user as any;
    return { ...safe, lastActiveAt: lastActive, isOnline };
  }

  async updateStatus(id: string, dto: UpdateUserStatusDto, actorId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.id === actorId) throw new BadRequestException('You cannot change your own status');

    return this.prisma.user.update({
      where: { id },
      data: { 
        status: dto.status,
        suspensionReason: dto.status === 'SUSPENDED' ? dto.reason : null,
      },
      select: { id: true, email: true, status: true, updatedAt: true },
    });
  }

  async softDelete(id: string, actorId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.id === actorId) throw new BadRequestException('You cannot delete yourself');

    return this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.DELETED },
      select: { id: true, status: true },
    });
  }

  async verifyEmail(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.emailVerified) throw new BadRequestException('Email already verified');

    return this.prisma.user.update({
      where: { id },
      data: { emailVerified: true, emailVerifiedAt: new Date(), emailVerificationToken: null },
      select: { id: true, emailVerified: true, emailVerifiedAt: true },
    });
  }

  async revokeSessions(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const result = await this.prisma.loginSession.updateMany({
      where: { userId: id, isActive: true },
      data: { isActive: false, revokedAt: new Date() },
    });

    await this.prisma.user.update({
      where: { id },
      data: { refreshToken: null, refreshTokenExpires: null },
    });

    return { revoked: result.count };
  }

  async listOnlineUsers() {
    const since = new Date(Date.now() - ONLINE_WINDOW_MS);
    return this.prisma.user.findMany({
      where: {
        role: { in: ['ORGANIZER', 'ADMIN'] }, status: 'ACTIVE',
        loginSessions: { some: { isActive: true, lastActiveAt: { gte: since } } },
      },
      select: {
        id: true, fullName: true, email: true, role: true, profileImageUrl: true,
        loginSessions: { where: { isActive: true }, orderBy: { lastActiveAt: 'desc' }, take: 1, select: { lastActiveAt: true, deviceLabel: true, ipAddress: true } },
      },
      orderBy: { lastLoginAt: 'desc' }, take: 50,
    });
  }

  async listOrganizersKyc() {
    return this.prisma.organizerProfile.findMany({
      where: { kycStatus: { in: [KycStatus.PENDING, KycStatus.NEEDS_REVISION] } },
      include: { user: { select: { id: true, email: true, phone: true, fullName: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async reviewKyc(organizerId: string, dto: UpdateKycDto, actorId: string) {
    const profile = await this.prisma.organizerProfile.findUnique({ where: { id: organizerId } });
    if (!profile) throw new NotFoundException('Organizer profile not found');

    return this.prisma.organizerProfile.update({
      where: { id: organizerId },
      data: {
        kycStatus: dto.kycStatus,
        kycReviewedBy: actorId,
        kycReviewedAt: new Date(),
        kycNotes: dto.notes ?? null,
      },
    });
  }
}
