import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Role } from '../generated/prisma/client';

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  async create(createEventDto: CreateEventDto, organizerId: string) {
    // Ensure the user is an organizer (already checked in controller, but we can double-check)
    const event = await this.prisma.event.create({
      data: {
        ...createEventDto,
        date: new Date(createEventDto.date),
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

    // Only the organizer or an admin can update
    if (event.organizerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You are not allowed to update this event');
    }

    return this.prisma.event.update({
      where: { id },
      data: {
        ...updateEventDto,
        date: updateEventDto.date ? new Date(updateEventDto.date) : undefined,
      },
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
