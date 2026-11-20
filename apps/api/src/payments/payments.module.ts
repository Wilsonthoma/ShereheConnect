import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BookingsModule } from '../bookings/bookings.module';
import { DarajaService } from './daraja.service';
import { SubscriptionsPaymentService } from './subscriptions-payment.service';
import { C2bTicketPaymentService } from './c2b-ticket-payment.service';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    NotificationsModule,
    BookingsModule,
  ],
  controllers: [PaymentsController],
  providers: [
    DarajaService,
    SubscriptionsPaymentService,
    C2bTicketPaymentService,
  ],
  exports: [
    DarajaService,
    SubscriptionsPaymentService,
    C2bTicketPaymentService,
  ],
})
export class PaymentsModule {}