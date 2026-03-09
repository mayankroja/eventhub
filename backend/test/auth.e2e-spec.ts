import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);
    await app.init();
  });

  beforeEach(async () => {
    // Clean database
    await prisma.registration.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/register (POST) - success', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        name: 'Test',
        password: 'password123',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.email).toBe('test@example.com');
        expect(res.body).not.toHaveProperty('passwordHash');
      });
  });

  it('/auth/register (POST) - duplicate email', async () => {
    await prisma.user.create({
      data: {
        email: 'dup@example.com',
        name: 'Dup',
        passwordHash: 'hash',
      },
    });
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'dup@example.com', name: 'Test', password: 'pass' })
      .expect(409);
  });

  it('/auth/login (POST) - success', async () => {
    // Create user first
    const bcrypt = require('bcrypt');
    const hash = await bcrypt.hash('password123', 10);
    await prisma.user.create({
      data: { email: 'login@example.com', name: 'Login', passwordHash: hash },
    });

    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'login@example.com', password: 'password123' })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('access_token');
      });
  });

  it('/auth/login (POST) - wrong password', async () => {
    const bcrypt = require('bcrypt');
    const hash = await bcrypt.hash('correct', 10);
    await prisma.user.create({
      data: { email: 'wrong@example.com', name: 'Wrong', passwordHash: hash },
    });

    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'wrong@example.com', password: 'incorrect' })
      .expect(401);
  });

  it('/auth/me (GET) - protected', async () => {
    const bcrypt = require('bcrypt');
    const hash = await bcrypt.hash('pass', 10);
    const user = await prisma.user.create({
      data: { email: 'me@example.com', name: 'Me', passwordHash: hash },
    });

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'me@example.com', password: 'pass' })
      .expect(201);
    const token = loginRes.body.access_token;

    return request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.userId).toBe(user.id);
        expect(res.body.email).toBe(user.email);
      });
  });
});
