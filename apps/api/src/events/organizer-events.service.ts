import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventFilterDto } from './dto/event-filter.dto';
import { CancelEventDto } from './dto/cancel-event.dto';

@Injectable()
export class OrganizerEventsService {
  private readonly logger = new Logger(OrganizerEventsService.name);

  constructor(
    private prisma: PrismaService,
    private events: EventsService,
  ) {}

  private async getOrganizerProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.organizerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) {
      throw new ForbiddenException(
        'Organizer profile not found. Please complete onboarding.',
      );
    }
    return profile.id;
  }

  private async resolveCategoryId(
    code?: string | null,
  ): Promise<string | null> {
    if (!code) return null;
    const category = await this.prisma.eventCategory.findUnique({
      where: { code },
      select: { id: true },
    });
    return category?.id ?? null;
  }

  async create(userId: string, dto: CreateEventDto) {
    const organizerId = await this.getOrganizerProfileId(userId);
    const slug = await this.events.generateSlug(dto.title);
    const resolvedCategoryId = await this.resolveCategoryId(dto.categoryId);

    const event = await this.prisma.event.create({
      data: {
        organizerId,
        categoryId: resolvedCategoryId,
        title: dto.title,
        slug,
        description: dto.description,
        coverImageUrl: dto.coverImageUrl ?? null,
        venueName: dto.venueName,
        address: dto.address,
        county: dto.county,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        maxAttendees: dto.maxAttendees ?? null,
        status: 'DRAFT',
        ticketTiers: {
          create: dto.ticketTiers.map((tier, i) => ({
            name: tier.name,
            description: tier.description ?? null,
            priceKes: tier.priceKes,
            quantityTotal: tier.quantityTotal,
            salesStartAt: tier.salesStartAt
              ? new Date(tier.salesStartAt)
              : null,
            salesEndAt: tier.salesEndAt ? new Date(tier.salesEndAt) : null,
            sortOrder: tier.sortOrder ?? i,
            isActive: tier.isActive ?? true,
          })),
        },
      },
      include: {
        ticketTiers: { orderBy: { sortOrder: 'asc' } },
        category: { select: { code: true, name: true } },
      },
    });

    this.logger.log(`Event created: ${event.slug} by ${userId}`);
    return event;
  }

  async listOwn(userId: string, filter: EventFilterDto) {
    const organizerId = await this.getOrganizerProfileId(userId);
    const limit = filter.limit ?? 50;
    const offset = filter.offset ?? 0;

    const where: any = { organizerId };
    if (filter.status) where.status = filter.status;
    if (filter.q) {
      where.OR = [
        { title: { contains: filter.q, mode: 'insensitive' } },
        { venueName: { contains: filter.q, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.event.count({ where }),
      this.prisma.event.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          category: { select: { code: true, name: true } },
          ticketTiers: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { bookings: true } },
        },
      }),
    ]);

    return { total, limit, offset, items };
  }

  async findOwn(userId: string, eventId: string) {
    const organizerId = await this.getOrganizerProfileId(userId);
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, organizerId },
      include: {
        category: true,
        ticketTiers: { orderBy: { sortOrder: 'asc' } },
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: {
            admin: { select: { fullName: true } },
          },
        },
        _count: { select: { bookings: true } },
      },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async update(userId: string, eventId: string, dto: UpdateEventDto) {
    const event = await this.findOwn(userId, eventId);

    if (!['DRAFT', 'NEEDS_REVISION'].includes(event.status)) {
      throw new BadRequestException(
        `Cannot edit event in status ${event.status}. Only DRAFT or NEEDS_REVISION can be edited.`,
      );
    }

    const resolvedCategoryId =
      dto.categoryId !== undefined
        ? await this.resolveCategoryId(dto.categoryId)
        : undefined;

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (resolvedCategoryId !== undefined)
      data.categoryId = resolvedCategoryId;
    if (dto.coverImageUrl !== undefined)
      data.coverImageUrl = dto.coverImageUrl;
    if (dto.venueName !== undefined) data.venueName = dto.venueName;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.county !== undefined) data.county = dto.county;
    if (dto.latitude !== undefined) data.latitude = dto.latitude;
    if (dto.longitude !== undefined) data.longitude = dto.longitude;
    if (dto.startsAt !== undefined) data.startsAt = new Date(dto.startsAt);
    if (dto.endsAt !== undefined) data.endsAt = new Date(dto.endsAt);
    if (dto.maxAttendees !== undefined) data.maxAttendees = dto.maxAttendees;

    // Capture into a local const so TypeScript keeps the narrowing
    // inside the $transaction callback.
    const incomingTiers = dto.ticketTiers;

    if (incomingTiers) {
      const existingTiers = await this.prisma.ticketTier.findMany({
        where: { eventId },
        select: {
          id: true,
          bookings: { select: { id: true }, take: 1 },
        },
      });

      const existingIds = new Set(existingTiers.map((t) => t.id));
      const incomingIds = new Set(
        incomingTiers
          .map((t) => t.id)
          .filter((id): id is string => Boolean(id)),
      );

      const idsToDelete = existingTiers
        .filter((t) => !incomingIds.has(t.id))
        .map((t) => t.id);

      if (idsToDelete.length > 0) {
        const blocked = existingTiers.filter(
          (t) => idsToDelete.includes(t.id) && t.bookings.length > 0,
        );
        if (blocked.length > 0) {
          throw new BadRequestException(
            'Cannot remove ticket tiers that already have bookings.',
          );
        }
      }

      await this.prisma.$transaction(async (tx) => {
        if (idsToDelete.length > 0) {
          await tx.ticketTier.deleteMany({
            where: { id: { in: idsToDelete } },
          });
        }

        for (let i = 0; i < incomingTiers.length; i++) {
          const tier = incomingTiers[i];
          const tierData = {
            name: tier.name,
            description: tier.description ?? null,
            priceKes: tier.priceKes,
            quantityTotal: tier.quantityTotal,
            salesStartAt: tier.salesStartAt
              ? new Date(tier.salesStartAt)
              : null,
            salesEndAt: tier.salesEndAt
              ? new Date(tier.salesEndAt)
              : null,
            sortOrder: tier.sortOrder ?? i,
            isActive: tier.isActive ?? true,
          };

          if (tier.id && existingIds.has(tier.id)) {
            await tx.ticketTier.update({
              where: { id: tier.id },
              data: tierData,
            });
          } else {
            await tx.ticketTier.create({
              data: { ...tierData, eventId },
            });
          }
        }

        if (Object.keys(data).length > 0) {
          await tx.event.update({
            where: { id: eventId },
            data,
          });
        }
      });
    } else if (Object.keys(data).length > 0) {
      await this.prisma.event.update({
        where: { id: eventId },
        data,
      });
    }

    return this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        ticketTiers: { orderBy: { sortOrder: 'asc' } },
        category: { select: { code: true, name: true } },
      },
    });
  }

  async submit(userId: string, eventId: string) {
    const event = await this.findOwn(userId, eventId);
    if (!['DRAFT', 'NEEDS_REVISION'].includes(event.status)) {
      throw new BadRequestException(
        `Cannot submit event in status ${event.status}`,
      );
    }
    if (event.ticketTiers.length === 0) {
      throw new BadRequestException(
        'Event must have at least one ticket tier before submission.',
      );
    }
    return this.prisma.event.update({
      where: { id: eventId },
      data: {
        status: 'PENDING_APPROVAL',
        submittedAt: new Date(),
      },
    });
  }

  async delete(userId: string, eventId: string) {
    const event = await this.findOwn(userId, eventId);

    if (event.status !== 'DRAFT') {
      throw new BadRequestException(
        `Only DRAFT events can be deleted. Current status: ${event.status}. Use cancel for live events.`,
      );
    }

    await this.prisma.event.delete({ where: { id: eventId } });
    this.logger.log(`Event deleted: ${eventId} by ${userId}`);
    return { success: true, deletedId: eventId };
  }

  async cancel(userId: string, eventId: string, dto: CancelEventDto) {
    const event = await this.findOwn(userId, eventId);

    if (!['LIVE', 'ONGOING', 'APPROVED'].includes(event.status)) {
      throw new BadRequestException(
        `Cannot cancel event in status ${event.status}. Only LIVE, ONGOING, or APPROVED can be cancelled.`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.event.update({
        where: { id: eventId },
        data: {
          status: 'CANCELLED',
          rejectionReason: dto.reason ?? 'Cancelled by organizer',
        },
      });

      await tx.booking.updateMany({
        where: {
          eventId,
          status: { in: ['PENDING', 'PAYMENT_RECEIVED', 'CONFIRMED'] },
        },
        data: {
          status: 'CANCELLED',
          cancellationReason:
            dto.reason ?? 'Event cancelled by organizer',
          cancelledAt: new Date(),
        },
      });

      return updated;
    });

    this.logger.log(`Event cancelled: ${eventId} by ${userId}`);
    return result;
  }

  async duplicate(userId: string, eventId: string) {
    const original = await this.findOwn(userId, eventId);
    const organizerId = original.organizerId;
    const newTitle = `${original.title} (Copy)`;
    const newSlug = await this.events.generateSlug(newTitle);

    const copy = await this.prisma.event.create({
      data: {
        organizerId,
        categoryId: original.categoryId,
        title: newTitle,
        slug: newSlug,
        description: original.description,
        coverImageUrl: original.coverImageUrl,
        venueName: original.venueName,
        address: original.address,
        county: original.county,
        latitude: original.latitude,
        longitude: original.longitude,
        startsAt: original.startsAt,
        endsAt: original.endsAt,
        maxAttendees: original.maxAttendees,
        status: 'DRAFT',
        ticketTiers: {
          create: original.ticketTiers.map((tier, i) => ({
            name: tier.name,
            description: tier.description ?? null,
            priceKes: tier.priceKes,
            quantityTotal: tier.quantityTotal,
            salesStartAt: tier.salesStartAt,
            salesEndAt: tier.salesEndAt,
            sortOrder: tier.sortOrder ?? i,
            isActive: tier.isActive,
          })),
        },
      },
      include: {
        ticketTiers: { orderBy: { sortOrder: 'asc' } },
        category: { select: { code: true, name: true } },
      },
    });

    this.logger.log(
      `Event duplicated: ${original.id} → ${copy.id} by ${userId}`,
    );
    return copy;
  }

  async listAttendees(userId: string, eventId: string) {
    await this.findOwn(userId, eventId);

    const bookings = await this.prisma.booking.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        attendee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        ticketTier: { select: { name: true, priceKes: true } },
        eTicket: { select: { ticketCode: true, status: true } },
      },
    });

    return {
      total: bookings.length,
      items: bookings.map((b) => ({
        id: b.id,
        reference: b.bookingReference,
        status: b.status,
        quantity: b.quantity,
        totalAmountKes: b.totalAmountKes,
        createdAt: b.createdAt,
        confirmedAt: b.confirmedAt,
        attendee: b.attendee,
        tier: b.ticketTier,
        ticket: b.eTicket ?? null,
      })),
    };
  }
}
