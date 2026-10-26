import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminEventsService } from './admin-events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { EventFilterDto } from './dto/event-filter.dto';
import { ReviewEventDto } from './dto/review-event.dto';

@Controller('admin/events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminEventsController {
  constructor(private readonly adminEvents: AdminEventsService) {}

  @Get()
  async list(@Query() filter: EventFilterDto) {
    return this.adminEvents.list(filter);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.adminEvents.findOne(id);
  }

  @Post(':id/review')
  async review(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: ReviewEventDto,
  ) {
    return this.adminEvents.review(user.id, id, dto);
  }
}
