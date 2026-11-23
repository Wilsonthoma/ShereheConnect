import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventFilterDto } from './dto/event-filter.dto';

const COMPLETION_SWEEP_COOLDOWN_MS = 30_000;

export function normalizeCoordinate(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Number(parsed.toFixed(6));
}

export function isValidLatLng(
  lat: number | null | undefined,
  lng: number | null | undefined,
): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

export function buildDirectionsUrl(params: {
  directionsUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  venueName?: string | null;
  address?: string | null;
  county?: string | null;
}): string | null {
  if (params.directionsUrl && params.directionsUrl.trim()) {
    return params.directionsUrl.trim();
  }

  if (isValidLatLng(params.latitude, params.longitude)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      `${params.latitude},${params.longitude}`,
    )}`;
  }

  const query = [params.venueName, params.address, params.county]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(', ');

  if (!query) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    query,
  )}`;
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private lastCompletionSweepAt = 0;

  constructor(private readonly prisma: PrismaService) {}

  private async markExpiredEventsCompleted(): Promise<void> {
    const nowMs = Date.now();
    if (nowMs - this.lastCompletionSweepAt < COMPLETION_SWEEP_COOLDOWN_MS) {
      return;
    }
    this.lastCompletionSweepAt = nowMs;

    try {
      await this.prisma.event.updateMany({
        where: {
          status: { in: ['LIVE', 'ONGOING'] },
          endsAt: { lt: new Date(nowMs) },
        },
        data: { status: 'COMPLETED' },
      });
    } catch (err) {
      this.logger.warn(
        `Failed marking expired events completed: ${(err as Error).message}`,
      );
    }
  }

  /** Public: list live events with filters */
  async findLive(filter: EventFilterDto) {
    const limit = Math.min(Math.max(filter.limit ?? 20, 1), 100);
    const offset = Math.max(filter.offset ?? 0, 0);

    await this.markExpiredEventsCompleted();

    const where: Prisma.EventWhereInput = {
      status: { in: ['LIVE', 'ONGOING'] },
      // Block events from suspended or deleted organizers
      organizer: {
        user: {
          status: 'ACTIVE',
        },
      },
    };

    if (filter.q) {
      const q = filter.q.trim();
      if (q) {
        where.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { venueName: { contains: q, mode: 'insensitive' } },
        ];
      }
    }
    if (filter.categoryId) where.categoryId = filter.categoryId;
    if (filter.county) where.county = filter.county;
    if (filter.featured !== undefined) {
      where.isFeatured = filter.featured;
    }

    const [total, rawItems] = await this.prisma.$transaction([
      this.prisma.event.count({ where }),
      this.prisma.event.findMany({
        where,
        orderBy: { startsAt: 'asc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          title: true,
          slug: true,
          coverImageUrl: true,
          venueName: true,
          address: true,
          county: true,
          latitude: true,
          longitude: true,
          locationAccuracyMeters: true,
          directionsUrl: true,
          startsAt: true,
          endsAt: true,
          status: true,
          allowGroupBookings: true,
          isFeatured: true,
          organizer: {
            select: {
              businessName: true,
              logoUrl: true,
            },
          },
          category: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          ticketTiers: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            select: {
              id: true,
              name: true,
              description: true,
              priceKes: true,
              quantityTotal: true,
              quantitySold: true,
              quantityReserved: true,
              isGroupSubgroup: true,
              groupCategory: true,
              occupantsPerUnit: true,
              pricingMode: true,
            },
          },
        },
      }),
    ]);

    const items = rawItems.map((item) => {
      const latitude = normalizeCoordinate(item.latitude);
      const longitude = normalizeCoordinate(item.longitude);
      return {
        ...item,
        latitude,
        longitude,
        locationAccuracyMeters: item.locationAccuracyMeters ?? null,
        directionsUrl: buildDirectionsUrl({
          directionsUrl: item.directionsUrl,
          latitude,
          longitude,
          venueName: item.venueName,
          address: item.address,
          county: item.county,
        }),
      };
    });

    return { total, limit, offset, items };
  }

  /** Public: view a single live event by slug */
  async findBySlug(slug: string) {
    const event = await this.prisma.event.findFirst({
      where: {
        slug,
        // Block direct links to suspended organizers' events
        organizer: {
          user: {
            status: 'ACTIVE',
          },
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        coverImageUrl: true,
        galleryUrls: true,
        venueName: true,
        address: true,
        county: true,
        latitude: true,
        longitude: true,
        locationAccuracyMeters: true,
        directionsUrl: true,
        startsAt: true,
        endsAt: true,
        timezone: true,
        status: true,
        maxAttendees: true,
        totalTicketsAvailable: true,
        allowGroupBookings: true,
        isFeatured: true,
        eventFeatures: true,
        organizer: {
          select: {
            businessName: true,
            bio: true,
            logoUrl: true,
            phone: true,
            county: true,
            averageRating: true,
          },
        },
        category: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        ticketTiers: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            description: true,
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
            sortOrder: true,
          },
        },
      },
    });

    if (!event) throw new NotFoundException('Event not found');
    if (!['LIVE', 'ONGOING', 'COMPLETED'].includes(event.status)) {
      throw new NotFoundException('Event not found');
    }

    const latitude = normalizeCoordinate(event.latitude);
    const longitude = normalizeCoordinate(event.longitude);

    return {
      ...event,
      latitude,
      longitude,
      locationAccuracyMeters: event.locationAccuracyMeters ?? null,
      directionsUrl: buildDirectionsUrl({
        directionsUrl: event.directionsUrl,
        latitude,
        longitude,
        venueName: event.venueName,
        address: event.address,
        county: event.county,
      }),
    };
  }

  /** Helper: generate a unique slug from title */
  async generateSlug(title: string): Promise<string> {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 80);

    const year = new Date().getFullYear();
    let slug = `${base}-${year}`;
    let attempt = 0;

    while (attempt < 5) {
      const existing = await this.prisma.event.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!existing) return slug;
      attempt++;
      slug = `${base}-${year}-${Math.random().toString(36).slice(2, 6)}`;
    }

    return `${base}-${Date.now().toString(36)}`;
  }
}