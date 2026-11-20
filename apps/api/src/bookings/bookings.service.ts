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

  private getSeatsForBooking(booking: {
    quantity: number;
    occupantsCount?: number | null;
  }): number {
    return booking.occupantsCount && booking.occupantsCount > 0
      ? booking.occupantsCount
      : booking.quantity;
  }

  private async issueTicketsForBooking(
    tx: Prisma.TransactionClient,
    booking: { id: string; quantity: number; occupantsCount?: number | null },
    existingTickets: Array<{ ticketIndex: number }> = [],
  ) {
    const targetCount = this.getSeatsForBooking(booking);
    const existingIndices = new Set(existingTickets.map((t) => t.ticketIndex));

    for (let idx = 1; idx <= targetCount; idx += 1) {
      if (existingIndices.has(idx)) {
        continue;
      }

      await tx.eTicket.create({
        data: {
          bookingId: booking.id,
          ticketIndex: idx,
          ticketCode: this.generateReference('TKT'),
          qrToken: randomBytes(24).toString('hex'),
          status: TicketStatus.ISSUED,
        },
      });
    }

    return tx.eTicket.findMany({
      where: { bookingId: booking.id },
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
        occupantsCount: true,
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
          const seatsToRelease = this.getSeatsForBooking(b);
          await tx.ticketTier.update({
            where: { id: b.ticketTierId },
            data: {
              quantityReserved: { decrement: seatsToRelease },
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

      const eventCaps = [
        event.maxAttendees,
        event.totalTicketsAvailable,
      ].filter((cap): cap is number => cap !== null && cap !== undefined);
      const effectiveEventCap =
        eventCaps.length > 0 ? Math.min(...eventCaps) : null;

      if (effectiveEventCap !== null) {
        const totals = await tx.ticketTier.aggregate({
          where: { eventId: event.id },
          _sum: {
            quantitySold: true,
            quantityReserved: true,
          },
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
        where: {
          id: tier.id,
          version: tier.version,
        },
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
              isGroupSubgroup: true,
              groupCategory: true,
              occupantsPerUnit: true,
              pricingMode: true,
            },
          },
          eTickets: {
            orderBy: { ticketIndex: 'asc' },
          },
          payments: true,
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

        return {
          ...created,
          eTickets,
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
            isGroupSubgroup: true,
            groupCategory: true,
            occupantsPerUnit: true,
            pricingMode: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        eTickets: {
          orderBy: { ticketIndex: 'asc' },
        },
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
        eTickets: {
          orderBy: { ticketIndex: 'asc' },
        },
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
        const seatsToRelease = this.getSeatsForBooking(booking);
        await tx.ticketTier.update({
          where: { id: booking.ticketTierId },
          data: {
            quantityReserved: { decrement: seatsToRelease },
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

  async listEventBookingsForOrganizer(
    eventId: string,
    userId: string,
    userRole?: string,
    filter?: BookingFilterDto & { q?: string },
  ) {
    await this.expireStaleBookings({ eventId });

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: {
          select: { id: true, userId: true, businessName: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

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
                {
                  bookingReference: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
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
                        {
                          ticketCode: {
                            contains: search,
                            mode: 'insensitive',
                          },
                        },
                        { guestName: { contains: search, mode: 'insensitive' } },
                      ],
                    },
                  },
                },
              ],
            }
          : {}),
      },
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
            isGroupSubgroup: true,
            groupCategory: true,
            occupantsPerUnit: true,
            pricingMode: true,
          },
        },
        eTickets: {
          orderBy: { ticketIndex: 'asc' },
        },
        payments: {
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

    return {
      eventId: event.id,
      eventTitle: event.title,
      summary,
      items,
    };
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
      include: {
        booking: {
          include: {
            attendee: {
              select: { id: true, fullName: true, phone: true },
            },
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
                organizer: {
                  select: { userId: true },
                },
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('E-ticket not found');
    }

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
      return {
        alreadyCheckedIn: true,
        ticket,
      };
    }

    const updatedTicket = await this.prisma.eTicket.update({
      where: { id: ticket.id },
      data: {
        status: TicketStatus.SCANNED,
        scannedAt: new Date(),
      },
      include: {
        booking: {
          select: {
            id: true,
            bookingReference: true,
            occupantsCount: true,
            attendee: {
              select: { id: true, fullName: true, phone: true },
            },
            ticketTier: {
              select: { id: true, name: true, groupCategory: true },
            },
          },
        },
      },
    });

    return {
      alreadyCheckedIn: false,
      ticket: updatedTicket,
    };
  }

  async confirmBookingPayment(
    bookingId: string,
    txClient?: Prisma.TransactionClient,
  ) {
    const run = async (tx: Prisma.TransactionClient) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { eTickets: true },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found for payment confirmation');
      }

      const seatsCount = this.getSeatsForBooking(booking);

      if (booking.status === BookingStatus.CONFIRMED) {
        await this.issueTicketsForBooking(tx, booking, booking.eTickets);
        return tx.booking.findUnique({
          where: { id: booking.id },
          include: { eTickets: { orderBy: { ticketIndex: 'asc' } } },
        });
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
            quantityReserved: { decrement: seatsCount },
            quantitySold: { increment: seatsCount },
          },
        });
      } else if (booking.status === BookingStatus.EXPIRED) {
        await tx.ticketTier.update({
          where: { id: booking.ticketTierId },
          data: {
            quantitySold: { increment: seatsCount },
          },
        });
      }

      const eTickets = await this.issueTicketsForBooking(
        tx,
        booking,
        booking.eTickets,
      );

      return {
        ...confirmed,
        eTickets,
      };
    };

    if (txClient) {
      return run(txClient);
    }
    return this.prisma.$transaction(run);
  }
}