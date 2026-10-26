import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventFilterDto } from './dto/event-filter.dto';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(private prisma: PrismaService) {}

  /** Public: list live events with filters */
  async findLive(filter: EventFilterDto) {
    const limit = filter.limit ?? 20;
    const offset = filter.offset ?? 0;

    const where: any = {
      status: { in: ['LIVE', 'ONGOING'] },
    };

    if (filter.q) {
      where.OR = [
        { title: { contains: filter.q, mode: 'insensitive' } },
        { description: { contains: filter.q, mode: 'insensitive' } },
        { venueName: { contains: filter.q, mode: 'insensitive' } },
      ];
    }
    if (filter.categoryId) where.categoryId = filter.categoryId;
    if (filter.county) where.county = filter.county;

    const [total, items] = await this.prisma.$transaction([
      this.prisma.event.count({ where }),
      this.prisma.event.findMany({
        where,
        orderBy: { startsAt: 'asc' },
        take: limit,
        skip: offset,
        include: {
          organizer: {
            select: {
              businessName: true,
              logoUrl: true,
            },
          },
          category: { select: { code: true, name: true } },
          ticketTiers: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            select: {
              id: true,
              name: true,
              priceKes: true,
              quantityTotal: true,
              quantitySold: true,
              quantityReserved: true,
            },
          },
        },
      }),
    ]);

    return { total, limit, offset, items };
  }

  /** Public: view a single live event by slug */
  async findBySlug(slug: string) {
    const event = await this.prisma.event.findUnique({
      where: { slug },
      include: {
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
        category: { select: { code: true, name: true } },
        ticketTiers: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!event) throw new NotFoundException('Event not found');
    if (!['LIVE', 'ONGOING', 'COMPLETED'].includes(event.status)) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  /** Helper: generate a unique slug from title */
  async generateSlug(title: string): Promise<string> {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 80);

    let slug = `${base}-${new Date().getFullYear()}`;
    let attempt = 0;

    while (attempt < 5) {
      const existing = await this.prisma.event.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!existing) return slug;
      attempt++;
      slug = `${base}-${new Date().getFullYear()}-${Math.random()
        .toString(36)
        .slice(2, 6)}`;
    }

    return `${base}-${Date.now().toString(36)}`;
  }
}
