import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
}

interface AuthData {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

interface ConversationData {
  id: string;
  participants: Array<{ id: string; name: string }>;
}

interface MessageData {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  sender: { id: string; name: string };
}

describe('ChatGateway (e2e)', () => {
  let app: INestApplication<App>;
  let socket1: Socket;
  let socket2: Socket;
  let accessToken1: string;
  let accessToken2: string;
  let userId1: string;
  let userId2: string;
  let conversationId: string;
  let serverUrl: string;

  const testUser1 = {
    email: `wstest1_${Date.now()}@example.com`,
    name: 'WS Test User 1',
    password: 'testpassword123',
  };

  const testUser2 = {
    email: `wstest2_${Date.now()}@example.com`,
    name: 'WS Test User 2',
    password: 'testpassword123',
  };

  // Helper to wait for socket event
  const waitForEvent = <T>(
    socket: Socket,
    event: string,
    timeout = 5000,
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout waiting for event: ${event}`));
      }, timeout);

      socket.once(event, (data: T) => {
        clearTimeout(timer);
        resolve(data);
      });
    });
  };

  // Helper to create socket connection
  const createSocket = (
    token: string,
    expectError = false,
  ): Promise<Socket> => {
    return new Promise((resolve, reject) => {
      const socket = io(`${serverUrl}/chat`, {
        auth: { token },
        transports: ['websocket'],
        forceNew: true,
        reconnection: false,
      });

      const timeout = setTimeout(() => {
        socket.disconnect();
        reject(new Error('Socket connection timeout'));
      }, 5000);

      socket.on('connect', () => {
        if (!expectError) {
          clearTimeout(timeout);
          resolve(socket);
        }
      });

      socket.on('error', () => {
        if (expectError) {
          clearTimeout(timeout);
          reject(new Error('Auth error'));
        }
      });

      socket.on('disconnect', () => {
        if (expectError) {
          clearTimeout(timeout);
          reject(new Error('Disconnected'));
        }
      });

      socket.on('connect_error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
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
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();
    await app.listen(0); // Random available port
    const httpServer = app.getHttpServer() as {
      address: () => { port: number } | string | null;
    };
    const address = httpServer.address();
    const port =
      typeof address === 'object' && address !== null ? address.port : 3000;
    serverUrl = `http://localhost:${port}`;

    // Register and login both users
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser1)
      .expect(201)
      .then((res) => {
        userId1 = (res.body as ApiResponse<AuthData['user']>).data.id;
      });

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testUser1.email, password: testUser1.password })
      .expect(200)
      .then((res) => {
        accessToken1 = (res.body as ApiResponse<AuthData>).data.accessToken;
      });

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser2)
      .expect(201)
      .then((res) => {
        userId2 = (res.body as ApiResponse<AuthData['user']>).data.id;
      });

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testUser2.email, password: testUser2.password })
      .expect(200)
      .then((res) => {
        accessToken2 = (res.body as ApiResponse<AuthData>).data.accessToken;
      });

    // Create a conversation between users
    await request(app.getHttpServer())
      .post('/api/v1/conversations')
      .set('Authorization', `Bearer ${accessToken1}`)
      .send({ participantIds: [userId2] })
      .expect(201)
      .then((res) => {
        conversationId = (res.body as ApiResponse<ConversationData>).data.id;
      });
  });

  afterAll(async () => {
    socket1?.disconnect();
    socket2?.disconnect();
    await app.close();
  });

  afterEach(() => {
    socket1?.disconnect();
    socket2?.disconnect();
  });

  describe('Connection', () => {
    it('should connect with valid token', async () => {
      socket1 = await createSocket(accessToken1);
      expect(socket1.connected).toBe(true);
    });

    it('should reject connection with invalid token', async () => {
      await expect(createSocket('invalid-token', true)).rejects.toThrow();
    });

    it('should broadcast user:online on connect', async () => {
      socket1 = await createSocket(accessToken1);
      await new Promise((r) => setTimeout(r, 100));

      // Connect second user and wait for online event from user2
      // Need to filter for the specific user since we might receive our own online event first
      const onlinePromise = new Promise<{
        userId: string;
        name: string;
        status: string;
      }>((resolve) => {
        socket1.on(
          'user:online',
          (data: { userId: string; name: string; status: string }) => {
            if (data.userId === userId2) {
              resolve(data);
            }
          },
        );
      });

      socket2 = await createSocket(accessToken2);

      const onlineEvent = await onlinePromise;
      expect(onlineEvent.userId).toBe(userId2);
      expect(onlineEvent.status).toBe('online');
    });

    it('should broadcast user:offline on disconnect', async () => {
      socket1 = await createSocket(accessToken1);
      socket2 = await createSocket(accessToken2);
      await new Promise((r) => setTimeout(r, 200));

      const offlinePromise = waitForEvent<{ userId: string }>(
        socket1,
        'user:offline',
      );
      socket2.disconnect();

      const offlineEvent = await offlinePromise;
      expect(offlineEvent.userId).toBe(userId2);
    });
  });

  describe('Conversation', () => {
    beforeEach(async () => {
      socket1 = await createSocket(accessToken1);
      socket2 = await createSocket(accessToken2);
      // Wait for connection events to settle
      await new Promise((r) => setTimeout(r, 100));
    });

    it('should join conversation when user is participant', async () => {
      socket1.emit('conversation:join', { conversationId });
      // No error means success - gateway logs the join
      await new Promise((r) => setTimeout(r, 100));
      expect(socket1.connected).toBe(true);
    });

    it('should emit error when joining conversation user is not part of', async () => {
      // Create a socket for user1 and try to join a non-existent conversation
      const errorPromise = waitForEvent<{ message: string; code: string }>(
        socket1,
        'error',
      );
      socket1.emit('conversation:join', {
        conversationId: '00000000-0000-0000-0000-000000000000',
      });

      const error = await errorPromise;
      expect(error.code).toBe('FORBIDDEN');
      expect(error.message).toBe('Not a participant of this conversation');
    });

    it('should leave conversation', async () => {
      socket1.emit('conversation:join', { conversationId });
      await new Promise((r) => setTimeout(r, 100));

      socket1.emit('conversation:leave', { conversationId });
      await new Promise((r) => setTimeout(r, 100));
      expect(socket1.connected).toBe(true);
    });
  });

  describe('Messages', () => {
    beforeEach(async () => {
      socket1 = await createSocket(accessToken1);
      socket2 = await createSocket(accessToken2);
      await new Promise((r) => setTimeout(r, 100));

      // Both users join the conversation
      socket1.emit('conversation:join', { conversationId });
      socket2.emit('conversation:join', { conversationId });
      await new Promise((r) => setTimeout(r, 100));
    });

    it('should send message and receive in conversation room', async () => {
      const messagePromise = waitForEvent<MessageData>(
        socket2,
        'message:received',
      );

      socket1.emit('message:send', {
        conversationId,
        content: 'Hello from E2E test!',
      });

      const message = await messagePromise;
      expect(message.content).toBe('Hello from E2E test!');
      expect(message.sender.id).toBe(userId1);
      expect(message.conversationId).toBe(conversationId);
    });

    it('should broadcast message to sender as well', async () => {
      const messagePromise = waitForEvent<MessageData>(
        socket1,
        'message:received',
      );

      socket1.emit('message:send', {
        conversationId,
        content: 'Self-receive test',
      });

      const message = await messagePromise;
      expect(message.content).toBe('Self-receive test');
      expect(message.sender.id).toBe(userId1);
    });
  });

  describe('Typing Indicators', () => {
    beforeEach(async () => {
      socket1 = await createSocket(accessToken1);
      socket2 = await createSocket(accessToken2);
      await new Promise((r) => setTimeout(r, 100));

      socket1.emit('conversation:join', { conversationId });
      socket2.emit('conversation:join', { conversationId });
      await new Promise((r) => setTimeout(r, 100));
    });

    it('should broadcast typing:start to other users', async () => {
      const typingPromise = waitForEvent<{
        conversationId: string;
        userId: string;
        isTyping: boolean;
      }>(socket2, 'typing:update');

      socket1.emit('typing:start', { conversationId });

      const typing = await typingPromise;
      expect(typing.conversationId).toBe(conversationId);
      expect(typing.userId).toBe(userId1);
      expect(typing.isTyping).toBe(true);
    });

    it('should broadcast typing:stop to other users', async () => {
      const typingPromise = waitForEvent<{
        conversationId: string;
        userId: string;
        isTyping: boolean;
      }>(socket2, 'typing:update');

      socket1.emit('typing:stop', { conversationId });

      const typing = await typingPromise;
      expect(typing.conversationId).toBe(conversationId);
      expect(typing.userId).toBe(userId1);
      expect(typing.isTyping).toBe(false);
    });
  });

  describe('Presence', () => {
    beforeEach(async () => {
      socket1 = await createSocket(accessToken1);
      socket2 = await createSocket(accessToken2);
      await new Promise((r) => setTimeout(r, 100));
    });

    it('should broadcast presence update to all users', async () => {
      const presencePromise = waitForEvent<{
        userId: string;
        name: string;
        status: string;
      }>(socket2, 'user:online');

      socket1.emit('presence:update', { status: 'away' });

      const presence = await presencePromise;
      expect(presence.userId).toBe(userId1);
      expect(presence.status).toBe('away');
    });

    it('should update status to busy', async () => {
      const presencePromise = waitForEvent<{
        userId: string;
        name: string;
        status: string;
      }>(socket2, 'user:online');

      socket1.emit('presence:update', { status: 'busy' });

      const presence = await presencePromise;
      expect(presence.userId).toBe(userId1);
      expect(presence.status).toBe('busy');
    });
  });
});
