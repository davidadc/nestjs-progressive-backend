import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Reflector } from '@nestjs/core';
import { PaymentController } from '../../src/payments/infrastructure/controllers/payment.controller';
import { WebhookController } from '../../src/payments/infrastructure/controllers/webhook.controller';
import { HealthController } from '../../src/common/health/health.controller';
import { ProblemDetailsFilter } from '../../src/common/exceptions';
import { PAYMENT_STRATEGY } from '../../src/payments/application/strategies/payment.strategy.interface';
import {
  IdempotencyInterceptor,
  IDEMPOTENT_KEY,
} from '../../src/common/idempotency/idempotency.interceptor';
import { IDEMPOTENCY_REPOSITORY } from '../../src/common/idempotency/idempotency.repository';
import {
  HealthCheckService,
  TypeOrmHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import { PaymentProviderHealthIndicator } from '../../src/common/health/payment-provider.health';
import paymentConfig from '../../src/config/payment.config';

describe('Health Check Endpoints (E2E)', () => {
  let app: INestApplication;
  let mockHealthCheckService: jest.Mocked<HealthCheckService>;

  beforeAll(async () => {
    mockHealthCheckService = {
      check: jest.fn(),
    } as unknown as jest.Mocked<HealthCheckService>;

    const mockDbIndicator = {
      pingCheck: jest.fn(),
    };

    const mockPaymentProviderIndicator = {
      isHealthy: jest.fn().mockResolvedValue({
        'payment-provider': { status: 'up', provider: 'stripe' },
      }),
    };

    const mockConfig = {
      provider: 'stripe',
      stripe: { secretKey: 'sk_test', publishableKey: 'pk_test', webhookSecret: 'whsec_test' },
      paystack: { secretKey: 'sk_test', publicKey: 'pk_test', webhookSecret: 'whsec_test', baseUrl: 'https://api.paystack.co' },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: mockHealthCheckService,
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: mockDbIndicator,
        },
        {
          provide: PaymentProviderHealthIndicator,
          useValue: mockPaymentProviderIndicator,
        },
        {
          provide: paymentConfig.KEY,
          useValue: mockConfig,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const healthResult: HealthCheckResult = {
        status: 'ok',
        info: {
          database: { status: 'up' },
          'payment-provider': { status: 'up', provider: 'stripe' },
        },
        error: {},
        details: {
          database: { status: 'up' },
          'payment-provider': { status: 'up', provider: 'stripe' },
        },
      };
      mockHealthCheckService.check.mockResolvedValue(healthResult);

      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('info');
      expect(response.body).toHaveProperty('details');
    });

    it('should include database health indicator', async () => {
      const healthResult: HealthCheckResult = {
        status: 'ok',
        info: { database: { status: 'up' } },
        error: {},
        details: { database: { status: 'up' } },
      };
      mockHealthCheckService.check.mockResolvedValue(healthResult);

      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body.info).toHaveProperty('database');
    });
  });

  describe('GET /health/ready', () => {
    it('should return readiness status', async () => {
      const readyResult: HealthCheckResult = {
        status: 'ok',
        info: { database: { status: 'up' } },
        error: {},
        details: { database: { status: 'up' } },
      };
      mockHealthCheckService.check.mockResolvedValue(readyResult);

      const response = await request(app.getHttpServer())
        .get('/health/ready')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
    });
  });

  describe('GET /health/live', () => {
    it('should return liveness status', async () => {
      const liveResult: HealthCheckResult = {
        status: 'ok',
        info: {},
        error: {},
        details: {},
      };
      mockHealthCheckService.check.mockResolvedValue(liveResult);

      const response = await request(app.getHttpServer())
        .get('/health/live')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
    });

    it('should always return ok for liveness (no external dependencies)', async () => {
      mockHealthCheckService.check.mockResolvedValue({
        status: 'ok',
        info: {},
        error: {},
        details: {},
      });

      const response = await request(app.getHttpServer())
        .get('/health/live')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(Object.keys(response.body.info || {})).toHaveLength(0);
    });
  });
});

