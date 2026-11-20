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
  Prisma,
  TicketStatus,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingFilterDto } from './dto/booking-filter.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';

const HOLD_MINUTES = 15;

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private generateReference(prefix: string): string {
    const code = randomBytes(4).toString('hex').toUpperCase();
    return `${prefix}-${code}`;
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

  async expireStaleBookings(filter?: {
    eventId?: string;
    ticketTierId?: string;
    attendeeId?: string;
  }): Promise<void> {
    const now = new Date();

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
      },
    });

    if (expiredBookings.length === 0) return;

    await this.prisma.$transaction(async (tx) => {
      for (const b of expiredBookings) {
        const updated = await tx.booking.updateMany({
          where: {
            id: b.id,
            status: BookingStatus.PENDING,
          },
          data: {
            status: BookingStatus.EXPIRED,
            cancellationReason: 'Reservation hold expired',
          },
        });

        if (updated.count > 0) {
          await tx.ticketTier.update({
            where: { id: b.ticketTierId },
            data: {
              quantityReserved: { decrement: b.quantity },
            },
          });
        }
      }
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
      const event = await tx.event.findUnique({
        where: { id: dto.eventId },
        include: {
          organizer: {
            select: {
              id: true,
              businessName: true,
            },
          },
        },
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

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

      const tier = await tx.ticketTier.findUnique({
        where: { id: dto.ticketTierId },
      });

      if (!tier || tier.eventId !== event.id) {
        throw new NotFoundException(
          'Ticket tier not found for the specified event',
        );
      }

      if (!tier.isActive) {
        throw new BadRequestException('This ticket tier is currently inactive');
      }

      if (tier.salesStartAt && now < tier.salesStartAt) {
        throw new BadRequestException('Ticket sales have not started yet');
      }

      if (tier.salesEndAt && now > tier.salesEndAt) {
        throw new BadRequestException('Ticket sales for this tier have ended');
      }

      const availableForTier =
        tier.quantityTotal - tier.quantitySold - tier.quantityReserved;
      if (dto.quantity > availableForTier) {
        throw new BadRequestException(
          `Only ${Math.max(0, availableForTier)} ticket(s) remaining in ${tier.name}`,
        );
      }

      if (event.maxAttendees !== null && event.maxAttendees !== undefined) {
        const totals = await tx.ticketTier.aggregate({
          where: { eventId: event.id },
          _sum: {
            quantitySold: true,
            quantityReserved: true,
          },
        });
        const currentCommitted =
          (totals._sum.quantitySold ?? 0) + (totals._sum.quantityReserved ?? 0);
        if (currentCommitted + dto.quantity > event.maxAttendees) {
          throw new BadRequestException(
            'Booking exceeds the maximum attendee capacity for this event',
          );
        }
      }

      const reservedTier = await tx.ticketTier.updateMany({
        where: {
          id: tier.id,
          version: tier.version,
        },
        data: {
          quantityReserved: { increment: dto.quantity },
          version: { increment: 1 },
        },
      });

      if (reservedTier.count === 0) {
        throw new ConflictException(
          'Ticket inventory changed concurrently. Please try again.',
        );
      }

      const unitPriceKes = tier.priceKes;
      const totalAmountKes = unitPriceKes * dto.quantity;
      const isFree = totalAmountKes === 0;

      const created = await tx.booking.create({
        data: {
          bookingReference: this.generateReference('SHC'),
          attendeeId,
          eventId: event.id,
          ticketTierId: tier.id,
          quantity: dto.quantity,
          unitPriceKes,
          totalAmountKes,
          status: isFree ? BookingStatus.CONFIRMED : BookingStatus.PENDING,
          expiresAt,
          confirmedAt: isFree ? now : null,
        },
        include: {
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
            },
          },
          eTicket: true,
          payments: true,
        },
      });

      if (isFree) {
        await tx.ticketTier.update({
          where: { id: tier.id },
          data: {
            quantityReserved: { decrement: dto.quantity },
            quantitySold: { increment: dto.quantity },
          },
        });

        const eTicket = await tx.eTicket.create({
          data: {
            bookingId: created.id,
            ticketCode: this.generateReference('TKT'),
            qrToken: randomBytes(24).toString('hex'),
            status: TicketStatus.ISSUED,
          },
        });

        return {
          ...created,
          eTicket,
        };
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
          ? `Your free booking ${booking.bookingReference} for ${booking.event.title} is confirmed.`
          : `Booking ${booking.bookingReference} (${booking.quantity}x ${booking.ticketTier.name}) is reserved for ${HOLD_MINUTES} minutes. Complete payment to confirm.`,
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
      include: {
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
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        eTicket: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBookingById(bookingId: string, userId: string, userRole?: string) {
    await this.expireStaleBookings();

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        attendee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        event: {
          include: {
            organizer: {
              select: {
                id: true,
                userId: true,
                businessName: true,
              },
            },
          },
        },
        ticketTier: true,
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        eTicket: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const isOwner = booking.attendeeId === userId;
    const isEventOrganizer = booking.event.organizer?.userId === userId;
    const isAdmin = userRole === 'ADMIN';

    if (!isOwner && !isEventOrganizer && !isAdmin) {
      throw new ForbiddenException('You do not have access to this booking');
    }

    return booking;
  }

  async cancelBooking(
    bookingId: string,
    userId: string,
    dto?: CancelBookingDto,
  ) {
    await this.expireStaleBookings();

    const updated = await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

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
        include: {
          event: {
            select: { id: true, title: true },
          },
          ticketTier: {
            select: { id: true, name: true },
          },
        },
      });

      if (booking.status === BookingStatus.PENDING) {
        await tx.ticketTier.update({
          where: { id: booking.ticketTierId },
          data: {
            quantityReserved: { decrement: booking.quantity },
          },
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

  async listEventBookingsForOrganizer(eventId: string, organizerUserId: string) {
    await this.expireStaleBookings({ eventId });

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: {
          select: { userId: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.organizer.userId !== organizerUserId) {
      throw new ForbiddenException('You do not own this event');
    }

    return this.prisma.booking.findMany({
      where: { eventId },
      include: {
        attendee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        ticketTier: {
          select: {
            id: true,
            name: true,
            priceKes: true,
          },
        },
        eTicket: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async confirmBookingPayment(
    bookingId: string,
    txClient?: Prisma.TransactionClient,
  ) {
    const run = async (tx: Prisma.TransactionClient) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { eTicket: true },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found for payment confirmation');
      }

      if (booking.status === BookingStatus.CONFIRMED) {
        return booking;
      }

      const confirmed = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CONFIRMED,
          confirmedAt: new Date(),
        },
      });

      if (booking.status === BookingStatus.PENDING) {
        await tx.ticketTier.update({
          where: { id: booking.ticketTierId },
          data: {
            quantityReserved: { decrement: booking.quantity },
            quantitySold: { increment: booking.quantity },
          },
        });
      } else if (booking.status === BookingStatus.EXPIRED) {
        await tx.ticketTier.update({
          where: { id: booking.ticketTierId },
          data: {
            quantitySold: { increment: booking.quantity },
          },
        });
      }

      if (!booking.eTicket) {
        await tx.eTicket.create({
          data: {
            bookingId: booking.id,
            ticketCode: this.generateReference('TKT'),
            qrToken: randomBytes(24).toString('hex'),
            status: TicketStatus.ISSUED,
          },
        });
      }

      return confirmed;
    };

    if (txClient) {
      return run(txClient);
    }
    return this.prisma.$transaction(run);
  }
}