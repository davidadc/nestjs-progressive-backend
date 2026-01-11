import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller, Get, Post } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import {
  ThrottlerModule,
  ThrottlerGuard,
  Throttle,
  SkipThrottle,
} from '@nestjs/throttler';
import request from 'supertest';

// Test controller to verify rate limiting behavior
@Controller('test')
class TestController {
  @Get('default')
  defaultEndpoint() {
    return { message: 'default endpoint' };
  }

  @Post('payment')
  @Throttle({ strict: { limit: 2, ttl: 60000 } }) // 2 requests per minute (stricter)
  paymentEndpoint() {
    return { message: 'payment endpoint' };
  }

  @Get('health')
  @SkipThrottle()
  healthEndpoint() {
    return { message: 'health endpoint' };
  }
}

describe('Rate Limiting - Basic Functionality', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            name: 'short',
            ttl: 1000, // 1 second
            limit: 3, // 3 requests per second
          },
        ]),
      ],
      controllers: [TestController],
      providers: [
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should allow requests within rate limit', async () => {
    const response = await request(app.getHttpServer())
      .get('/test/default')
      .expect(200);

    expect(response.body).toEqual({ message: 'default endpoint' });
  });

  it('should include rate limit headers in response', async () => {
    const response = await request(app.getHttpServer())
      .get('/test/default')
      .expect(200);

    // NestJS Throttler uses named headers with the throttler name
    expect(response.headers['x-ratelimit-limit-short']).toBeDefined();
    expect(response.headers['x-ratelimit-remaining-short']).toBeDefined();
  });

  it('should block requests exceeding rate limit', async () => {
    // Make requests up to the limit (3 requests)
    for (let i = 0; i < 3; i++) {
      await request(app.getHttpServer()).get('/test/default').expect(200);
    }

    // 4th request should be blocked
    const response = await request(app.getHttpServer())
      .get('/test/default')
      .expect(429);

    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('ThrottlerException');
  });
});

describe('Rate Limiting - Custom Limits', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            name: 'default',
            ttl: 60000,
            limit: 100, // High default limit
          },
          {
            name: 'strict',
            ttl: 60000,
            limit: 2, // Strict limit for payment endpoints
          },
        ]),
      ],
      controllers: [TestController],
      providers: [
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should apply stricter limits to payment endpoints', async () => {
    // Make 2 requests (the limit for payment endpoint)
    await request(app.getHttpServer()).post('/test/payment').expect(201);
    await request(app.getHttpServer()).post('/test/payment').expect(201);

    // 3rd request should be blocked
    const response = await request(app.getHttpServer())
      .post('/test/payment')
      .expect(429);

    expect(response.body.message).toContain('ThrottlerException');
  });
});

describe('Rate Limiting - Decorator Behavior', () => {
  it('should have @SkipThrottle decorator available for use', () => {
    // Verify the SkipThrottle decorator is imported and can be applied
    expect(SkipThrottle).toBeDefined();
    expect(typeof SkipThrottle).toBe('function');
  });

  it('should have @Throttle decorator available for custom limits', () => {
    // Verify the Throttle decorator is imported and can be applied
    expect(Throttle).toBeDefined();
    expect(typeof Throttle).toBe('function');
  });
});

describe('Rate Limiting - Headers', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            name: 'test',
            ttl: 60000, // 1 minute
            limit: 100, // High limit to avoid hitting during tests
          },
        ]),
      ],
      controllers: [TestController],
      providers: [
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should return X-RateLimit-Limit header with throttler name', async () => {
    const response = await request(app.getHttpServer())
      .get('/test/default')
      .expect(200);

    expect(response.headers['x-ratelimit-limit-test']).toBe('100');
  });

  it('should return X-RateLimit-Remaining header', async () => {
    const response = await request(app.getHttpServer())
      .get('/test/default')
      .expect(200);

    expect(response.headers['x-ratelimit-remaining-test']).toBeDefined();
    expect(
      parseInt(response.headers['x-ratelimit-remaining-test'], 10),
    ).toBeLessThan(100);
  });

  it('should decrement remaining count with each request', async () => {
    const response1 = await request(app.getHttpServer())
      .get('/test/default')
      .expect(200);

    const remaining1 = parseInt(
      response1.headers['x-ratelimit-remaining-test'],
      10,
    );

    const response2 = await request(app.getHttpServer())
      .get('/test/default')
      .expect(200);

    const remaining2 = parseInt(
      response2.headers['x-ratelimit-remaining-test'],
      10,
    );

    expect(remaining2).toBeLessThan(remaining1);
  });
});

describe('Rate Limiting - Error Response', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            name: 'strict',
            ttl: 60000, // 1 minute
            limit: 1, // Only 1 request per minute
          },
        ]),
      ],
      controllers: [TestController],
      providers: [
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should return 429 status code when rate limited', async () => {
    // First request succeeds
    await request(app.getHttpServer()).get('/test/default').expect(200);

    // Second request is rate limited
    await request(app.getHttpServer()).get('/test/default').expect(429);
  });

  it('should include Retry-After header when rate limited', async () => {
    // Exhaust the limit
    await request(app.getHttpServer()).get('/test/default');

    // Check rate limited response
    const response = await request(app.getHttpServer())
      .get('/test/default')
      .expect(429);

    // NestJS Throttler uses retry-after-{name} format
    expect(response.headers['retry-after-strict']).toBeDefined();
  });

  it('should return proper error message structure', async () => {
    // Exhaust the limit
    await request(app.getHttpServer()).get('/test/default');

    const response = await request(app.getHttpServer())
      .get('/test/default')
      .expect(429);

    expect(response.body).toHaveProperty('statusCode', 429);
    expect(response.body).toHaveProperty('message');
  });
});

describe('Rate Limiting - Tracking Key', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            name: 'tracker',
            ttl: 60000,
            limit: 100, // High limit
          },
        ]),
      ],
      controllers: [TestController],
      providers: [
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should track rate limits independently per request', async () => {
    // Multiple requests should work and decrement counter
    const responses: number[] = [];

    for (let i = 0; i < 5; i++) {
      const response = await request(app.getHttpServer())
        .get('/test/default')
        .expect(200);
      responses.push(
        parseInt(response.headers['x-ratelimit-remaining-tracker'], 10),
      );
    }

    // Verify remaining count decreases
    for (let i = 1; i < responses.length; i++) {
      expect(responses[i]).toBeLessThan(responses[i - 1]);
    }
  });
});
