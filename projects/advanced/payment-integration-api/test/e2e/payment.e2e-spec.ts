import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PaymentController } from '../../src/payments/infrastructure/controllers/payment.controller';
import { WebhookController } from '../../src/payments/infrastructure/controllers/webhook.controller';
import { ProblemDetailsFilter } from '../../src/common/exceptions';
import { PAYMENT_STRATEGY } from '../../src/payments/application/strategies/payment.strategy.interface';

describe('Payment API (E2E)', () => {
  let app: INestApplication;
  let mockCommandBus: jest.Mocked<CommandBus>;
  let mockQueryBus: jest.Mocked<QueryBus>;
  let mockPaymentStrategy: any;

  beforeAll(async () => {
    // Create mock buses
    mockCommandBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CommandBus>;

    mockQueryBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<QueryBus>;

    mockPaymentStrategy = {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/orders/:orderId/checkout', () => {
    it('should initiate a payment successfully', async () => {
      const paymentResponse = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        orderId: 'a716e29b-41d4-550e-8400-446655440123',
        amount: 99.99,
        currency: 'USD',
        status: 'processing',
        checkoutUrl: 'https://checkout.stripe.com/pay/cs_test_123',
        createdAt: '2026-01-01T00:00:00.000Z',
      };

      mockCommandBus.execute.mockResolvedValue(paymentResponse);

      const response = await request(app.getHttpServer())
        .post('/api/v1/orders/a716e29b-41d4-550e-8400-446655440123/checkout')
        .send({
          currency: 'USD',
          returnUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('statusCode', 201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('status', 'processing');
      expect(mockCommandBus.execute).toHaveBeenCalled();
    });

    it('should return 400 for invalid orderId (not UUID)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/orders/invalid-order-id/checkout')
        .send({
          currency: 'USD',
        })
        .expect(400);

      expect(response.body).toHaveProperty('status', 400);
    });
  });

  describe('GET /api/v1/orders/:orderId/payment-status', () => {
    it('should return payment status successfully', async () => {
      const paymentResponse = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        orderId: 'a716e29b-41d4-550e-8400-446655440123',
        amount: 99.99,
        currency: 'USD',
        status: 'succeeded',
        createdAt: '2026-01-01T00:00:00.000Z',
      };

      mockQueryBus.execute.mockResolvedValue(paymentResponse);

      const response = await request(app.getHttpServer())
        .get('/api/v1/orders/a716e29b-41d4-550e-8400-446655440123/payment-status')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('status', 'succeeded');
      expect(mockQueryBus.execute).toHaveBeenCalled();
    });

    it('should return 400 for invalid orderId format', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/orders/invalid-order-id/payment-status')
        .expect(400);

      expect(response.body).toHaveProperty('status', 400);
    });
  });

  describe('GET /api/v1/payments/:paymentId', () => {
    it('should return payment by ID successfully', async () => {
      const paymentResponse = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        orderId: 'a716e29b-41d4-550e-8400-446655440123',
        amount: 99.99,
        currency: 'USD',
        status: 'succeeded',
        createdAt: '2026-01-01T00:00:00.000Z',
      };

      mockQueryBus.execute.mockResolvedValue(paymentResponse);

      const response = await request(app.getHttpServer())
        .get('/api/v1/payments/550e8400-e29b-41d4-a716-446655440000')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', '550e8400-e29b-41d4-a716-446655440000');
      expect(mockQueryBus.execute).toHaveBeenCalled();
    });

    it('should return 400 for invalid paymentId format', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/payments/invalid-payment-id')
        .expect(400);

      expect(response.body).toHaveProperty('status', 400);
    });
  });

  describe('POST /api/v1/payments/:paymentId/refund', () => {
    it('should initiate refund successfully', async () => {
      const paymentResponse = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        orderId: 'a716e29b-41d4-550e-8400-446655440123',
        amount: 99.99,
        currency: 'USD',
        status: 'refunded',
        createdAt: '2026-01-01T00:00:00.000Z',
      };

      mockCommandBus.execute.mockResolvedValue(paymentResponse);

      const response = await request(app.getHttpServer())
        .post('/api/v1/payments/550e8400-e29b-41d4-a716-446655440000/refund')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('status', 'refunded');
      expect(mockCommandBus.execute).toHaveBeenCalled();
    });

    it('should return 400 for invalid paymentId format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/payments/invalid-payment-id/refund')
        .expect(400);

      expect(response.body).toHaveProperty('status', 400);
    });
  });

  describe('GET /api/v1/transactions', () => {
    it('should return paginated transactions', async () => {
      const transactionsResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        pages: 0,
      };

      mockQueryBus.execute.mockResolvedValue(transactionsResponse);

      const response = await request(app.getHttpServer())
        .get('/api/v1/transactions')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
      expect(mockQueryBus.execute).toHaveBeenCalled();
    });

    it('should filter transactions by status', async () => {
      const transactionsResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        pages: 0,
      };

      mockQueryBus.execute.mockResolvedValue(transactionsResponse);

      const response = await request(app.getHttpServer())
        .get('/api/v1/transactions')
        .query({ status: 'succeeded', page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(mockQueryBus.execute).toHaveBeenCalled();
    });

    it('should return 400 for invalid status value', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/transactions')
        .query({ status: 'invalid-status' })
        .expect(400);

      expect(response.body).toHaveProperty('status', 400);
    });
  });

  describe('POST /api/v1/webhooks/stripe', () => {
    it('should return 400 for missing signature', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/webhooks/stripe')
        .send({ type: 'checkout.session.completed' })
        .expect(400);

      expect(response.body).toHaveProperty('status', 400);
    });

    it('should return 400 for missing raw body (signature provided)', async () => {
      // Note: In production, the raw body parser middleware provides request.rawBody.
      // In our E2E test environment without that middleware, rawBody will be undefined,
      // so we test that the controller properly handles this case.
      const response = await request(app.getHttpServer())
        .post('/api/v1/webhooks/stripe')
        .set('stripe-signature', 'valid_signature')
        .send({ type: 'checkout.session.completed' })
        .expect(400);

      expect(response.body).toHaveProperty('status', 400);
      expect(response.body.detail).toContain('raw body');
    });
  });

  describe('RFC 7807 Error Responses', () => {
    it('should return RFC 7807 format for validation errors', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/orders/invalid-id/checkout')
        .send({})
        .expect(400);

      // Verify RFC 7807 structure
      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('detail');
      expect(response.body).toHaveProperty('instance');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('traceId');

      // Verify content type
      expect(response.headers['content-type']).toContain('application/problem+json');
    });

    it('should include traceId for error tracking', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/orders/invalid-id/checkout')
        .send({})
        .expect(400);

      expect(response.body.traceId).toBeDefined();
      expect(typeof response.body.traceId).toBe('string');
    });

    it('should use x-request-id header as traceId when provided', async () => {
      const customTraceId = 'custom-trace-123';

      const response = await request(app.getHttpServer())
        .post('/api/v1/orders/invalid-id/checkout')
        .set('x-request-id', customTraceId)
        .send({})
        .expect(400);

      expect(response.body.traceId).toBe(customTraceId);
    });
  });
});
