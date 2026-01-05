import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UserData {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

interface AuthData {
  accessToken: string;
  user: UserData;
}

interface ConversationData {
  id: string;
  name?: string;
  isGroup: boolean;
  participants: Array<{ id: string; name: string; avatar?: string }>;
  lastMessage?: unknown;
  createdAt: string;
  updatedAt: string;
}

interface MessageData {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  sender: { id: string; name: string; avatar?: string };
}

describe('Chat App (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let accessToken2: string;
  let userId2: string;
  let conversationId: string;

  const testUser = {
    email: `test_${Date.now()}@example.com`,
    name: 'Test User',
    password: 'testpassword123',
  };

  const testUser2 = {
    email: `test2_${Date.now()}@example.com`,
    name: 'Test User 2',
    password: 'testpassword123',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication', () => {
    describe('POST /api/v1/auth/register', () => {
      it('should register a new user', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send(testUser)
          .expect(201);

        const body = response.body as ApiResponse<UserData>;
        expect(body.success).toBe(true);
        expect(body.data.email).toBe(testUser.email);
        expect(body.data.name).toBe(testUser.name);
        expect(body.data.id).toBeDefined();
      });

      it('should register second user', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send(testUser2)
          .expect(201);

        const body = response.body as ApiResponse<UserData>;
        expect(body.success).toBe(true);
        userId2 = body.data.id;
      });

      it('should fail to register with duplicate email', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send(testUser)
          .expect(409);
      });

      it('should fail with invalid email', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send({ ...testUser, email: 'invalid-email' })
          .expect(400);
      });

      it('should fail with short password', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send({ ...testUser, email: 'new@test.com', password: '123' })
          .expect(400);
      });
    });

    describe('POST /api/v1/auth/login', () => {
      it('should login successfully', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ email: testUser.email, password: testUser.password })
          .expect(200);

        const body = response.body as ApiResponse<AuthData>;
        expect(body.success).toBe(true);
        expect(body.data.accessToken).toBeDefined();
        expect(body.data.user.email).toBe(testUser.email);
        accessToken = body.data.accessToken;
      });

      it('should login second user', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ email: testUser2.email, password: testUser2.password })
          .expect(200);

        const body = response.body as ApiResponse<AuthData>;
        accessToken2 = body.data.accessToken;
      });

      it('should fail with wrong password', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ email: testUser.email, password: 'wrongpassword' })
          .expect(401);
      });

      it('should fail with non-existent email', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ email: 'nonexistent@test.com', password: 'password123' })
          .expect(401);
      });
    });
  });

  describe('Conversations', () => {
    describe('POST /api/v1/conversations', () => {
      it('should fail without authentication', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/conversations')
          .send({ participantIds: [userId2] })
          .expect(401);
      });

      it('should create a conversation', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/conversations')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ participantIds: [userId2] })
          .expect(201);

        const body = response.body as ApiResponse<ConversationData>;
        expect(body.success).toBe(true);
        expect(body.data.id).toBeDefined();
        expect(body.data.participants).toHaveLength(2);
        conversationId = body.data.id;
      });

      it('should return existing conversation for same participants', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/conversations')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ participantIds: [userId2] })
          .expect(201);

        const body = response.body as ApiResponse<ConversationData>;
        expect(body.data.id).toBe(conversationId);
      });
    });

    describe('GET /api/v1/conversations', () => {
      it('should get user conversations', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/conversations')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        const body = response.body as ApiResponse<ConversationData[]>;
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.pagination).toBeDefined();
      });

      it('should fail without authentication', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/conversations')
          .expect(401);
      });
    });

    describe('GET /api/v1/conversations/:id', () => {
      it('should get conversation by id', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/conversations/${conversationId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        const body = response.body as ApiResponse<ConversationData>;
        expect(body.success).toBe(true);
        expect(body.data.id).toBe(conversationId);
      });

      it('should fail for non-existent conversation', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/conversations/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(404);
      });
    });
  });

  describe('Messages', () => {
    describe('POST /api/v1/conversations/:id/messages', () => {
      it('should send a message', async () => {
        const response = await request(app.getHttpServer())
          .post(`/api/v1/conversations/${conversationId}/messages`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ content: 'Hello, this is a test message!' })
          .expect(201);

        const body = response.body as ApiResponse<MessageData>;
        expect(body.success).toBe(true);
        expect(body.data.content).toBe('Hello, this is a test message!');
        expect(body.data.conversationId).toBe(conversationId);
      });

      it('should send a message from second user', async () => {
        const response = await request(app.getHttpServer())
          .post(`/api/v1/conversations/${conversationId}/messages`)
          .set('Authorization', `Bearer ${accessToken2}`)
          .send({ content: 'Hello back!' })
          .expect(201);

        const body = response.body as ApiResponse<MessageData>;
        expect(body.success).toBe(true);
      });

      it('should fail with empty content', async () => {
        await request(app.getHttpServer())
          .post(`/api/v1/conversations/${conversationId}/messages`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ content: '' })
          .expect(400);
      });
    });

    describe('GET /api/v1/conversations/:id/messages', () => {
      it('should get message history', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/conversations/${conversationId}/messages`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        const body = response.body as ApiResponse<MessageData[]>;
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.data.length).toBeGreaterThan(0);
        expect(body.pagination).toBeDefined();
      });

      it('should support pagination', async () => {
        const response = await request(app.getHttpServer())
          .get(
            `/api/v1/conversations/${conversationId}/messages?page=1&limit=1`,
          )
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        const body = response.body as ApiResponse<MessageData[]>;
        expect(body.data.length).toBeLessThanOrEqual(1);
        expect(body.pagination?.limit).toBe(1);
      });
    });
  });

  describe('Users', () => {
    describe('GET /api/v1/users/online', () => {
      it('should get online users', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/users/online')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        const body = response.body as ApiResponse<UserData[]>;
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data)).toBe(true);
      });

      it('should fail without authentication', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/users/online')
          .expect(401);
      });
    });
  });
});
