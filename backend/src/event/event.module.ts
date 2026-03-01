import { Global, Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { EventsGateway } from './event.gateway';

@Global()
@Module({
  controllers: [EventController],
  providers: [EventService, EventsGateway],
  exports: [EventsGateway],
})
export class EventModule {}
