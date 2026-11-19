import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionsPaymentService } from './subscriptions-payment.service';
import { InitiateSubscriptionDto } from './dto/initiate-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly subscriptionPayments: SubscriptionsPaymentService,
  ) {}

  @Post('subscriptions/stk-push')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER')
  initiateSubscriptionStk(
    @CurrentUser() user: any,
    @Body() dto: InitiateSubscriptionDto,
  ) {
    return this.subscriptionPayments.initiateUpgrade(user.id, dto);
  }

  @Get('subscriptions/status/:checkoutRequestId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER')
  getSubscriptionPaymentStatus(
    @CurrentUser() user: any,
    @Param('checkoutRequestId') checkoutRequestId: string,
  ) {
    return this.subscriptionPayments.getPaymentStatus(
      user.id,
      checkoutRequestId,
    );
  }

  @Get('subscriptions/history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER')
  getSubscriptionHistory(@CurrentUser() user: any) {
    return this.subscriptionPayments.listSubscriptionPayments(user.id);
  }

  @Post('mpesa/callback')
  @HttpCode(HttpStatus.OK)
  handleStkCallback(
    @Body() payload: any,
    @Query('token') token?: string,
  ) {
    return this.subscriptionPayments.handleStkCallback(payload, token);
  }
}