import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DarajaService } from './daraja.service';
import { SubscriptionsPaymentService } from './subscriptions-payment.service';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [ConfigModule, PrismaModule, NotificationsModule],
  controllers: [PaymentsController],
  providers: [DarajaService, SubscriptionsPaymentService],
  exports: [DarajaService, SubscriptionsPaymentService],
})
export class PaymentsModule {}