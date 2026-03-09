import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { EventsGateway } from '../event/event.gateway';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class RegistrationService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    @InjectQueue('email') private emailQueue: Queue,
  ) {}

  async register(userId: string, createRegistrationDto: CreateRegistrationDto) {
    const { eventId } = createRegistrationDto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Lock the event row to prevent race conditions
      const [event] = await tx.$queryRaw<{ id: string; capacity: number }[]>`
        SELECT id, capacity FROM "Event" WHERE id = ${eventId} FOR UPDATE
      `;
      if (!event) {
        throw new NotFoundException(`Event with ID ${eventId} not found`);
      }

      // 2. Count currently CONFIRMED registrations
      const confirmedCount = await tx.registration.count({
        where: { eventId, status: 'CONFIRMED' },
      });

      // 3. Check capacity
      if (confirmedCount >= event.capacity) {
        throw new BadRequestException('Event is full');
      }

      // 4. Look for any existing registration (any status) for this user+event
      const existing = await tx.registration.findUnique({
        where: { eventId_userId: { eventId, userId } },
      });

      let registration;
      if (existing) {
        // 5a. If it exists and is CANCELLED, reactivate it
        if (existing.status === 'CANCELLED') {
          registration = await tx.registration.update({
            where: { id: existing.id },
            data: { status: 'CONFIRMED' },
            include: {
              event: true,
              user: { select: { id: true, name: true, email: true } },
            },
          });
        } else {
          // 5b. If it's already CONFIRMED (or PENDING), block duplicate
          throw new ConflictException(
            'You have already registered for this event',
          );
        }
      } else {
        // 6. No existing record → create a new one
        registration = await tx.registration.create({
          data: {
            eventId,
            userId,
            status: 'CONFIRMED',
          },
          include: {
            event: true,
            user: { select: { id: true, name: true, email: true } },
          },
        });
      }

      // 7. After change, recount CONFIRMED registrations for accurate seat update
      const newConfirmedCount = await tx.registration.count({
        where: { eventId, status: 'CONFIRMED' },
      });
      const availableSeats = event.capacity - newConfirmedCount;

      // 8. Emit real‑time update
      this.eventsGateway.emitSeatUpdate(eventId, availableSeats);

      const user = await tx.user.findUnique({ where: { id: userId } });
      const eventDetail = await tx.event.findUnique({ where: { id: eventId } });

      // Queue email (don't await – runs in background)
      await this.emailQueue.add('send-confirmation', {
        to: user!.email,
        subject: `Registration confirmed for ${eventDetail!.title}`,
        html: `
      <h1>Registration Confirmed</h1>
      <p>Hi ${user!.name},</p>
      <p>You have successfully registered for <strong>${eventDetail!.title}</strong>.</p>
      <p><strong>Date:</strong> ${eventDetail!.date}</p>
      <p><strong>Location:</strong> ${eventDetail!.location}</p>
      <p>We look forward to seeing you there!</p>
    `,
      });

      return registration;
    });
  }

  async findUserRegistrations(userId: string) {
    return this.prisma.registration.findMany({
      where: { userId },
      include: { event: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelRegistration(userId: string, registrationId: string) {
    return this.prisma.$transaction(async (tx) => {
      const registration = await tx.registration.findUnique({
        where: { id: registrationId },
        include: { event: true },
      });

      if (!registration) {
        throw new NotFoundException('Registration not found');
      }
      if (registration.userId !== userId) {
        throw new ForbiddenException(
          'You can only cancel your own registrations',
        );
      }
      if (registration.status === 'CANCELLED') {
        throw new BadRequestException('Registration already cancelled');
      }

      // Update to CANCELLED
      const updated = await tx.registration.update({
        where: { id: registrationId },
        data: { status: 'CANCELLED' },
      });

      // Recount CONFIRMED registrations
      const confirmedCount = await tx.registration.count({
        where: { eventId: registration.eventId, status: 'CONFIRMED' },
      });

      const event = await tx.event.findUnique({
        where: { id: registration.eventId },
      });
      if (!event) {
        throw new NotFoundException(
          `Event with ID ${registration.eventId} not found`,
        );
      }

      const availableSeats = event.capacity - confirmedCount;
      this.eventsGateway.emitSeatUpdate(registration.eventId, availableSeats);

      return updated;
    });
  }
}
