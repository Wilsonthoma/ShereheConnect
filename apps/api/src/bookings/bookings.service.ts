import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BookingStatus,
  EventStatus,
  GroupPricingMode,
  Prisma,
  TicketStatus,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingFilterDto } from './dto/booking-filter.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { CheckInTicketDto } from './dto/check-in-ticket.dto';

const HOLD_MINUTES = 5;
const EXPIRY_SWEEP_COOLDOWN_MS = 5000;

@Injectable()
export class BookingsService {
  private lastGlobalSweepAt = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private generateReference(prefix: string): string {
    const code = randomBytes(4).toString('hex').toUpperCase();
    return `${prefix}-${code}`;
  }

  private getSeatsForBooking(booking: {
    quantity: number;
    occupantsCount?: number | null;
  }): number {
    return booking.occupantsCount && booking.occupantsCount > 0
      ? booking.occupantsCount
      : booking.quantity;
  }

  private normalizeKenyanPhone(raw?: string | null): string | null {
    if (!raw) return null;
    const digits = raw.replace(/\D/g, '');
    if (/^254[17]\d{8}$/.test(digits)) return digits;
    if (/^0[17]\d{8}$/.test(digits)) return `254${digits.slice(1)}`;
    if (/^[17]\d{8}$/.test(digits)) return `254${digits}`;
    return null;
  }

  private parseMpesaSms(smsText: string): {
    receiptCode: string | null;
    amountKes: number | null;
    phones: string[];
  } {
    const cleaned = smsText.replace(/\s+/g, ' ').trim();

    const codeMatch =
      cleaned.match(/\b([A-Z0-9]{10})\b(?=\s+Confirmed)/i) ??
      cleaned.match(
        /\b(?:M-?Pesa\s+(?:receipt|code|ref)[:\s-]*)?([A-Z0-9]{10})\b/i,
      );

    const amountMatch = cleaned.match(
      /\b(?:Ksh|KES)\s*([\d,]+(?:\.\d{1,2})?)/i,
    );

    const rawPhones = cleaned.match(/(?:\+?254|0)[17]\d{8}/g) ?? [];
    const phones = Array.from(
      new Set(
        rawPhones
          .map((p) => this.normalizeKenyanPhone(p))
          .filter((p): p is string => Boolean(p)),
      ),
    );

    const parsedAmount = amountMatch
      ? Number.parseFloat(amountMatch[1].replace(/,/g, ''))
      : null;

    return {
      receiptCode: codeMatch ? codeMatch[1].toUpperCase() : null,
      amountKes:
        parsedAmount !== null && Number.isFinite(parsedAmount)
          ? parsedAmount
          : null,
      phones,
    };
  }

  private async issueTicketsForBooking(
    tx: Prisma.TransactionClient,
    booking: { id: string; quantity: number; occupantsCount?: number | null },
    existingTickets: Array<{ ticketIndex: number }> = [],
  ) {
    const targetCount = this.getSeatsForBooking(booking);
    const existingIndices = new Set(existingTickets.map((t) => t.ticketIndex));

    const missingRows: Prisma.ETicketCreateManyInput[] = [];
    for (let idx = 1; idx <= targetCount; idx += 1) {
      if (!existingIndices.has(idx)) {
        missingRows.push({
          bookingId: booking.id,
          ticketIndex: idx,
          ticketCode: this.generateReference('TKT'),
          qrToken: randomBytes(24).toString('hex'),
          status: TicketStatus.ISSUED,
        });
      }
    }

    if (missingRows.length > 0) {
      await tx.eTicket.createMany({
        data: missingRows,
        skipDuplicates: true,
      });
    }

    return tx.eTicket.findMany({
      where: { bookingId: booking.id },
      select: {
        id: true,
        bookingId: true,
        ticketIndex: true,
        ticketCode: true,
        qrToken: true,
        guestName: true,
        guestPhone: true,
        status: true,
        issuedAt: true,
        scannedAt: true,
      },
      orderBy: { ticketIndex: 'asc' },
    });
  }

