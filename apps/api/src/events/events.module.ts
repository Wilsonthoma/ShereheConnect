import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { OrganizerEventsService } from './organizer-events.service';
import { OrganizerEventsController } from './organizer-events.controller';
import { AdminEventsService } from './admin-events.service';
import { AdminEventsController } from './admin-events.controller';

@Module({
  controllers: [
    EventsController,
    OrganizerEventsController,
    AdminEventsController,
  ],
  providers: [EventsService, OrganizerEventsService, AdminEventsService],
  exports: [EventsService],
})
export class EventsModule {}
