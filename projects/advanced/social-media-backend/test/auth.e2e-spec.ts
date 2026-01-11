import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ProblemDetailsFilter } from '../src/common/filters/problem-details.filter';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let refreshToken: string;

  const testUser = {
    email: `e2e-auth-${Date.now()}@example.com`,
    username: `e2eauth${Date.now()}`,
    password: 'TestPass123!',
    name: 'E2E Test User',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new ProblemDetailsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/auth/register (POST)', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('accessToken');
          expect(res.body.data).toHaveProperty('refreshToken');
          expect(res.body.data.user).toHaveProperty('id');
          expect(res.body.data.user.email).toBe(testUser.email);
          expect(res.body.data.user.username).toBe(testUser.username);
          accessToken = res.body.data.accessToken;
          refreshToken = res.body.data.refreshToken;
        });
    });

    it('should reject duplicate email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(409)
        .expect((res) => {
          expect(res.body).toHaveProperty('type');
          expect(res.body).toHaveProperty('title');
          expect(res.body).toHaveProperty('status', 409);
          expect(res.body).toHaveProperty('detail');
        });
    });

    it('should reject invalid email format', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          email: 'invalid-email',
          username: 'newuser123',
        })
        .expect(400);
    });

    it('should reject weak password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'weak@example.com',
          username: 'weakpass',
          password: '123',
          name: 'Weak Pass',
        })
        .expect(400);
    });

    it('should reject missing required fields', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'missing@example.com',
        })
        .expect(400);
    });
  });

  describe('/api/v1/auth/login (POST)', () => {
    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('accessToken');
          expect(res.body.data).toHaveProperty('refreshToken');
          accessToken = res.body.data.accessToken;
          refreshToken = res.body.data.refreshToken;
        });
    });

    it('should reject invalid password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty('type');
          expect(res.body).toHaveProperty('status', 401);
        });
    });

    it('should reject non-existent user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .expect(401);
    });
  });

  describe('/api/v1/auth/refresh (POST)', () => {
    it('should refresh tokens with valid refresh token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: refreshToken,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('accessToken');
          expect(res.body.data).toHaveProperty('refreshToken');
          accessToken = res.body.data.accessToken;
        });
    });

    it('should reject invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        })
        .expect(401);
    });
  });

  describe('/api/v1/auth/profile (GET)', () => {
    it('should get profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data.email).toBe(testUser.email);
          expect(res.body.data.username).toBe(testUser.username);
        });
    });

    it('should reject request without token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .expect(401);
    });

    it('should reject request with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