  private async notifySafely(payload: {
    userId: string;
    type: string;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await this.notifications.create({
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        metadata: payload.metadata ?? {},
      });
    } catch {
      // Do not fail booking state transitions if notification delivery fails
    }
  }

  private async expireSingleBookingIfDue(bookingId: string): Promise<void> {
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({
        where: {
          id: bookingId,
          status: BookingStatus.PENDING,
          expiresAt: { lte: now },
        },
        select: {
          id: true,
          ticketTierId: true,
          quantity: true,
          occupantsCount: true,
        },
      });

      if (!booking) return;

      const updated = await tx.booking.updateMany({
        where: {
          id: booking.id,
          status: BookingStatus.PENDING,
        },
        data: {
          status: BookingStatus.EXPIRED,
          cancellationReason: '5-minute reservation hold expired',
        },
      });

      if (updated.count > 0) {
        const seatsToRelease = this.getSeatsForBooking(booking);
        await tx.ticketTier.update({
          where: { id: booking.ticketTierId },
          data: {
            quantityReserved: { decrement: seatsToRelease },
          },
        });
      }
    });
  }

  async expireStaleBookings(filter?: {
    eventId?: string;
    ticketTierId?: string;
    attendeeId?: string;
    force?: boolean;
  }): Promise<void> {
    const isScoped = Boolean(
      filter?.eventId || filter?.ticketTierId || filter?.attendeeId,
    );
    const nowMs = Date.now();

    if (!isScoped && !filter?.force) {
      if (nowMs - this.lastGlobalSweepAt < EXPIRY_SWEEP_COOLDOWN_MS) {
        return;
      }
      this.lastGlobalSweepAt = nowMs;
    }

    const now = new Date(nowMs);
    const expiredBookings = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.PENDING,
        expiresAt: { lte: now },
        ...(filter?.eventId ? { eventId: filter.eventId } : {}),
        ...(filter?.ticketTierId ? { ticketTierId: filter.ticketTierId } : {}),
        ...(filter?.attendeeId ? { attendeeId: filter.attendeeId } : {}),
      },
      select: {
        id: true,
        ticketTierId: true,
        quantity: true,
        occupantsCount: true,
      },
    });

    if (expiredBookings.length === 0) return;

    const seatsByTier = new Map<string, number>();
    const expiredIds: string[] = [];

    for (const b of expiredBookings) {
      expiredIds.push(b.id);
      const seats = this.getSeatsForBooking(b);
      seatsByTier.set(
        b.ticketTierId,
        (seatsByTier.get(b.ticketTierId) ?? 0) + seats,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.booking.updateMany({
        where: {
          id: { in: expiredIds },
          status: BookingStatus.PENDING,
        },
        data: {
          status: BookingStatus.EXPIRED,
          cancellationReason: '5-minute reservation hold expired',
        },
      });

      await Promise.all(
        Array.from(seatsByTier.entries()).map(([ticketTierId, seats]) =>
          tx.ticketTier.update({
            where: { id: ticketTierId },
            data: {
              quantityReserved: { decrement: seats },
            },
          }),
        ),
      );
    });
  }

  async createBooking(attendeeId: string, dto: CreateBookingDto) {
    await this.expireStaleBookings({
      eventId: dto.eventId,
      ticketTierId: dto.ticketTierId,
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + HOLD_MINUTES * 60 * 1000);

    const booking = await this.prisma.$transaction(async (tx) => {
      const [event, tier] = await Promise.all([
        tx.event.findUnique({
          where: { id: dto.eventId },
          select: {
            id: true,
            title: true,
            status: true,
            endsAt: true,
            maxAttendees: true,
            totalTicketsAvailable: true,
            allowGroupBookings: true,
            organizer: { select: { id: true, businessName: true } },
          },
        }),
        tx.ticketTier.findUnique({
          where: { id: dto.ticketTierId },
          select: {
            id: true,
            eventId: true,
            name: true,
            priceKes: true,
            quantityTotal: true,
            quantitySold: true,
            quantityReserved: true,
            isGroupSubgroup: true,
            groupCategory: true,
            occupantsPerUnit: true,
            pricingMode: true,
            salesStartAt: true,
            salesEndAt: true,
            isActive: true,
            version: true,
          },
        }),
      ]);

      if (!event) throw new NotFoundException('Event not found');

      const bookableStatuses: EventStatus[] = [
        EventStatus.APPROVED,
        EventStatus.LIVE,
      ];
      if (!bookableStatuses.includes(event.status)) {
        throw new BadRequestException(
          `Event is not open for bookings (current status: ${event.status})`,
        );
      }

      if (event.endsAt <= now) {
        throw new BadRequestException('This event has already ended');
      }

      if (!tier || tier.eventId !== event.id) {
        throw new NotFoundException(
          'Ticket tier not found for the specified event',
        );
      }

      if (!tier.isActive) {
        throw new BadRequestException('This ticket tier is currently inactive');
      }

      if (tier.isGroupSubgroup && !event.allowGroupBookings) {
        throw new BadRequestException(
          'Group bookings are not enabled for this event',
        );
      }

      if (tier.salesStartAt && now < tier.salesStartAt) {
        throw new BadRequestException('Ticket sales have not started yet');
      }

      if (tier.salesEndAt && now > tier.salesEndAt) {
        throw new BadRequestException('Ticket sales for this tier have ended');
      }

      const occupantsPerUnit = tier.isGroupSubgroup
        ? Math.max(1, tier.occupantsPerUnit)
        : 1;
      const seatsRequested = dto.quantity * occupantsPerUnit;

      const availableForTier =
        tier.quantityTotal - tier.quantitySold - tier.quantityReserved;
      if (seatsRequested > availableForTier) {
        throw new BadRequestException(
          `Only ${Math.max(0, availableForTier)} ticket(s) remaining in ${tier.name} (${seatsRequested} required)`,
        );
      }

      const eventCaps = [event.maxAttendees, event.totalTicketsAvailable].filter(
        (cap): cap is number => cap !== null && cap !== undefined,
      );
      const effectiveEventCap =
        eventCaps.length > 0 ? Math.min(...eventCaps) : null;

      if (effectiveEventCap !== null) {
        const totals = await tx.ticketTier.aggregate({
          where: { eventId: event.id },
          _sum: { quantitySold: true, quantityReserved: true },
        });
        const currentCommitted =
          (totals._sum.quantitySold ?? 0) + (totals._sum.quantityReserved ?? 0);
        if (currentCommitted + seatsRequested > effectiveEventCap) {
          throw new BadRequestException(
            'Booking exceeds the total available tickets/capacity for this event',
          );
        }
      }

      const reservedTier = await tx.ticketTier.updateMany({
        where: { id: tier.id, version: tier.version },
        data: {
          quantityReserved: { increment: seatsRequested },
          version: { increment: 1 },
        },
      });

      if (reservedTier.count === 0) {
        throw new ConflictException(
          'Ticket inventory changed concurrently. Please try again.',
        );
      }

      const unitPriceKes = tier.priceKes;
      const isBundleFixed =
        tier.isGroupSubgroup &&
        tier.pricingMode === GroupPricingMode.BUNDLE_FIXED;
      const totalAmountKes = isBundleFixed
        ? unitPriceKes * dto.quantity
        : unitPriceKes * seatsRequested;
      const isFree = totalAmountKes === 0;

      const created = await tx.booking.create({
        data: {
          bookingReference: this.generateReference('SHC'),
          attendeeId,
          eventId: event.id,
          ticketTierId: tier.id,
          quantity: dto.quantity,
          occupantsCount: seatsRequested,
          unitPriceKes,
          totalAmountKes,
          status: isFree ? BookingStatus.CONFIRMED : BookingStatus.PENDING,
          expiresAt,
          confirmedAt: isFree ? now : null,
        },
        select: {
          id: true,
          bookingReference: true,
          attendeeId: true,
          eventId: true,
          ticketTierId: true,
          quantity: true,
          occupantsCount: true,
          unitPriceKes: true,
          totalAmountKes: true,
          status: true,
          expiresAt: true,
          confirmedAt: true,
          createdAt: true,
          event: {
            select: {
              id: true,
              title: true,
              slug: true,
              venueName: true,
              county: true,
              startsAt: true,
              endsAt: true,
              coverImageUrl: true,
            },
          },
          ticketTier: {
            select: {
              id: true,
              name: true,
              priceKes: true,
              isGroupSubgroup: true,
              groupCategory: true,
              occupantsPerUnit: true,
              pricingMode: true,
            },
          },
          eTickets: { orderBy: { ticketIndex: 'asc' } },
          payments: {
            select: {
              id: true,
              status: true,
              amountKes: true,
              mpesaReceipt: true,
              method: true,
              createdAt: true,
            },
          },
        },
      });

      if (isFree) {
        await tx.ticketTier.update({
          where: { id: tier.id },
          data: {
            quantityReserved: { decrement: seatsRequested },
            quantitySold: { increment: seatsRequested },
          },
        });
        const eTickets = await this.issueTicketsForBooking(tx, created, []);
        return { ...created, eTickets };
      }

      return created;
    });

    await this.notifySafely({
      userId: attendeeId,
      type:
        booking.status === BookingStatus.CONFIRMED
          ? 'BOOKING_CONFIRMED'
          : 'BOOKING_CREATED',
      title:
        booking.status === BookingStatus.CONFIRMED
          ? 'Ticket Confirmed'
          : 'Ticket Reservation Held',
      message:
        booking.status === BookingStatus.CONFIRMED
          ? `Your free booking ${booking.bookingReference} (${booking.occupantsCount} ticket(s)) for ${booking.event.title} is confirmed.`
          : `Booking ${booking.bookingReference} (${booking.occupantsCount} ticket(s) under ${booking.ticketTier.name}) is reserved for ${HOLD_MINUTES} minutes. Complete payment to confirm.`,
      metadata: {
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
        eventId: booking.eventId,
      },
    });

    return booking;
  }

  async listMyBookings(attendeeId: string, filter?: BookingFilterDto) {
    await this.expireStaleBookings({
      attendeeId,
      ...(filter?.eventId ? { eventId: filter.eventId } : {}),
    });
    return this.prisma.booking.findMany({
      where: {
        attendeeId,
        ...(filter?.status ? { status: filter.status } : {}),
        ...(filter?.eventId ? { eventId: filter.eventId } : {}),
      },
      select: {
        id: true,
        bookingReference: true,
        attendeeId: true,
        eventId: true,
        ticketTierId: true,
        quantity: true,
        occupantsCount: true,
        unitPriceKes: true,
        totalAmountKes: true,
        status: true,
        expiresAt: true,
        confirmedAt: true,
        cancelledAt: true,
        cancellationReason: true,
        createdAt: true,
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            venueName: true,
            address: true,
            county: true,
            startsAt: true,
            endsAt: true,
            coverImageUrl: true,
          },
        },
        ticketTier: {
          select: {
            id: true,
            name: true,
            priceKes: true,
            isGroupSubgroup: true,
            groupCategory: true,
            occupantsPerUnit: true,
            pricingMode: true,
          },
        },
        payments: {
          select: {
            id: true,
            status: true,
            amountKes: true,
            mpesaReceipt: true,
            billReference: true,
            method: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        eTickets: {
          select: {
            id: true,
            ticketIndex: true,
            ticketCode: true,
            qrToken: true,
            guestName: true,
            guestPhone: true,
            status: true,
            issuedAt: true,
            scannedAt: true,
          },
          orderBy: { ticketIndex: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBookingById(bookingId: string, userId: string, userRole?: string) {
    await this.expireSingleBookingIfDue(bookingId);
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        bookingReference: true,
        attendeeId: true,
        eventId: true,
        ticketTierId: true,
        quantity: true,
        occupantsCount: true,
        unitPriceKes: true,
        totalAmountKes: true,
        status: true,
        expiresAt: true,
        confirmedAt: true,
        cancelledAt: true,
        cancellationReason: true,
        createdAt: true,
        attendee: { select: { id: true, fullName: true, email: true, phone: true } },
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            venueName: true,
            address: true,
            county: true,
            startsAt: true,
            endsAt: true,
            coverImageUrl: true,
            organizer: {
              select: {
                id: true,
                userId: true,
                businessName: true,
                paymentMethods: {
                  where: { isActive: true },
                  orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
                  select: {
                    id: true,
                    methodType: true,
                    shortcode: true,
                    accountNumber: true,
                    phoneNumber: true,
                    displayLabel: true,
                    isDefault: true,
                  },
                },
              },
            },
          },
        },
        ticketTier: {
          select: {
            id: true,
            name: true,
            priceKes: true,
            isGroupSubgroup: true,
            groupCategory: true,
            occupantsPerUnit: true,
            pricingMode: true,
          },
        },
        payments: {
          select: {
            id: true,
            status: true,
            amountKes: true,
            mpesaReceipt: true,
            billReference: true,
            method: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        eTickets: {
          select: {
            id: true,
            ticketIndex: true,
            ticketCode: true,
            qrToken: true,
            status: true,
            issuedAt: true,
            scannedAt: true,
          },
          orderBy: { ticketIndex: 'asc' },
        },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    const isOwner = booking.attendeeId === userId;
    const isEventOrganizer = booking.event.organizer?.userId === userId;
    const isAdmin = userRole === 'ADMIN';
    if (!isOwner && !isEventOrganizer && !isAdmin) {
      throw new ForbiddenException('You do not have access to this booking');
    }

    return booking;
  }

  async cancelBooking(bookingId: string, userId: string, dto?: CancelBookingDto) {
    await this.expireSingleBookingIfDue(bookingId);
    const updated = await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        select: {
          id: true,
          attendeeId: true,
          ticketTierId: true,
          quantity: true,
          occupantsCount: true,
          status: true,
        },
      });
      if (!booking) throw new NotFoundException('Booking not found');
      if (booking.attendeeId !== userId) {
        throw new ForbiddenException('You can only cancel your own bookings');
      }

      const cancellableStatuses: BookingStatus[] = [
        BookingStatus.PENDING,
        BookingStatus.PAYMENT_RECEIVED,
      ];
      if (!cancellableStatuses.includes(booking.status)) {
        throw new BadRequestException(
          `Cannot cancel a booking with status ${booking.status}`,
        );
      }

      const cancelled = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: dto?.reason || 'Cancelled by attendee',
        },
        select: {
          id: true,
          bookingReference: true,
          status: true,
          cancelledAt: true,
          event: { select: { id: true, title: true } },
          ticketTier: { select: { id: true, name: true } },
        },
      });

      if (booking.status === BookingStatus.PENDING) {
        const seatsToRelease = this.getSeatsForBooking(booking);
        await tx.ticketTier.update({
          where: { id: booking.ticketTierId },
          data: { quantityReserved: { decrement: seatsToRelease } },
        });
      }
      return cancelled;
    });

    await this.notifySafely({
      userId,
      type: 'BOOKING_CANCELLED',
      title: 'Booking Cancelled',
      message: `Booking ${updated.bookingReference} for ${updated.event.title} has been cancelled.`,
      metadata: {
        bookingId: updated.id,
        bookingReference: updated.bookingReference,
      },
    });
    return updated;
  }

  async listEventBookingsForOrganizer(
    eventId: string,
    userId: string,
    userRole?: string,
    filter?: BookingFilterDto & { q?: string },
  ) {
    const [event] = await Promise.all([
      this.prisma.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          title: true,
          organizer: { select: { id: true, userId: true, businessName: true } },
        },
      }),
      this.expireStaleBookings({ eventId }),
    ]);

    if (!event) throw new NotFoundException('Event not found');
    const isOwner = event.organizer?.userId === userId;
    const isAdmin = userRole === 'ADMIN';
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You do not own this event');
    }

    const search = filter?.q?.trim();
    const items = await this.prisma.booking.findMany({
      where: {
        eventId,
        ...(filter?.status ? { status: filter.status } : {}),
        ...(search
          ? {
              OR: [
                { bookingReference: { contains: search, mode: 'insensitive' } },
                {
                  attendee: {
                    is: {
                      OR: [
                        { fullName: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } },
                        { phone: { contains: search, mode: 'insensitive' } },
                      ],
                    },
                  },
                },
                {
                  eTickets: {
                    some: {
                      OR: [
                        { ticketCode: { contains: search, mode: 'insensitive' } },
                        { guestName: { contains: search, mode: 'insensitive' } },
                      ],
                    },
                  },
                },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        bookingReference: true,
        quantity: true,
        occupantsCount: true,
        unitPriceKes: true,
        totalAmountKes: true,
        status: true,
        expiresAt: true,
        confirmedAt: true,
        createdAt: true,
        attendee: { select: { id: true, fullName: true, email: true, phone: true } },
        ticketTier: {
          select: {
            id: true,
            name: true,
            priceKes: true,
            isGroupSubgroup: true,
            groupCategory: true,
            occupantsPerUnit: true,
            pricingMode: true,
          },
        },
        eTickets: {
          select: {
            id: true,
            ticketIndex: true,
            ticketCode: true,
            guestName: true,
            guestPhone: true,
            status: true,
            scannedAt: true,
          },
          orderBy: { ticketIndex: 'asc' },
        },
        payments: {
          select: {
            id: true,
            status: true,
            amountKes: true,
            mpesaReceipt: true,
            method: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const summary = items.reduce(
      (acc, b) => {
        const seats = this.getSeatsForBooking(b);
        acc.totalBookings += 1;
        acc.totalOccupants += seats;
        if (b.status === BookingStatus.CONFIRMED) {
          acc.confirmedBookings += 1;
          acc.confirmedOccupants += seats;
          acc.grossRevenueKes += b.totalAmountKes;
        } else if (
          b.status === BookingStatus.PENDING ||
          b.status === BookingStatus.PAYMENT_RECEIVED
        ) {
          acc.pendingBookings += 1;
          acc.pendingOccupants += seats;
        }
        acc.checkedInTickets += b.eTickets.filter(
          (t) => t.status === TicketStatus.SCANNED,
        ).length;
        return acc;
      },
      {
        totalBookings: 0,
        totalOccupants: 0,
        confirmedBookings: 0,
        confirmedOccupants: 0,
        pendingBookings: 0,
        pendingOccupants: 0,
        checkedInTickets: 0,
        grossRevenueKes: 0,
      },
    );

    return { eventId: event.id, eventTitle: event.title, summary, items };
  }

  async checkInTicket(
    userId: string,
    userRole: string | undefined,
    dto: CheckInTicketDto,
  ) {
    const code = dto.ticketCode?.trim();
    const token = dto.qrToken?.trim();
    if (!code && !token) {
      throw new BadRequestException(
        'Provide either ticketCode or qrToken to check in a ticket',
      );
    }

    const ticket = await this.prisma.eTicket.findFirst({
      where: {
        ...(code
          ? { ticketCode: { equals: code, mode: 'insensitive' } }
          : { qrToken: token }),
      },
      select: {
        id: true,
        ticketIndex: true,
        ticketCode: true,
        guestName: true,
        guestPhone: true,
        status: true,
        scannedAt: true,
        booking: {
          select: {
            id: true,
            eventId: true,
            bookingReference: true,
            occupantsCount: true,
            status: true,
            attendee: { select: { id: true, fullName: true, phone: true } },
            ticketTier: {
              select: {
                id: true,
                name: true,
                isGroupSubgroup: true,
                groupCategory: true,
                occupantsPerUnit: true,
              },
            },
            event: {
              select: {
                id: true,
                title: true,
                organizer: { select: { userId: true } },
              },
            },
          },
        },
      },
    });

    if (!ticket) throw new NotFoundException('E-ticket not found');
    if (dto.eventId && ticket.booking.eventId !== dto.eventId) {
      throw new BadRequestException(
        'This e-ticket belongs to a different event',
      );
    }

    const isOwner = ticket.booking.event.organizer?.userId === userId;
    const isAdmin = userRole === 'ADMIN';
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'You are not authorized to check in tickets for this event',
      );
    }
    if (ticket.booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(
        `Cannot check in ticket because booking is ${ticket.booking.status}`,
      );
    }
    if (ticket.status === TicketStatus.SCANNED) {
      return { alreadyCheckedIn: true, ticket };
    }

    const updatedTicket = await this.prisma.eTicket.update({
      where: { id: ticket.id },
      data: { status: TicketStatus.SCANNED, scannedAt: new Date() },
      select: {
        id: true,
        ticketIndex: true,
        ticketCode: true,
        guestName: true,
        guestPhone: true,
        status: true,
        scannedAt: true,
        booking: {
          select: {
            id: true,
            bookingReference: true,
            occupantsCount: true,
            attendee: { select: { id: true, fullName: true, phone: true } },
            ticketTier: {
              select: { id: true, name: true, groupCategory: true },
            },
          },
        },
      },
    });

    return { alreadyCheckedIn: false, ticket: updatedTicket };
  }

  async confirmBookingPayment(
    bookingId: string,
    txClient?: Prisma.TransactionClient,
  ) {
    const run = async (tx: Prisma.TransactionClient) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        select: {
          id: true,
          bookingReference: true,
          attendeeId: true,
          eventId: true,
          ticketTierId: true,
          quantity: true,
          occupantsCount: true,
          totalAmountKes: true,
          status: true,
          eTickets: { select: { ticketIndex: true } },
        },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found for payment confirmation');
      }
      const seatsCount = this.getSeatsForBooking(booking);

      if (booking.status === BookingStatus.CONFIRMED) {
        const eTickets = await this.issueTicketsForBooking(
          tx,
          booking,
          booking.eTickets,
        );
        return { ...booking, eTickets };
      }

      const confirmed = await tx.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.CONFIRMED, confirmedAt: new Date() },
        select: {
          id: true,
          bookingReference: true,
          attendeeId: true,
          eventId: true,
          ticketTierId: true,
          quantity: true,
          occupantsCount: true,
          totalAmountKes: true,
          status: true,
          confirmedAt: true,
        },
      });

      if (booking.status === BookingStatus.PENDING) {
        await tx.ticketTier.update({
          where: { id: booking.ticketTierId },
          data: {
            quantityReserved: { decrement: seatsCount },
            quantitySold: { increment: seatsCount },
          },
        });
      } else if (booking.status === BookingStatus.EXPIRED) {
        await tx.ticketTier.update({
          where: { id: booking.ticketTierId },
          data: { quantitySold: { increment: seatsCount } },
        });
      }

      const eTickets = await this.issueTicketsForBooking(
        tx,
        booking,
        booking.eTickets,
      );
      return { ...confirmed, eTickets };
    };

    if (txClient) return run(txClient);
    return this.prisma.$transaction(run);
  }

  async verifyPaymentBySms(bookingId: string, userId: string, smsText: string) {
    if (!smsText || !smsText.trim()) {
      throw new BadRequestException(
        'Please paste your M-Pesa confirmation message before verifying.',
      );
    }

    const parsed = this.parseMpesaSms(smsText);
    const receiptCode = parsed.receiptCode;
    const amountKes = parsed.amountKes;

    if (!receiptCode) {
      throw new BadRequestException(
        'Could not find a valid M-Pesa transaction code in the pasted message.',
      );
    }
    if (amountKes === null) {
      throw new BadRequestException(
        'Could not find a valid KES amount in the pasted M-Pesa message.',
      );
    }

    const verifiedAmountKes: number = amountKes;
    const redirectTo = `/tickets?bookingId=${encodeURIComponent(bookingId)}`;

    const result = await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          ticketTier: true,
          event: true,
          attendee: { select: { id: true, phone: true } },
          eTickets: { select: { ticketIndex: true } },
        },
      });

      if (!booking || booking.attendeeId !== userId) {
        throw new NotFoundException('Booking not found.');
      }

      const now = new Date();
      const seatsCount = this.getSeatsForBooking(booking);

      if (booking.status === BookingStatus.PENDING && booking.expiresAt <= now) {
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: BookingStatus.EXPIRED,
            cancellationReason: '5-minute reservation hold expired',
          },
        });
        await tx.ticketTier.update({
          where: { id: booking.ticketTierId },
          data: { quantityReserved: { decrement: seatsCount } },
        });
        throw new BadRequestException(
          'Your 5-minute reservation expired and the seats were released.',
        );
      }

      if (booking.status === BookingStatus.CONFIRMED) {
        await this.issueTicketsForBooking(tx, booking, booking.eTickets);
        return {
          status: BookingStatus.CONFIRMED,
          receiptCode,
          message:
            'Transaction & booking complete — proceed to your tickets page.',
          redirectTo,
          alreadyConfirmed: true,
          bookingReference: booking.bookingReference,
          eventTitle: booking.event.title,
          eventId: booking.event.id,
        };
      }

      if (booking.status !== BookingStatus.PENDING) {
        throw new BadRequestException(
          `Cannot verify payment for a booking in ${booking.status} state.`,
        );
      }

      if (Math.abs(verifiedAmountKes - booking.totalAmountKes) > 0.01) {
        throw new BadRequestException(
          `Message amount (KES ${verifiedAmountKes.toLocaleString()}) does not match booking total (KES ${booking.totalAmountKes.toLocaleString()}).`,
        );
      }

      const accountPhone = this.normalizeKenyanPhone(booking.attendee?.phone);
      if (accountPhone && parsed.phones.length > 0) {
        const matchesPhone = parsed.phones.includes(accountPhone);
        if (!matchesPhone) {
          throw new BadRequestException(
            'Phone number in the M-Pesa message does not match your account phone number.',
          );
        }
      }

      const duplicateReceipt = await tx.payment.findFirst({
        where: {
          mpesaReceipt: receiptCode,
          bookingId: { not: booking.id },
        },
        select: { id: true },
      });
      if (duplicateReceipt) {
        throw new ConflictException(
          'This M-Pesa transaction code has already been used.',
        );
      }

      await tx.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.CONFIRMED, confirmedAt: now },
      });

      await tx.payment.create({
        data: {
          bookingId: booking.id,
          paymentType: 'TICKET_PAYMENT',
          method: 'MPESA_C2B',
          amountKes: booking.totalAmountKes,
          mpesaReceipt: receiptCode,
          status: 'SUCCESS',
          processedAt: now,
        },
      });

      await this.issueTicketsForBooking(tx, booking, booking.eTickets);
      await tx.ticketTier.update({
        where: { id: booking.ticketTierId },
        data: {
          quantityReserved: { decrement: seatsCount },
          quantitySold: { increment: seatsCount },
        },
      });

      return {
        status: BookingStatus.CONFIRMED,
        receiptCode,
        message:
          'Transaction & booking complete — proceed to your tickets page.',
        redirectTo,
        alreadyConfirmed: false,
        bookingReference: booking.bookingReference,
        eventTitle: booking.event.title,
        eventId: booking.event.id,
      };
    });

    if (!result.alreadyConfirmed) {
      await this.notifySafely({
        userId,
        type: 'BOOKING_CONFIRMED',
        title: 'Transaction & Booking Complete',
        message: `Your payment for ${result.eventTitle} (${result.bookingReference}) is verified. Proceed to your tickets page.`,
        metadata: {
          bookingId,
          bookingReference: result.bookingReference,
          receiptCode: result.receiptCode,
          eventId: result.eventId,
        },
      });
    }

    return {
      status: result.status,
      receiptCode: result.receiptCode,
      message: result.message,
      redirectTo: result.redirectTo,
    };
  }
}