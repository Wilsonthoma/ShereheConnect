import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingFilterDto } from './dto/booking-filter.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { CheckInTicketDto } from './dto/check-in-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  createBooking(@CurrentUser() user: any, @Body() dto: CreateBookingDto) {
    return this.bookingsService.createBooking(user.id, dto);
  }

  @Get('my')
  listMyBookings(
    @CurrentUser() user: any,
    @Query() filter: BookingFilterDto,
  ) {
    return this.bookingsService.listMyBookings(user.id, filter);
  }

  @Get('event/:eventId')
  @UseGuards(RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  listEventBookings(
    @CurrentUser() user: any,
    @Param('eventId') eventId: string,
    @Query() filter: BookingFilterDto,
  ) {
    return this.bookingsService.listEventBookingsForOrganizer(
      eventId,
      user.id,
      user.role,
      filter,
    );
  }

  @Post('tickets/check-in')
  @UseGuards(RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  checkInTicket(@CurrentUser() user: any, @Body() dto: CheckInTicketDto) {
    return this.bookingsService.checkInTicket(user.id, user.role, dto);
  }

  @Get(':id')
  getBookingById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.bookingsService.getBookingById(id, user.id, user.role);
  }

  @Patch(':id/cancel')
  cancelBooking(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingsService.cancelBooking(id, user.id, dto);
  }
}