import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationChannel, NotificationStatus } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    title: string;
    message: string;
    type: string;
    metadata?: any;
  }) {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          metadata: data.metadata ?? {},
          channel: 'IN_APP', // Force the string value
          status: 'SENT',
        },
      });
      this.logger.log(`🔔 Notification created for user ${data.userId}`);
      return notification;
    } catch (error: any) {
      this.logger.error(`❌ FAILED TO CREATE NOTIFICATION: ${error.message}`);
      throw error; // Re-throw so the controller fails and we know
    }
  }

  async getForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async notifyAdmins(title: string, message: string, type: string, metadata?: any) {
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN', status: 'ACTIVE' },
      select: { id: true },
    });

    if (admins.length === 0) {
      this.logger.warn('⚠️ No active admins found to notify.');
      return;
    }

    for (const admin of admins) {
      await this.create({
        userId: admin.id,
        title,
        message,
        type,
        metadata,
      });
    }
  }
}
