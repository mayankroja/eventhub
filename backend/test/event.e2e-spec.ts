import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role } from '../src/generated/prisma/client';

describe('EventController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let organizerToken: string;
  let organizerId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);
    await app.init();
  });

  beforeEach(async () => {
    await prisma.registration.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.user.deleteMany({});

    // Create an organizer user
    const bcrypt = require('bcrypt');
    const hash = await bcrypt.hash('organizer123', 10);
    const organizer = await prisma.user.create({
      data: {
        email: 'organizer@example.com',
        name: 'Organizer',
        passwordHash: hash,
        role: Role.ORGANIZER,
      },
    });
    organizerId = organizer.id;

    // Login to get token
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'organizer@example.com', password: 'organizer123' });
    organizerToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/events (POST) - create event as organizer', async () => {
    const newEvent = {
      title: 'E2E Test Event',
      description: 'Created during test',
      date: '2025-12-01T10:00:00Z',
      location: 'Test Location',
      capacity: 50,
    };

    return request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send(newEvent)
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.title).toBe(newEvent.title);
        expect(res.body.organizerId).toBe(organizerId);
      });
  });

  it('/events (GET) - public list', async () => {
    // Create an event first
    await prisma.event.create({
      data: {
        title: 'Public Event',
        description: 'desc',
        date: new Date(),
        location: 'loc',
        capacity: 10,
        organizerId,
      },
    });

    return request(app.getHttpServer())
      .get('/events')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
      });
  });

  it('/events/:id (GET) - get single event', async () => {
    const event = await prisma.event.create({
      data: {
        title: 'Single Event',
        description: 'desc',
        date: new Date(),
        location: 'loc',
        capacity: 10,
        organizerId,
      },
    });

    return request(app.getHttpServer())
      .get(`/events/${event.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toBe(event.id);
      });
  });

  it('/events/:id (PATCH) - update as organizer', async () => {
    const event = await prisma.event.create({
      data: {
        title: 'Old Title',
        description: 'desc',
        date: new Date(),
        location: 'loc',
        capacity: 10,
        organizerId,
      },
    });

    return request(app.getHttpServer())
      .patch(`/events/${event.id}`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ title: 'New Title' })
      .expect(200)
      .expect((res) => {
        expect(res.body.title).toBe('New Title');
      });
  });

  it('/events/:id (DELETE) - delete as organizer', async () => {
    const event = await prisma.event.create({
      data: {
        title: 'To Delete',
        description: 'desc',
        date: new Date(),
        location: 'loc',
        capacity: 10,
        organizerId,
      },
    });

    await request(app.getHttpServer())
      .delete(`/events/${event.id}`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .expect(200);

    // Verify it's gone
    const deleted = await prisma.event.findUnique({ where: { id: event.id } });
    expect(deleted).toBeNull();
  });
});
