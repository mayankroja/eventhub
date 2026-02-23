import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Role } from '../generated/prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() createEventDto: CreateEventDto, @CurrentUser() user) {
    // Only users with ORGANIZER role can create events
    if (user.role !== Role.ORGANIZER) {
      throw new ForbiddenException('Only organizers can create events');
    }
    return this.eventService.create(createEventDto, user.userId);
  }

  @Get()
  async findAll() {
    // Public: anyone can list events
    return this.eventService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.eventService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @CurrentUser() user,
  ) {
    return this.eventService.update(id, updateEventDto, user.userId, user.role);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string, @CurrentUser() user) {
    return this.eventService.remove(id, user.userId, user.role);
  }
}
