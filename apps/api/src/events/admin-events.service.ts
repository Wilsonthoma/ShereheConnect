import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventFilterDto } from './dto/event-filter.dto';
import { ReviewEventDto, ReviewAction } from './dto/review-event.dto';

@Injectable()
export class AdminEventsService {
  private readonly logger = new Logger(AdminEventsService.name);

  constructor(private prisma: PrismaService) {}

  /** List events awaiting approval (default) or all events */
  async list(filter: EventFilterDto) {
    const limit = filter.limit ?? 50;
    const offset = filter.offset ?? 0;

    const where: any = {};
    if (filter.status) where.status = filter.status;
    if (filter.q) {
      where.OR = [
        { title: { contains: filter.q, mode: 'insensitive' } },
        { venueName: { contains: filter.q, mode: 'insensitive' } },
      ];
    }
    if (filter.county) where.county = filter.county;

    const [total, items] = await this.prisma.$transaction([
      this.prisma.event.count({ where }),
      this.prisma.event.findMany({
        where,
        orderBy:
          filter.status === 'PENDING_APPROVAL'
            ? { submittedAt: 'asc' }
            : { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          organizer: { select: { businessName: true } },
          category: { select: { code: true, name: true } },
          ticketTiers: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { bookings: true } },
        },
      }),
    ]);

    return { total, limit, offset, items };
  }

  /** Full event detail for review */
  async findOne(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: {
          select: {
            businessName: true,
            bio: true,
            county: true,
            averageRating: true,
            kycStatus: true,
          },
        },
        category: true,
        ticketTiers: { orderBy: { sortOrder: 'asc' } },
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: {
            admin: { select: { fullName: true } },
          },
        },
        approver: { select: { fullName: true } },
        _count: { select: { bookings: true } },
      },
    });

    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  /** Approve, reject, or request changes */
  async review(adminId: string, eventId: string, dto: ReviewEventDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { status: true, submittedAt: true },
    });
    if (!event) throw new NotFoundException('Event not found');

    if (event.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(
        `Cannot review event in status ${event.status}. Only PENDING_APPROVAL can be reviewed.`,
      );
    }

    let newStatus: 'LIVE' | 'REJECTED' | 'NEEDS_REVISION';
    if (dto.action === ReviewAction.APPROVED) newStatus = 'LIVE';
    else if (dto.action === ReviewAction.REJECTED) newStatus = 'REJECTED';
    else newStatus = 'NEEDS_REVISION';

    const data: any = { status: newStatus };

    if (dto.action === ReviewAction.APPROVED) {
      data.approvedAt = new Date();
      data.approvedBy = adminId;
      data.rejectionReason = null;
    }
    if (dto.action === ReviewAction.REJECTED) {
      data.rejectionReason = dto.rejectionReason ?? 'Rejected by admin';
    }
    if (dto.action === ReviewAction.REQUESTED_CHANGES) {
      data.rejectionReason = dto.notes ?? 'Changes requested';
    }

    const updated = await this.prisma.event.update({
      where: { id: eventId },
      data,
    });

    await this.prisma.eventReview.create({
      data: {
        eventId,
        adminId,
        action: dto.action as any,
        notes: dto.notes ?? null,
      },
    });

    this.logger.log(`Event ${eventId} reviewed: ${dto.action} by ${adminId}`);
    return updated;
  }
}
