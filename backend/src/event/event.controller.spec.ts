import { Test, TestingModule } from '@nestjs/testing';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { Role } from '../generated/prisma/client';

describe('EventController', () => {
  let controller: EventController;
  let eventService: EventService;

  const mockEventService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventController],
      providers: [{ provide: EventService, useValue: mockEventService }],
    }).compile();

    controller = module.get<EventController>(EventController);
    eventService = module.get<EventService>(EventService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create event if user is organizer', async () => {
      const user = { userId: 'org-id', role: Role.ORGANIZER };
      const dto = { title: 'Event' };
      mockEventService.create.mockResolvedValue({ id: '1' });
      const result = await controller.create(dto as any, user);
      expect(mockEventService.create).toHaveBeenCalledWith(dto, user.userId);
      expect(result).toEqual({ id: '1' });
    });

    it('should throw if user not organizer', async () => {
      const user = { userId: 'user-id', role: Role.USER };
      const dto = { title: 'Event' };
      await expect(controller.create(dto as any, user)).rejects.toThrow();
    });
  });
});
