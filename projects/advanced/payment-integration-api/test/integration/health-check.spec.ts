import { Test, TestingModule } from '@nestjs/testing';
import { ConfigType } from '@nestjs/config';
import {
  HealthCheckService,
  TypeOrmHealthIndicator,
  HealthCheckResult,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { HealthController } from '../../src/common/health/health.controller';
import { PaymentProviderHealthIndicator } from '../../src/common/health/payment-provider.health';
import paymentConfig from '../../src/config/payment.config';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: jest.Mocked<HealthCheckService>;
  let dbIndicator: jest.Mocked<TypeOrmHealthIndicator>;
  let paymentProviderIndicator: PaymentProviderHealthIndicator;

  const mockConfig: ConfigType<typeof paymentConfig> = {
    provider: 'stripe',
    stripe: {
      secretKey: 'sk_test_123',
      publishableKey: 'pk_test_123',
      webhookSecret: 'whsec_test_123',
    },
    paystack: {
      secretKey: 'sk_test_paystack',
      publicKey: 'pk_test_paystack',
      webhookSecret: 'webhook_secret_paystack',
      baseUrl: 'https://api.paystack.co',
    },
  };

  beforeEach(async () => {
    healthCheckService = {
      check: jest.fn(),
    } as unknown as jest.Mocked<HealthCheckService>;

    dbIndicator = {
      pingCheck: jest.fn(),
    } as unknown as jest.Mocked<TypeOrmHealthIndicator>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: healthCheckService,
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: dbIndicator,
        },
        {
          provide: paymentConfig.KEY,
          useValue: mockConfig,
        },
        PaymentProviderHealthIndicator,
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    paymentProviderIndicator = module.get<PaymentProviderHealthIndicator>(
      PaymentProviderHealthIndicator,
    );
  });

  describe('check()', () => {
    it('should return healthy status when all services are up', async () => {
      const healthyResult: HealthCheckResult = {
        status: 'ok',
        info: {
          database: { status: 'up' },
          'payment-provider': { status: 'up', provider: 'stripe', message: 'Stripe API is reachable' },
        },
        error: {},
        details: {
          database: { status: 'up' },
          'payment-provider': { status: 'up', provider: 'stripe', message: 'Stripe API is reachable' },
        },
      };

      healthCheckService.check.mockResolvedValue(healthyResult);

      const result = await controller.check();

      expect(result.status).toBe('ok');
      expect(healthCheckService.check).toHaveBeenCalledWith([
        expect.any(Function),
        expect.any(Function),
      ]);
    });

    it('should return unhealthy status when database is down', async () => {
      const unhealthyResult: HealthCheckResult = {
        status: 'error',
        info: {
          'payment-provider': { status: 'up', provider: 'stripe', message: 'Stripe API is reachable' },
        },
        error: {
          database: { status: 'down', message: 'Connection refused' },
        },
        details: {
          database: { status: 'down', message: 'Connection refused' },
          'payment-provider': { status: 'up', provider: 'stripe', message: 'Stripe API is reachable' },
        },
      };

      healthCheckService.check.mockResolvedValue(unhealthyResult);

      const result = await controller.check();

      expect(result.status).toBe('error');
      expect(result.error).toHaveProperty('database');
    });

    it('should return unhealthy status when payment provider is down', async () => {
      const unhealthyResult: HealthCheckResult = {
        status: 'error',
        info: {
          database: { status: 'up' },
        },
        error: {
          'payment-provider': { status: 'down', provider: 'stripe', message: 'Stripe API is unreachable' },
        },
        details: {
          database: { status: 'up' },
          'payment-provider': { status: 'down', provider: 'stripe', message: 'Stripe API is unreachable' },
        },
      };

      healthCheckService.check.mockResolvedValue(unhealthyResult);

      const result = await controller.check();

      expect(result.status).toBe('error');
      expect(result.error).toHaveProperty('payment-provider');
    });
  });

  describe('readiness()', () => {
    it('should return ready when database is up', async () => {
      const readyResult: HealthCheckResult = {
        status: 'ok',
        info: {
          database: { status: 'up' },
        },
        error: {},
        details: {
          database: { status: 'up' },
        },
      };

      healthCheckService.check.mockResolvedValue(readyResult);

      const result = await controller.readiness();

      expect(result.status).toBe('ok');
      expect(healthCheckService.check).toHaveBeenCalledWith([expect.any(Function)]);
    });

    it('should return not ready when database is down', async () => {
      const notReadyResult: HealthCheckResult = {
        status: 'error',
        info: {},
        error: {
          database: { status: 'down', message: 'Connection timeout' },
        },
        details: {
          database: { status: 'down', message: 'Connection timeout' },
        },
      };

      healthCheckService.check.mockResolvedValue(notReadyResult);

      const result = await controller.readiness();

      expect(result.status).toBe('error');
    });

    it('should only check database connectivity', async () => {
      healthCheckService.check.mockResolvedValue({
        status: 'ok',
        info: { database: { status: 'up' } },
        error: {},
        details: { database: { status: 'up' } },
      });

      await controller.readiness();

      // Verify only one check function is passed (database)
      expect(healthCheckService.check).toHaveBeenCalledWith([expect.any(Function)]);
      const checkFunctions = healthCheckService.check.mock.calls[0][0];
      expect(checkFunctions).toHaveLength(1);
    });
  });

  describe('liveness()', () => {
    it('should always return alive (empty checks)', async () => {
      const aliveResult: HealthCheckResult = {
        status: 'ok',
        info: {},
        error: {},
        details: {},
      };

      healthCheckService.check.mockResolvedValue(aliveResult);

      const result = await controller.liveness();

      expect(result.status).toBe('ok');
      expect(healthCheckService.check).toHaveBeenCalledWith([]);
    });

    it('should not depend on external services', async () => {
      healthCheckService.check.mockResolvedValue({
        status: 'ok',
        info: {},
        error: {},
        details: {},
      });

      await controller.liveness();

      // Verify empty array is passed (no external checks)
      expect(healthCheckService.check).toHaveBeenCalledWith([]);
    });
  });
});

