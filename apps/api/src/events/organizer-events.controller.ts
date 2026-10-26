import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrganizerEventsService } from './organizer-events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventFilterDto } from './dto/event-filter.dto';
import { CancelEventDto } from './dto/cancel-event.dto';

@Controller('organizer/events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ORGANIZER')
export class OrganizerEventsController {
  constructor(private readonly organizerEvents: OrganizerEventsService) {}

  @Post()
  async create(@CurrentUser() user: any, @Body() dto: CreateEventDto) {
    return this.organizerEvents.create(user.id, dto);
  }

  @Get()
  async list(@CurrentUser() user: any, @Query() filter: EventFilterDto) {
    return this.organizerEvents.listOwn(user.id, filter);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.organizerEvents.findOwn(user.id, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.organizerEvents.update(user.id, id, dto);
  }

  @Post(':id/submit')
  async submit(@CurrentUser() user: any, @Param('id') id: string) {
    return this.organizerEvents.submit(user.id, id);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.organizerEvents.delete(user.id, id);
  }

  @Post(':id/cancel')
  async cancel(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: CancelEventDto,
  ) {
    return this.organizerEvents.cancel(user.id, id, dto);
  }

  @Post(':id/duplicate')
  async duplicate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.organizerEvents.duplicate(user.id, id);
  }

  @Get(':id/attendees')
  async attendees(@CurrentUser() user: any, @Param('id') id: string) {
    return this.organizerEvents.listAttendees(user.id, id);
  }
}
