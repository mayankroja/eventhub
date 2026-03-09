jest.mock('../prisma/prisma.service', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({
    // mock methods used in the service
    $transaction: jest.fn(),
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      // add other methods as needed
    },
    event: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    registration: {
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  })),
}));
import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationService } from './registration.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../event/event.gateway';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';

describe('RegistrationService', () => {
  let service: RegistrationService;
  let prisma: PrismaService;
  let gateway: EventsGateway;
  const mockQueue = { add: jest.fn() };

  const mockPrisma = {
    $transaction: jest.fn((callback) => callback(mockPrisma)),
    $queryRaw: jest.fn(),
    registration: {
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
    },
  };

  const mockGateway = {
    emitSeatUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventsGateway, useValue: mockGateway },
        { provide: getQueueToken('email'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<RegistrationService>(RegistrationService);
    prisma = module.get<PrismaService>(PrismaService);
    gateway = module.get<EventsGateway>(EventsGateway);
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    const userId = 'user-id';
    const eventId = 'event-id';
    const dto = { eventId };

    it('should register successfully', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ id: eventId, capacity: 10 }]);
      mockPrisma.registration.count.mockResolvedValue(5);
      mockPrisma.registration.findUnique.mockResolvedValue(null);
      mockPrisma.registration.create.mockResolvedValue({
        id: 'reg-id',
        eventId,
        userId,
      });

      const result = await service.register(userId, dto);

      expect(result).toBeDefined();
      expect(mockGateway.emitSeatUpdate).toHaveBeenCalledWith(eventId, 5);
    });

    it('should throw NotFoundException if event not found', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);
      await expect(service.register(userId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if event full', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ id: eventId, capacity: 10 }]);
      mockPrisma.registration.count.mockResolvedValue(10); // full
      await expect(service.register(userId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if already registered', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ id: eventId, capacity: 10 }]);
      mockPrisma.registration.count.mockResolvedValue(5);
      mockPrisma.registration.findUnique.mockResolvedValue({ id: 'reg-id' });
      await expect(service.register(userId, dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findUserRegistrations', () => {
    it('should return user registrations', async () => {
      const registrations = [{ id: '1', eventId: 'e1' }];
      mockPrisma.registration.findMany.mockResolvedValue(registrations);

      const result = await service.findUserRegistrations('user-id');
      expect(result).toEqual(registrations);
      expect(mockPrisma.registration.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-id' },
        include: { event: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('cancelRegistration', () => {
    const userId = 'user-id';
    const regId = 'reg-id';
    const eventId = 'event-id';
    const registration = {
      id: regId,
      userId,
      eventId,
      status: 'CONFIRMED',
      event: { capacity: 10 },
    };

    it('should cancel successfully', async () => {
      mockPrisma.registration.findUnique.mockResolvedValue(registration);
      mockPrisma.registration.update.mockResolvedValue({
        ...registration,
        status: 'CANCELLED',
      });
      mockPrisma.registration.count.mockResolvedValue(3);
      mockPrisma.event.findUnique.mockResolvedValue({ capacity: 10 });

      const result = await service.cancelRegistration(userId, regId);
      expect(result.status).toBe('CANCELLED');
      expect(mockGateway.emitSeatUpdate).toHaveBeenCalledWith(eventId, 7);
    });

    it('should throw NotFoundException if registration not found', async () => {
      mockPrisma.registration.findUnique.mockResolvedValue(null);
      await expect(service.cancelRegistration(userId, regId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if not owner', async () => {
      mockPrisma.registration.findUnique.mockResolvedValue({
        ...registration,
        userId: 'other',
      });
      await expect(service.cancelRegistration(userId, regId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if already cancelled', async () => {
      mockPrisma.registration.findUnique.mockResolvedValue({
        ...registration,
        status: 'CANCELLED',
      });
      await expect(service.cancelRegistration(userId, regId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
