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
import { EventService } from './event.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Role } from '../generated/prisma/client';

const mockEventDto = {
  title: 'Test Event',
  description: 'Test Description',
  date: '2025-12-01T10:00:00Z',
  location: 'Test Location',
  capacity: 100,
};

describe('EventService', () => {
  let service: EventService;
  let prisma: PrismaService;

  const mockPrisma = {
    event: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create an event', async () => {
      const dto = {
        title: 'Test Event',
        description: 'Desc',
        date: '2025-12-01T10:00:00Z',
        location: 'Delhi',
        capacity: 100,
      };
      const userId = 'organizer-id';
      const expected = {
        id: '1',
        ...dto,
        date: new Date(dto.date),
        organizerId: userId,
      };

      mockPrisma.event.create.mockResolvedValue(expected);

      const result = await service.create(dto, userId);
      expect(result).toEqual(expected);
      expect(mockPrisma.event.create).toHaveBeenCalledWith({
        data: {
          title: dto.title,
          description: dto.description,
          date: new Date(dto.date),
          location: dto.location,
          capacity: dto.capacity,
          organizerId: userId,
        },
      });
    });

    it('should throw if capacity is NaN', async () => {
      const dto = { ...mockEventDto, capacity: NaN };
      await expect(service.create(dto, 'user')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all events with counts', async () => {
      const events = [{ id: '1', title: 'Event' }];
      mockPrisma.event.findMany.mockResolvedValue(events);
      const result = await service.findAll();
      expect(result).toEqual(events);
      expect(mockPrisma.event.findMany).toHaveBeenCalledWith({
        include: {
          _count: { select: { registrations: true } },
          organizer: { select: { id: true, name: true, email: true } },
        },
        orderBy: { date: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return an event if exists', async () => {
      const event = { id: '1', title: 'Event' };
      mockPrisma.event.findUnique.mockResolvedValue(event);
      const result = await service.findOne('1');
      expect(result).toEqual(event);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);
      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const event = { id: '1', organizerId: 'owner' };
    beforeEach(() => {
      mockPrisma.event.findUnique.mockResolvedValue(event);
    });

    it('should update if user is organizer', async () => {
      const updateDto = { title: 'New Title' };
      mockPrisma.event.update.mockResolvedValue({ ...event, ...updateDto });

      const result = await service.update('1', updateDto, 'owner', Role.USER);
      expect(result).toBeDefined();
      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateDto,
      });
    });

    it('should allow admin to update', async () => {
      const updateDto = { title: 'Admin Update' };
      mockPrisma.event.update.mockResolvedValue({ ...event, ...updateDto });

      const result = await service.update(
        '1',
        updateDto,
        'different',
        Role.ADMIN,
      );
      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException if not owner nor admin', async () => {
      await expect(service.update('1', {}, 'other', Role.USER)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if event does not exist', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);
      await expect(service.update('1', {}, 'any', Role.USER)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete if user is organizer', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        id: '1',
        organizerId: 'owner',
      });
      mockPrisma.event.delete.mockResolvedValue({ id: '1' });

      const result = await service.remove('1', 'owner', Role.USER);
      expect(result).toEqual({ deleted: true });
    });

    it('should throw ForbiddenException if not owner', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        id: '1',
        organizerId: 'owner',
      });
      await expect(service.remove('1', 'other', Role.USER)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
