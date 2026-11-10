import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            status: true,
          },
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
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            status: true,
          },
        },
        paymentMethods: true,
        subscriptions: { include: { plan: true } },
      },
    });
    if (!profile) throw new NotFoundException('Organizer not found');
    return profile;
  }

  async reviewKyc(id: string, dto: ReviewKycDto, adminId: string) {
    const rejectionReasons = [
      'Incomplete or invalid documentation',
      'Business details could not be verified',
      'Suspected fraudulent information',
      'Does not meet platform requirements',
    ];
    if (
      dto.kycStatus === KycStatus.REJECTED &&
      !rejectionReasons.includes(dto.notes ?? '')
    ) {
      throw new BadRequestException('Select a valid KYC rejection reason.');
    }
    if (
      dto.kycStatus === KycStatus.NEEDS_REVISION &&
      !dto.notes?.trim()
    ) {
      throw new BadRequestException(
        'Feedback is required when requesting changes.',
      );
    }

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
      include: { organizer: { select: { userId: true } } },
    });
    if (!method) throw new NotFoundException('Payment method not found');

    const updated = await this.prisma.paymentMethod.update({
      where: { id },
      data: { isActive: true },
    });
    await this.notifications.create({
      userId: method.organizer.userId,
      title: 'Payment Method Approved',
      message: 'Your payment method has been approved and can now receive ticket payments.',
      type: 'PAYMENT_METHOD_APPROVED',
      metadata: { paymentMethodId: id },
    });
    return updated;
  }

  async rejectPaymentMethod(id: string, reason: string) {
    const method = await this.prisma.paymentMethod.findUnique({
      where: { id },
      include: { organizer: { select: { userId: true } } },
    });
    if (!method) throw new NotFoundException('Payment method not found');
    if (!reason?.trim()) {
      throw new BadRequestException('A rejection reason is required.');
    }

    await this.prisma.paymentMethod.delete({ where: { id } });
    await this.notifications.create({
      userId: method.organizer.userId,
      title: 'Payment Method Rejected',
      message: `Your payment method was rejected. Reason: ${reason.trim()}`,
      type: 'PAYMENT_METHOD_REJECTED',
      metadata: { paymentMethodId: id },
    });
    return { success: true };
  }

  async suspend(id: string, reason: string, adminId: string) {
    const allowedReasons = [
      'Violation of platform terms',
      'Fraudulent or misleading KYC documents',
      'Multiple attendee complaints',
      'Failure to fulfil event obligations',
    ];
    if (!allowedReasons.includes(reason)) {
      throw new BadRequestException('Select a valid suspension reason.');
    }

    const profile = await this.prisma.organizerProfile.findUnique({
      where: { id },
      select: { id: true, userId: true, businessName: true },
    });
    if (!profile) throw new NotFoundException('Organizer not found');
    if (profile.userId === adminId) {
      throw new BadRequestException('You cannot suspend your own account.');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: profile.userId },
        data: { status: 'SUSPENDED', suspensionReason: reason },
      }),
      this.prisma.organizerProfile.update({
        where: { id },
        data: { suspensionReason: reason },
      }),
    ]);
    await this.notifications.create({
      userId: profile.userId,
      title: 'Account Suspended',
      message: `Your organizer account has been suspended. Reason: ${reason}`,
      type: 'ACCOUNT_SUSPENDED',
      metadata: { organizerId: id },
    });

    return { id, status: 'SUSPENDED', suspensionReason: reason };
  }
}
