import { Module } from '@nestjs/common';
import { AdminOrganizersService } from './admin-organizers.service';
import { AdminOrganizersController } from './admin-organizers.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [AdminOrganizersController],
  providers: [AdminOrganizersService],
})
export class AdminOrganizersModule {}
