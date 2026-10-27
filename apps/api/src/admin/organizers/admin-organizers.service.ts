import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReviewKycDto } from './dto/review-kyc.dto';
import { KycStatus } from '@prisma/client';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class AdminOrganizersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async list() {
    return this.prisma.organizerProfile.findMany({
      include: {
        user: {
          select: { id: true, email: true, fullName: true, phone: true },
        },
        paymentMethods: true,
      },
      orderBy: [
        { kycStatus: 'asc' }, // PENDING, NEEDS_REVISION first
        { createdAt: 'desc' },
      ],
    });
  }

  async getOne(id: string) {
    const profile = await this.prisma.organizerProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, fullName: true, phone: true } },
        paymentMethods: true,
        subscriptions: { include: { plan: true } },
      },
    });
    if (!profile) throw new NotFoundException('Organizer not found');
    return profile;
  }

  async reviewKyc(id: string, dto: ReviewKycDto, adminId: string) {
    const profile = await this.prisma.organizerProfile.findUnique({
      where: { id },
    });
    if (!profile) throw new NotFoundException('Organizer not found');

    const updated = await this.prisma.organizerProfile.update({
      where: { id },
      data: {
        kycStatus: dto.kycStatus,
        kycNotes: String(dto.kycStatus) === 'SUSPENDED' ? null : (dto.notes ?? null),
        suspensionReason: String(dto.kycStatus) === 'SUSPENDED' ? dto.notes : null,
        kycReviewedBy: adminId,
        kycReviewedAt: new Date(),
      },
    });

    // Auto-enroll in STARTER plan if approved for the first time
    if (dto.kycStatus === KycStatus.VERIFIED) {
      const existingSub = await this.prisma.subscription.findFirst({
        where: { organizerId: id, status: 'ACTIVE' },
      });

      if (!existingSub) {
        const starterPlan = await this.prisma.subscriptionPlan.findUnique({
          where: { code: 'STARTER' },
        });
        if (starterPlan) {
          await this.prisma.subscription.create({
            data: {
              organizerId: id,
              planId: starterPlan.id,
              status: 'ACTIVE',
              currentPeriodStart: new Date(),
              // 100 years from now for the free plan
              currentPeriodEnd: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
            },
          });
        }
      }
    }

    // Notify the organizer
    const title = dto.kycStatus === 'VERIFIED' ? 'KYC Approved' : 
                  dto.kycStatus === 'REJECTED' ? 'KYC Rejected' :
                  String(dto.kycStatus) === 'SUSPENDED' ? 'Account Suspended' : 'Action Required';
    
    let message = dto.kycStatus === 'VERIFIED' ? 'Your account has been verified. You can now create events.' :
                  dto.kycStatus === 'REJECTED' ? 'Your KYC application was rejected. Please check the feedback.' :
                  String(dto.kycStatus) === 'SUSPENDED' ? 'Your account has been suspended. Please contact support.' :
                  'Admin has requested changes to your KYC documents.';

    if (dto.notes) message += ` Reason: ${dto.notes}`;

    await this.notifications.create({
      userId: profile.userId,
      title,
      message,
      type: `KYC_${dto.kycStatus}`,
      metadata: { organizerId: id }
    });

    return updated;
  }

  async approvePaymentMethod(id: string) {
    const method = await this.prisma.paymentMethod.findUnique({
      where: { id },
    });
    if (!method) throw new NotFoundException('Payment method not found');

    return this.prisma.paymentMethod.update({
      where: { id },
      data: { isActive: true },
    });
  }
}