describe('PaymentProviderHealthIndicator', () => {
  let indicator: PaymentProviderHealthIndicator;
  let mockFetch: jest.Mock;

  const createMockConfig = (provider: 'stripe' | 'paystack'): ConfigType<typeof paymentConfig> => ({
    provider,
    stripe: {
      secretKey: 'sk_test_123',
      publishableKey: 'pk_test_123',
      webhookSecret: 'whsec_test_123',
    },
    paystack: {
      secretKey: 'sk_test_paystack',
      publicKey: 'pk_test_paystack',
      webhookSecret: 'webhook_secret_paystack',
      baseUrl: 'https://api.paystack.co',
    },
  });

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('isHealthy with Stripe provider', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PaymentProviderHealthIndicator,
          {
            provide: paymentConfig.KEY,
            useValue: createMockConfig('stripe'),
          },
        ],
      }).compile();

      indicator = module.get<PaymentProviderHealthIndicator>(PaymentProviderHealthIndicator);
    });

    it('should return healthy when Stripe API returns 200', async () => {
      mockFetch.mockResolvedValue({ status: 200 });

      const result = await indicator.isHealthy('payment-provider');

      expect(result).toEqual({
        'payment-provider': {
          status: 'up',
          provider: 'stripe',
          message: 'Stripe API is reachable',
        },
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.stripe.com/v1/balance',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer sk_test_123',
          }),
        }),
      );
    });

    it('should return healthy when Stripe API returns 401 (reachable but unauthorized)', async () => {
      mockFetch.mockResolvedValue({ status: 401 });

      const result = await indicator.isHealthy('payment-provider');

      expect(result['payment-provider'].status).toBe('up');
    });

    it('should throw HealthCheckError when Stripe API is unreachable', async () => {
      mockFetch.mockResolvedValue({ status: 500 });

      await expect(indicator.isHealthy('payment-provider')).rejects.toThrow(
        'Payment provider check failed',
      );
    });

    it('should throw HealthCheckError when fetch throws network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(indicator.isHealthy('payment-provider')).rejects.toThrow();
    });
  });

  describe('isHealthy with Paystack provider', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PaymentProviderHealthIndicator,
          {
            provide: paymentConfig.KEY,
            useValue: createMockConfig('paystack'),
          },
        ],
      }).compile();

      indicator = module.get<PaymentProviderHealthIndicator>(PaymentProviderHealthIndicator);
    });

    it('should return healthy when Paystack API returns 200', async () => {
      mockFetch.mockResolvedValue({ status: 200 });

      const result = await indicator.isHealthy('payment-provider');

      expect(result).toEqual({
        'payment-provider': {
          status: 'up',
          provider: 'paystack',
          message: 'Paystack API is reachable',
        },
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.paystack.co/bank',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer sk_test_paystack',
          }),
        }),
      );
    });

    it('should return healthy when Paystack API returns 401', async () => {
      mockFetch.mockResolvedValue({ status: 401 });

      const result = await indicator.isHealthy('payment-provider');

      expect(result['payment-provider'].status).toBe('up');
    });

    it('should throw HealthCheckError when Paystack API is unreachable', async () => {
      mockFetch.mockResolvedValue({ status: 503 });

      await expect(indicator.isHealthy('payment-provider')).rejects.toThrow(
        'Payment provider check failed',
      );
    });
  });
});