describe('Idempotency (E2E)', () => {
  let app: INestApplication;
  let mockCommandBus: jest.Mocked<CommandBus>;
  let mockQueryBus: jest.Mocked<QueryBus>;
  let mockIdempotencyRepository: any;
  const storedKeys: Map<string, any> = new Map();

  beforeAll(async () => {
    mockCommandBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CommandBus>;

    mockQueryBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<QueryBus>;

    mockIdempotencyRepository = {
      findByKey: jest.fn().mockImplementation((key: string) => {
        return Promise.resolve(storedKeys.get(key) || null);
      }),
      create: jest.fn().mockImplementation((data: any) => {
        const record = { ...data, id: `idem-${Date.now()}`, createdAt: new Date() };
        storedKeys.set(data.key, record);
        return Promise.resolve(record);
      }),
      update: jest.fn().mockImplementation((id: string, data: any) => {
        for (const [key, value] of storedKeys.entries()) {
          if (value.id === id) {
            storedKeys.set(key, { ...value, ...data });
            break;
          }
        }
        return Promise.resolve();
      }),
      deleteExpired: jest.fn().mockResolvedValue(undefined),
    };

    const mockPaymentStrategy = {
      validateWebhookSignature: jest.fn(),
      parseWebhookEvent: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController, WebhookController],
      providers: [
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
        {
          provide: PAYMENT_STRATEGY,
          useValue: mockPaymentStrategy,
        },
        {
          provide: IDEMPOTENCY_REPOSITORY,
          useValue: mockIdempotencyRepository,
        },
        Reflector,
        IdempotencyInterceptor,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    app.useGlobalFilters(new ProblemDetailsFilter());

    // Get the interceptor instance and apply it
    const idempotencyInterceptor = app.get(IdempotencyInterceptor);
    app.useGlobalInterceptors(idempotencyInterceptor);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    storedKeys.clear();
    jest.clearAllMocks();
  });

  describe('Idempotency-Key header', () => {
    it('should accept requests with Idempotency-Key header', async () => {
      const paymentResponse = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        orderId: 'a716e29b-41d4-550e-8400-446655440123',
        amount: 100,
        currency: 'USD',
        status: 'processing',
      };
      mockCommandBus.execute.mockResolvedValue(paymentResponse);

      const idempotencyKey = `test-key-${Date.now()}`;

      const response = await request(app.getHttpServer())
        .post('/api/v1/orders/a716e29b-41d4-550e-8400-446655440123/checkout')
        .set('Idempotency-Key', idempotencyKey)
        .send({ currency: 'USD' })
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
    });

    it('should work without Idempotency-Key header', async () => {
      const paymentResponse = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        orderId: 'b716e29b-41d4-550e-8400-446655440124',
        amount: 100,
        currency: 'USD',
        status: 'processing',
      };
      mockCommandBus.execute.mockResolvedValue(paymentResponse);

      const response = await request(app.getHttpServer())
        .post('/api/v1/orders/b716e29b-41d4-550e-8400-446655440124/checkout')
        .send({ currency: 'USD' })
        .expect(201);

      expect(response.body).toHaveProperty('data');
    });

    it('should return cached response for duplicate idempotent request', async () => {
      const idempotencyKey = `duplicate-test-${Date.now()}`;
      const orderId = 'c716e29b-41d4-550e-8400-446655440125';
      const paymentId = '660e8400-e29b-41d4-a716-446655440002';

      const paymentResponse = {
        id: paymentId,
        orderId,
        amount: 200,
        currency: 'USD',
        status: 'processing',
      };
      mockCommandBus.execute.mockResolvedValue(paymentResponse);

      // First request
      const response1 = await request(app.getHttpServer())
        .post(`/api/v1/orders/${orderId}/checkout`)
        .set('Idempotency-Key', idempotencyKey)
        .send({ currency: 'USD' })
        .expect(201);

      expect(response1.body.data.id).toBe(paymentId);

      // Update the stored record to 'completed' status with response
      const storedRecord = storedKeys.get(idempotencyKey);
      if (storedRecord) {
        storedRecord.status = 'completed';
        storedRecord.response = JSON.stringify(response1.body);
        storedRecord.statusCode = 201;
      }

      // Second request with same idempotency key
      const response2 = await request(app.getHttpServer())
        .post(`/api/v1/orders/${orderId}/checkout`)
        .set('Idempotency-Key', idempotencyKey)
        .send({ currency: 'USD' })
        .expect(201);

      // Should return the same payment ID
      expect(response2.body.data.id).toBe(paymentId);
      // Response should indicate it was replayed
      expect(response2.headers['x-idempotent-replayed']).toBe('true');
    });

    it('should reject request with same key but different payload', async () => {
      const idempotencyKey = `conflict-test-${Date.now()}`;
      const orderId = 'd716e29b-41d4-550e-8400-446655440126';

      const paymentResponse = {
        id: '770e8400-e29b-41d4-a716-446655440003',
        orderId,
        amount: 100,
        currency: 'USD',
        status: 'processing',
      };
      mockCommandBus.execute.mockResolvedValue(paymentResponse);

      // First request with USD currency
      await request(app.getHttpServer())
        .post(`/api/v1/orders/${orderId}/checkout`)
        .set('Idempotency-Key', idempotencyKey)
        .send({ currency: 'USD' })
        .expect(201);

      // Update the stored record
      const storedRecord = storedKeys.get(idempotencyKey);
      if (storedRecord) {
        storedRecord.status = 'completed';
        storedRecord.response = '{}';
        storedRecord.statusCode = 201;
      }

      // Second request with EUR currency (different payload)
      const response = await request(app.getHttpServer())
        .post(`/api/v1/orders/${orderId}/checkout`)
        .set('Idempotency-Key', idempotencyKey)
        .send({ currency: 'EUR' })
        .expect(409);

      // Check for the error message in either message or detail field (RFC 7807)
      const errorMessage = response.body.message || response.body.detail || '';
      expect(errorMessage).toContain('different request payload');
    });
  });
});

describe('Rate Limiting Behavior (E2E)', () => {
  let app: INestApplication;
  let mockCommandBus: jest.Mocked<CommandBus>;
  let mockQueryBus: jest.Mocked<QueryBus>;

  beforeAll(async () => {
    mockCommandBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CommandBus>;

    mockQueryBus = {
      execute: jest.fn().mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        pages: 0,
      }),
    } as unknown as jest.Mocked<QueryBus>;

    const mockPaymentStrategy = {
      validateWebhookSignature: jest.fn(),
      parseWebhookEvent: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController, WebhookController],
      providers: [
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
        {
          provide: PAYMENT_STRATEGY,
          useValue: mockPaymentStrategy,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should respond successfully to transaction list request', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/transactions')
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('data');
  });

  it('should document rate limiting in API responses', async () => {
    // Note: Without ThrottlerModule in the test, we just verify
    // the endpoint responds correctly. Full rate limit testing
    // is done in integration tests.
    const response = await request(app.getHttpServer())
      .get('/api/v1/transactions')
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
  });
});
