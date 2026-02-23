import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Role } from '../generated/prisma/client';

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  // src/event/event.service.ts - create method
  async create(createEventDto: CreateEventDto, organizerId: string) {
    // Ensure capacity is a number
    const capacity = Number(createEventDto.capacity);
    if (isNaN(capacity)) {
      throw new BadRequestException('Capacity must be a valid number');
    }

    const event = await this.prisma.event.create({
      data: {
        title: createEventDto.title,
        description: createEventDto.description,
        date: new Date(createEventDto.date),
        location: createEventDto.location,
        capacity, // now it's a number
        organizerId,
      },
    });
    return event;
  }

  async findAll() {
    return this.prisma.event.findMany({
      include: {
        _count: {
          select: { registrations: true },
        },
        organizer: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: { registrations: true },
        },
        organizer: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return event;
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
    userId: string,
    userRole: Role,
  ) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    const data: any = { ...updateEventDto };
    if (updateEventDto.capacity !== undefined) {
      data.capacity = Number(updateEventDto.capacity);
      if (isNaN(data.capacity)) {
        throw new BadRequestException('Capacity must be a valid number');
      }
    }
    if (updateEventDto.date) {
      data.date = new Date(updateEventDto.date);
    }
    // Only the organizer or an admin can update
    if (event.organizerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You are not allowed to update this event');
    }

    return this.prisma.event.update({
      where: { id },
      data: data,
    });
  }

  async remove(id: string, userId: string, userRole: Role) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    // Only the organizer or an admin can delete
    if (event.organizerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You are not allowed to delete this event');
    }

    // Optionally, you might want to delete related registrations first (cascade in schema?)
    await this.prisma.event.delete({ where: { id } });
    return { deleted: true };
  }
}
