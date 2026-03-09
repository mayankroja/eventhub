import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role } from '../src/generated/prisma/client';

describe('RegistrationController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userToken: string;
  let userId: string;
  let eventId: string;

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

    // Create a regular user
    const bcrypt = require('bcrypt');
    const hash = await bcrypt.hash('user123', 10);
    const user = await prisma.user.create({
      data: {
        email: 'user@example.com',
        name: 'User',
        passwordHash: hash,
        role: Role.USER,
      },
    });
    userId = user.id;

    // Create an event
    const event = await prisma.event.create({
      data: {
        title: 'Test Event',
        description: 'desc',
        date: new Date(Date.now() + 86400000), // tomorrow
        location: 'loc',
        capacity: 2,
        organizerId: userId, // using same user for simplicity
      },
    });
    eventId = event.id;

    // Login to get token
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'user123' });
    userToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/registrations (POST) - register for event', async () => {
    return request(app.getHttpServer())
      .post('/registrations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ eventId })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.userId).toBe(userId);
        expect(res.body.eventId).toBe(eventId);
      });
  });

  it('/registrations (POST) - prevent duplicate registration', async () => {
    await prisma.registration.create({
      data: { eventId, userId, status: 'CONFIRMED' },
    });

    return request(app.getHttpServer())
      .post('/registrations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ eventId })
      .expect(409);
  });

  it('/registrations/me (GET) - get user registrations', async () => {
    await prisma.registration.create({
      data: { eventId, userId, status: 'CONFIRMED' },
    });

    return request(app.getHttpServer())
      .get('/registrations/me')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
        expect(res.body[0].event.id).toBe(eventId);
      });
  });

  it('/registrations/:id (DELETE) - cancel registration', async () => {
    const reg = await prisma.registration.create({
      data: { eventId, userId, status: 'CONFIRMED' },
    });

    await request(app.getHttpServer())
      .delete(`/registrations/${reg.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    const cancelled = await prisma.registration.findUnique({
      where: { id: reg.id },
    });
    expect(cancelled!.status).toBe('CANCELLED');
  });
});
