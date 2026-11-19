import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DarajaService } from './daraja.service';
import { InitiateSubscriptionDto } from './dto/initiate-subscription.dto';
import {
  BillingInterval,
  KycStatus,
  PaymentMethodApi,
  PaymentStatus,
  PaymentType,
  SubscriptionStatus,
} from '@prisma/client';

@Injectable()
export class SubscriptionsPaymentService {
  private readonly logger = new Logger(SubscriptionsPaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly daraja: DarajaService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {}

  async initiateUpgrade(userId: string, dto: InitiateSubscriptionDto) {
    const profile = await this.prisma.organizerProfile.findUnique({
      where: { userId },
      include: {
        subscriptions: {
          where: { status: SubscriptionStatus.ACTIVE },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { plan: true },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Organizer profile not found.');
    }

    if (profile.kycStatus !== KycStatus.VERIFIED) {
      throw new ForbiddenException(
        'Your KYC must be verified before upgrading your subscription.',
      );
    }

    const targetPlan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: dto.planCode },
    });

    if (!targetPlan || !targetPlan.isActive) {
      throw new NotFoundException(`Subscription plan ${dto.planCode} is unavailable.`);
    }

    if (targetPlan.priceKes <= 0) {
      throw new BadRequestException('Selected plan does not require M-Pesa payment.');
    }

    const currentSub = profile.subscriptions[0];
    if (
      currentSub &&
      currentSub.plan.code === targetPlan.code &&
      currentSub.currentPeriodEnd > new Date()
    ) {
      throw new BadRequestException(
        `You already have an active ${targetPlan.name} subscription.`,
      );
    }

    const formattedPhone = this.daraja.formatMsisdn(dto.phoneNumber);
    const billReference = `SUB-${targetPlan.code}-${profile.id.slice(0, 6).toUpperCase()}`;

    const stkResponse = await this.daraja.initiateStkPush({
      phoneNumber: formattedPhone,
      amountKes: targetPlan.priceKes,
      accountReference: billReference,
      transactionDesc: `${targetPlan.code} Plan`,
    });

    const payment = await this.prisma.payment.create({
      data: {
        paymentType: PaymentType.SUBSCRIPTION_PAYMENT,
        method: PaymentMethodApi.MPESA_STK,
        amountKes: targetPlan.priceKes,
        mpesaPhone: formattedPhone,
        billReference,
        checkoutRequestId: stkResponse.CheckoutRequestID,
        merchantRequestId: stkResponse.MerchantRequestID,
        status: PaymentStatus.PENDING,
        rawCallbackPayload: {
          organizerId: profile.id,
          userId,
          planId: targetPlan.id,
          planCode: targetPlan.code,
          initiatedAt: new Date().toISOString(),
        },
      },
    });

    this.logger.log(
      `STK Push initiated for organizer ${profile.id} -> plan ${targetPlan.code} (${stkResponse.CheckoutRequestID})`,
    );

    return {
      paymentId: payment.id,
      checkoutRequestId: stkResponse.CheckoutRequestID,
      merchantRequestId: stkResponse.MerchantRequestID,
      customerMessage: stkResponse.CustomerMessage,
      amountKes: targetPlan.priceKes,
      plan: {
        code: targetPlan.code,
        name: targetPlan.name,
      },
    };
  }

  async handleStkCallback(payload: any, callbackSecret?: string) {
    const expectedSecret = this.config.get<string>('MPESA_CALLBACK_SECRET');
    if (expectedSecret && callbackSecret !== expectedSecret) {
      this.logger.warn('Rejected STK callback with invalid secret token.');
      throw new UnauthorizedException('Invalid callback signature.');
    }

    const stkCallback = payload?.Body?.stkCallback;
    if (!stkCallback?.CheckoutRequestID) {
      this.logger.warn(`Malformed STK callback payload: ${JSON.stringify(payload)}`);
      throw new BadRequestException('Invalid STK callback structure.');
    }

    const checkoutRequestId: string = stkCallback.CheckoutRequestID;
    const resultCode = Number(stkCallback.ResultCode);
    const resultDesc: string = stkCallback.ResultDesc || 'Unknown result';

    const payment = await this.prisma.payment.findFirst({
      where: {
        checkoutRequestId,
        paymentType: PaymentType.SUBSCRIPTION_PAYMENT,
      },
    });

    if (!payment) {
      this.logger.warn(`No matching subscription payment for CheckoutRequestID: ${checkoutRequestId}`);
      return { ResultCode: 0, ResultDesc: 'Accepted (untracked request)' };
    }

    if (payment.status === PaymentStatus.SUCCESS || payment.status === PaymentStatus.FAILED) {
      this.logger.log(`Duplicate STK callback ignored for ${checkoutRequestId}`);
      return { ResultCode: 0, ResultDesc: 'Already processed' };
    }

    if (resultCode !== 0) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          failureReason: resultDesc,
          rawCallbackPayload: payload,
          processedAt: new Date(),
        },
      });
      this.logger.log(`Subscription STK failed (${checkoutRequestId}): ${resultDesc}`);
      return { ResultCode: 0, ResultDesc: 'Failure recorded' };
    }

    const items: Array<{ Name: string; Value?: string | number }> =
      stkCallback.CallbackMetadata?.Item ?? [];
    const getMeta = (name: string) => items.find((i) => i.Name === name)?.Value;

    const paidAmount = Number(getMeta('Amount') ?? 0);
    const mpesaReceipt = String(getMeta('MpesaReceiptNumber') ?? '').trim();
    const phoneUsed = String(getMeta('PhoneNumber') ?? payment.mpesaPhone ?? '');

    if (!mpesaReceipt) {
      this.logger.error(`Missing MpesaReceiptNumber in successful callback: ${checkoutRequestId}`);
      throw new BadRequestException('Missing M-Pesa receipt number.');
    }

    const duplicateReceipt = await this.prisma.payment.findUnique({
      where: { mpesaReceipt },
    });
    if (duplicateReceipt) {
      this.logger.warn(`Duplicate MpesaReceiptNumber ignored: ${mpesaReceipt}`);
      return { ResultCode: 0, ResultDesc: 'Duplicate receipt ignored' };
    }

    if (Math.round(paidAmount) < payment.amountKes) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.MISMATCHED,
          mpesaReceipt,
          mpesaPhone: phoneUsed,
          failureReason: `Expected KES ${payment.amountKes}, received KES ${paidAmount}`,
          rawCallbackPayload: payload,
          processedAt: new Date(),
        },
      });
      this.logger.warn(
        `Amount mismatch for ${checkoutRequestId}: expected ${payment.amountKes}, got ${paidAmount}`,
      );
      return { ResultCode: 0, ResultDesc: 'Amount mismatch logged' };
    }

    const initMeta = (payment.rawCallbackPayload as Record<string, any>) || {};
    const organizerId: string | undefined = initMeta.organizerId;
    const planId: string | undefined = initMeta.planId;
    const userId: string | undefined = initMeta.userId;

    if (!organizerId || !planId) {
      this.logger.error(`Missing organizerId/planId metadata on payment ${payment.id}`);
      throw new BadRequestException('Corrupted payment initiation metadata.');
    }

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) {
      throw new NotFoundException('Target subscription plan not found.');
    }

    const now = new Date();
    const periodEnd = this.calculatePeriodEnd(now, plan.billingInterval);

    await this.prisma.$transaction(async (tx) => {
      await tx.subscription.updateMany({
        where: {
          organizerId,
          status: SubscriptionStatus.ACTIVE,
        },
        data: {
          status: SubscriptionStatus.CANCELLED,
          cancelledAt: now,
        },
      });

      const newSubscription = await tx.subscription.create({
        data: {
          organizerId,
          planId: plan.id,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          gracePeriodEnd: new Date(periodEnd.getTime() + 3 * 24 * 60 * 60 * 1000),
          retryCount: 0,
        },
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          subscriptionId: newSubscription.id,
          status: PaymentStatus.SUCCESS,
          mpesaReceipt,
          mpesaPhone: phoneUsed,
          rawCallbackPayload: payload,
          processedAt: now,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: userId ?? null,
          action: 'SUBSCRIPTION_UPGRADED',
          entityType: 'Subscription',
          entityId: newSubscription.id,
          changes: {
            planCode: plan.code,
            amountKes: paidAmount,
            mpesaReceipt,
            checkoutRequestId,
          },
        },
      });
    });

    if (userId) {
      await this.notifications.create({
        userId,
        title: 'Subscription Activated',
        message: `Your ${plan.name} subscription is now active (Receipt: ${mpesaReceipt}).`,
        type: 'SUBSCRIPTION_ACTIVATED',
        metadata: { planCode: plan.code, mpesaReceipt },
      });
    }

    this.logger.log(
      `Subscription activated for organizer ${organizerId} on ${plan.code} (Receipt: ${mpesaReceipt})`,
    );

    return { ResultCode: 0, ResultDesc: 'Success' };
  }

  async getPaymentStatus(userId: string, checkoutRequestId: string) {
    const profile = await this.prisma.organizerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new NotFoundException('Organizer profile not found.');

    const payment = await this.prisma.payment.findFirst({
      where: {
        checkoutRequestId,
        paymentType: PaymentType.SUBSCRIPTION_PAYMENT,
      },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment request not found.');
    }

    const meta = (payment.rawCallbackPayload as Record<string, any>) || {};
    if (meta.organizerId && meta.organizerId !== profile.id) {
      throw new ForbiddenException('Access denied to this payment record.');
    }

    return {
      id: payment.id,
      checkoutRequestId: payment.checkoutRequestId,
      status: payment.status,
      amountKes: payment.amountKes,
      mpesaReceipt: payment.mpesaReceipt,
      failureReason: payment.failureReason,
      processedAt: payment.processedAt,
      subscription: payment.subscription ?? null,
    };
  }

  async listSubscriptionPayments(userId: string) {
    const profile = await this.prisma.organizerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new NotFoundException('Organizer profile not found.');

    return this.prisma.payment.findMany({
      where: {
        paymentType: PaymentType.SUBSCRIPTION_PAYMENT,
        subscription: {
          organizerId: profile.id,
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: {
          include: { plan: { select: { code: true, name: true } } },
        },
      },
    });
  }

  private calculatePeriodEnd(start: Date, interval: BillingInterval): Date {
    const end = new Date(start);
    if (interval === BillingInterval.ANNUAL) {
      end.setFullYear(end.getFullYear() + 1);
    } else if (interval === BillingInterval.QUARTERLY) {
      end.setMonth(end.getMonth() + 3);
    } else {
      end.setMonth(end.getMonth() + 1);
    }
    return end;
  }
}