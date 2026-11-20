import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BookingStatus,
  PaymentMethodApi,
  PaymentStatus,
  PaymentType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BookingsService } from '../bookings/bookings.service';
import { NotificationsService } from '../notifications/notifications.service';

export interface C2bCallbackPayload {
  TransactionType?: string;
  TransID?: string;
  TransTime?: string;
  TransAmount?: string | number;
  BusinessShortCode?: string;
  BillRefNumber?: string;
  InvoiceNumber?: string;
  OrgAccountBalance?: string;
  ThirdPartyTransID?: string;
  MSISDN?: string;
  FirstName?: string;
  MiddleName?: string;
  LastName?: string;
}

@Injectable()
export class C2bTicketPaymentService {
  private readonly logger = new Logger(C2bTicketPaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingsService: BookingsService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {}

  async handleC2bConfirmation(
    payload: C2bCallbackPayload,
    callbackSecret?: string,
  ) {
    const expectedSecret = this.config.get<string>('MPESA_CALLBACK_SECRET');
    if (expectedSecret && callbackSecret !== expectedSecret) {
      this.logger.warn('Rejected C2B callback with invalid secret token.');
      throw new UnauthorizedException('Invalid callback signature.');
    }

    const mpesaReceipt = String(payload?.TransID ?? '').trim();
    const bookingReference = String(payload?.BillRefNumber ?? '').trim();
    const paidAmount = Number(payload?.TransAmount ?? 0);
    const phoneUsed = String(payload?.MSISDN ?? '').trim() || null;

    if (!mpesaReceipt) {
      this.logger.warn(
        `Missing TransID in C2B callback: ${JSON.stringify(payload)}`,
      );
      throw new BadRequestException('Missing M-Pesa receipt number (TransID).');
    }

    if (!bookingReference) {
      this.logger.warn(
        `Missing BillRefNumber in C2B callback (${mpesaReceipt})`,
      );
      return {
        ResultCode: 0,
        ResultDesc: 'Accepted (missing booking reference)',
      };
    }

    const existingReceipt = await this.prisma.payment.findUnique({
      where: { mpesaReceipt },
    });
    if (existingReceipt) {
      this.logger.log(
        `Duplicate C2B receipt ignored: ${mpesaReceipt} (${bookingReference})`,
      );
      return { ResultCode: 0, ResultDesc: 'Duplicate receipt ignored' };
    }

    const booking = await this.prisma.booking.findUnique({
      where: { bookingReference },
      include: {
        event: { select: { id: true, title: true } },
      },
    });

    if (!booking) {
      this.logger.warn(
        `No booking found for BillRefNumber ${bookingReference} (Receipt: ${mpesaReceipt})`,
      );
      return { ResultCode: 0, ResultDesc: 'Accepted (unknown booking)' };
    }

    const now = new Date();

    if (
      booking.status !== BookingStatus.PENDING &&
      booking.status !== BookingStatus.PAYMENT_RECEIVED
    ) {
      this.logger.warn(
        `C2B payment ${mpesaReceipt} arrived for booking ${booking.bookingReference} in status ${booking.status}`,
      );
      await this.prisma.payment.create({
        data: {
          bookingId: booking.id,
          paymentType: PaymentType.TICKET_PAYMENT,
          method: PaymentMethodApi.MPESA_C2B,
          amountKes: Math.round(paidAmount),
          mpesaReceipt,
          mpesaPhone: phoneUsed,
          billReference: bookingReference,
          status: PaymentStatus.MISMATCHED,
          failureReason: `Booking not in confirmable hold state (${booking.status})`,
          rawCallbackPayload: payload as any,
          processedAt: now,
        },
      });
      return { ResultCode: 0, ResultDesc: 'Booking state recorded' };
    }

    if (booking.expiresAt <= now) {
      this.logger.warn(
        `C2B payment ${mpesaReceipt} arrived after hold expiry for ${booking.bookingReference}`,
      );
      await this.prisma.payment.create({
        data: {
          bookingId: booking.id,
          paymentType: PaymentType.TICKET_PAYMENT,
          method: PaymentMethodApi.MPESA_C2B,
          amountKes: Math.round(paidAmount),
          mpesaReceipt,
          mpesaPhone: phoneUsed,
          billReference: bookingReference,
          status: PaymentStatus.MISMATCHED,
          failureReason: 'Booking hold expired before payment confirmation',
          rawCallbackPayload: payload as any,
          processedAt: now,
        },
      });
      return { ResultCode: 0, ResultDesc: 'Expired hold payment recorded' };
    }

    if (Math.round(paidAmount) < booking.totalAmountKes) {
      this.logger.warn(
        `C2B underpayment for ${booking.bookingReference}: expected ${booking.totalAmountKes}, got ${paidAmount}`,
      );
      await this.prisma.payment.create({
        data: {
          bookingId: booking.id,
          paymentType: PaymentType.TICKET_PAYMENT,
          method: PaymentMethodApi.MPESA_C2B,
          amountKes: Math.round(paidAmount),
          mpesaReceipt,
          mpesaPhone: phoneUsed,
          billReference: bookingReference,
          status: PaymentStatus.MISMATCHED,
          failureReason: `Expected KES ${booking.totalAmountKes}, received KES ${paidAmount}`,
          rawCallbackPayload: payload as any,
          processedAt: now,
        },
      });
      return { ResultCode: 0, ResultDesc: 'Underpayment logged' };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          bookingId: booking.id,
          paymentType: PaymentType.TICKET_PAYMENT,
          method: PaymentMethodApi.MPESA_C2B,
          amountKes: Math.round(paidAmount),
          mpesaReceipt,
          mpesaPhone: phoneUsed,
          billReference: bookingReference,
          status: PaymentStatus.SUCCESS,
          rawCallbackPayload: payload as any,
          processedAt: now,
        },
      });

      await this.bookingsService.confirmBookingPayment(booking.id, tx);

      await tx.auditLog.create({
        data: {
          userId: booking.attendeeId,
          action: 'TICKET_PAYMENT_CONFIRMED',
          entityType: 'Booking',
          entityId: booking.id,
          changes: {
            bookingReference: booking.bookingReference,
            amountKes: Math.round(paidAmount),
            mpesaReceipt,
          },
        },
      });
    });

    await this.notifications.create({
      userId: booking.attendeeId,
      title: 'Tickets Confirmed',
      message: `Your payment for ${booking.event.title} (${booking.bookingReference}) is confirmed (Receipt: ${mpesaReceipt}).`,
      type: 'TICKET_CONFIRMED',
      metadata: {
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
        mpesaReceipt,
      },
    });

    this.logger.log(
      `Confirmed booking ${booking.bookingReference} via C2B receipt ${mpesaReceipt}`,
    );

    return { ResultCode: 0, ResultDesc: 'Success' };
  }
}