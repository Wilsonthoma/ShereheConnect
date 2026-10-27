import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  SubmitProfileDto,
  REQUIRED_DOCS,
} from './dto/submit-profile.dto';
import { AddPaymentMethodDto } from './dto/add-payment-method.dto';
import { KycStatus, PaymentMethodType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrganizerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async getOwnProfile(userId: string) {
    const profile = await this.prisma.organizerProfile.findUnique({
      where: { userId },
      include: {
        paymentMethods: { orderBy: { createdAt: 'desc' } },
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { plan: true },
        },
      },
    });

    if (!profile) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, fullName: true, email: true, phone: true },
      });
      if (!user || user.role !== 'ORGANIZER') {
        throw new ForbiddenException('Organizer profile not available');
      }

      const created = await this.prisma.organizerProfile.create({
        data: {
          userId,
          businessName: user.fullName || 'Unnamed Organizer',
          organizerType: 'INDIVIDUAL',
          county: 'Nairobi',
          phone: user.phone ?? null,
          kycStatus: 'PENDING',
        },
        include: {
          paymentMethods: { orderBy: { createdAt: 'desc' } },
          subscriptions: {
            where: { status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { plan: true },
          },
        },
      });

      return {
        ...created,
        submitted: false,
        activeSubscription: null,
        subscriptions: undefined,
      };
    }

    const submitted = Boolean(
      profile.businessName && profile.county && profile.phone && profile.kraPin,
    );

    return {
      ...profile,
      submitted,
      activeSubscription: profile.subscriptions[0] ?? null,
      subscriptions: undefined,
    };
  }

  async submitProfile(userId: string, dto: SubmitProfileDto) {
    // ── Validate required documents (BUSINESS_PERMIT + NATIONAL_ID) ──
    const providedTypes = new Set(
      (dto.kycDocuments ?? []).map((d) => d.type),
    );
    const missing = REQUIRED_DOCS.filter((t) => !providedTypes.has(t));
    if (missing.length > 0) {
      throw new BadRequestException(
        `Missing required documents: ${missing.join(', ')}`,
      );
    }

    // ── Validate that no unexpected doc type sneaks in ──
    const allowed = new Set(['BUSINESS_PERMIT', 'NATIONAL_ID', 'OTHER']);
    for (const doc of dto.kycDocuments) {
      if (!allowed.has(doc.type)) {
        throw new BadRequestException(`Invalid document type: ${doc.type}`);
      }
    }

    // ── Normalize phone and KRA PIN ──
    const normalizedPhone = this.normalizeKenyanPhone(dto.phone);
    const normalizedKra = dto.kraPin.trim().toUpperCase();

    const data = {
      businessName: dto.businessName.trim(),
      organizerType: dto.organizerType,
      county: dto.county.trim(),
      bio: dto.bio?.trim() || null,
      logoUrl: dto.logoUrl || null,
      phone: normalizedPhone,
      kraPin: normalizedKra,
      kycStatus: KycStatus.PENDING,
      kycDocuments: dto.kycDocuments as any,
      kycReviewedBy: null,
      kycReviewedAt: null,
      kycNotes: null,
    };

    const existing = await this.prisma.organizerProfile.findUnique({
      where: { userId },
    });

    if (!existing) {
      return this.prisma.organizerProfile.create({
        data: { userId, ...data },
      });
    }

    await this.notifications.notifyAdmins(
      'New KYC Submission',
      `${data.businessName} has submitted their KYC documents for verification.`,
      'KYC_SUBMITTED',
      { organizerId: existing.id }
    );
    return this.prisma.organizerProfile.update({
      where: { userId },
      data,
    });
  }

  private normalizeKenyanPhone(raw: string): string {
    // Trim spaces, remove dashes
    let p = raw.replace(/[\s-]/g, '');
    // +254 or 254 prefix
    if (p.startsWith('+254')) p = '0' + p.slice(4);
    else if (p.startsWith('254')) p = '0' + p.slice(3);
    // Now must be 0XXXXXXXXX
    if (!/^0\d{9}$/.test(p)) {
      throw new BadRequestException('Invalid Kenyan phone number');
    }
    return p;
  }

  async listOwnPaymentMethods(userId: string) {
    const profile = await this.prisma.organizerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new NotFoundException('Organizer profile not found');

    return this.prisma.paymentMethod.findMany({
      where: { organizerId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addPaymentMethod(userId: string, dto: AddPaymentMethodDto) {
    const profile = await this.prisma.organizerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new NotFoundException('Organizer profile not found');

    if (
      (dto.methodType === PaymentMethodType.PAYBILL ||
        dto.methodType === PaymentMethodType.TILL) &&
      !dto.shortcode
    ) {
      throw new BadRequestException('shortcode is required for Paybill/Till');
    }
    if (dto.methodType === PaymentMethodType.PAYBILL && !dto.accountNumber) {
      throw new BadRequestException('accountNumber is required for Paybill');
    }
    if (
      (dto.methodType === PaymentMethodType.POCHI ||
        dto.methodType === PaymentMethodType.SEND_MONEY) &&
      !dto.phoneNumber
    ) {
      throw new BadRequestException(
        'phoneNumber is required for Pochi/Send Money',
      );
    }

    return this.prisma.paymentMethod.create({
      data: {
        organizerId: profile.id,
        methodType: dto.methodType,
        shortcode: dto.shortcode ?? null,
        accountNumber: dto.accountNumber ?? null,
        phoneNumber: dto.phoneNumber ?? null,
        displayLabel: dto.displayLabel ?? null,
        isActive: false,
        isDefault: false,
        c2bRegistered: false,
      },
    });
  }

  async deletePaymentMethod(userId: string, id: string) {
    const profile = await this.prisma.organizerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new NotFoundException('Organizer profile not found');

    const method = await this.prisma.paymentMethod.findFirst({
      where: { id, organizerId: profile.id },
    });
    if (!method) throw new NotFoundException('Payment method not found');

    await this.prisma.paymentMethod.delete({ where: { id } });
    return { success: true };
  }
}
