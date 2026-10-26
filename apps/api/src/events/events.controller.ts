import { Controller, Get, Param, Query } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventFilterDto } from './dto/event-filter.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  async list(@Query() filter: EventFilterDto) {
    return this.events.findLive(filter);
  }

  @Get(':slug')
  async detail(@Param('slug') slug: string) {
    return this.events.findBySlug(slug);
  }
}
