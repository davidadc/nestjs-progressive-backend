import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import * as crypto from 'crypto';
import { PaystackPaymentStrategy } from '../../src/payments/application/strategies/paystack.strategy';
import paymentConfig from '../../src/config/payment.config';
import { PaymentProviderException } from '../../src/payments/domain/exceptions';
import { Money } from '../../src/payments/domain/value-objects';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('PaystackPaymentStrategy (Integration)', () => {
  let paystackStrategy: PaystackPaymentStrategy;

  const mockConfig = {
    provider: 'paystack',
    paystack: {
      secretKey: 'sk_test_123456789',
      publicKey: 'pk_test_123456789',
      webhookSecret: 'whsec_test_123456789',
      baseUrl: 'https://api.paystack.co',
    },
    stripe: {
      secretKey: null,
      webhookSecret: null,
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [() => ({ payment: mockConfig })],
        }),
      ],
      providers: [
        PaystackPaymentStrategy,
        {
          provide: paymentConfig.KEY,
          useValue: mockConfig,
        },
      ],
    }).compile();

    paystackStrategy = module.get<PaystackPaymentStrategy>(
      PaystackPaymentStrategy,
    );
  });

  describe('createPaymentIntent', () => {
    it('should initialize a transaction successfully', async () => {
      const mockResponse = {
        status: true,
        message: 'Authorization URL created',
        data: {
          authorization_url: 'https://checkout.paystack.com/abc123',
          access_code: 'abc123',
          reference: 'PAY_order-123_1234567890_xyz',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await paystackStrategy.createPaymentIntent({
        amount: Money.create(99.99, 'NGN'),
        orderId: 'order-123',
        returnUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        metadata: { email: 'customer@example.com' },
      });

      expect(result.externalId).toBe('PAY_order-123_1234567890_xyz');
      expect(result.checkoutUrl).toBe('https://checkout.paystack.com/abc123');
      expect(result.status).toBe('processing');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.paystack.co/transaction/initialize',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer sk_test_123456789',
          }),
        }),
      );
    });

    it('should throw PaymentProviderException on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid API key' }),
      });

      await expect(
        paystackStrategy.createPaymentIntent({
          amount: Money.create(99.99, 'NGN'),
          orderId: 'order-123',
        }),
      ).rejects.toThrow(PaymentProviderException);
    });

    it('should throw PaymentProviderException on unsuccessful response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: false,
          message: 'Transaction initialization failed',
        }),
      });

      await expect(
        paystackStrategy.createPaymentIntent({
          amount: Money.create(99.99, 'NGN'),
          orderId: 'order-123',
        }),
      ).rejects.toThrow(PaymentProviderException);
    });
  });

  describe('confirmPayment', () => {
    it('should return succeeded for successful transaction', async () => {
      const mockResponse = {
        status: true,
        message: 'Verification successful',
        data: {
          id: 123456,
          status: 'success',
          reference: 'PAY_order-123_ref',
          amount: 9999,
          currency: 'NGN',
          gateway_response: 'Successful',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await paystackStrategy.confirmPayment('PAY_order-123_ref');

      expect(result.status).toBe('succeeded');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.paystack.co/transaction/verify/PAY_order-123_ref',
        expect.objectContaining({
          method: 'GET',
        }),
      );
    });

    it('should return failed for failed transaction', async () => {
      const mockResponse = {
        status: true,
        message: 'Verification successful',
        data: {
          id: 123456,
          status: 'failed',
          reference: 'PAY_order-123_ref',
          amount: 9999,
          currency: 'NGN',
          gateway_response: 'Declined',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await paystackStrategy.confirmPayment('PAY_order-123_ref');

      expect(result.status).toBe('failed');
      expect(result.failureReason).toBe('Declined');
    });

    it('should throw PaymentProviderException on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Transaction not found' }),
      });

      await expect(
        paystackStrategy.confirmPayment('invalid_ref'),
      ).rejects.toThrow(PaymentProviderException);
    });
  });

  describe('refund', () => {
    it('should create full refund successfully', async () => {
      const mockResponse = {
        status: true,
        message: 'Refund initiated',
        data: {
          id: 789,
          transaction: { id: 123, reference: 'PAY_order-123_ref' },
          amount: 9999,
          currency: 'NGN',
          status: 'processed',
          refunded_at: '2026-01-11T00:00:00.000Z',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await paystackStrategy.refund('PAY_order-123_ref');

      expect(result.refundId).toBe('789');
      expect(result.status).toBe('succeeded');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.paystack.co/refund',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ transaction: 'PAY_order-123_ref' }),
        }),
      );
    });

    it('should create partial refund with amount', async () => {
      const mockResponse = {
        status: true,
        message: 'Refund initiated',
        data: {
          id: 789,
          transaction: { id: 123, reference: 'PAY_order-123_ref' },
          amount: 5000,
          currency: 'NGN',
          status: 'pending',
          refunded_at: null,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await paystackStrategy.refund(
        'PAY_order-123_ref',
        Money.create(50, 'NGN'),
      );

      expect(result.refundId).toBe('789');
      expect(result.status).toBe('pending');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.paystack.co/refund',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            transaction: 'PAY_order-123_ref',
            amount: 5000,
          }),
        }),
      );
    });

    it('should return failed status for failed refund', async () => {
      const mockResponse = {
        status: true,
        message: 'Refund failed',
        data: {
          id: 789,
          transaction: { id: 123, reference: 'PAY_order-123_ref' },
          amount: 9999,
          currency: 'NGN',
          status: 'failed',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await paystackStrategy.refund('PAY_order-123_ref');

      expect(result.status).toBe('failed');
    });

    it('should throw PaymentProviderException on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Refund failed' }),
      });

      await expect(paystackStrategy.refund('invalid_ref')).rejects.toThrow(
        PaymentProviderException,
      );
    });
  });

  describe('validateWebhookSignature', () => {
    it('should return true for valid signature', () => {
      const payload = JSON.stringify({ event: 'charge.success', data: {} });
      const validSignature = crypto
        .createHmac('sha512', 'whsec_test_123456789')
        .update(payload)
        .digest('hex');

      const result = paystackStrategy.validateWebhookSignature(
        payload,
        validSignature,
      );

      expect(result).toBe(true);
    });

    it('should return false for invalid signature', () => {
      const payload = JSON.stringify({ event: 'charge.success', data: {} });
      const invalidSignature = 'invalid_signature_here';

      const result = paystackStrategy.validateWebhookSignature(
        payload,
        invalidSignature,
      );

      expect(result).toBe(false);
    });

    it('should handle Buffer payload', () => {
      const payloadString = JSON.stringify({
        event: 'charge.success',
        data: {},
      });
      const payload = Buffer.from(payloadString);
      const validSignature = crypto
        .createHmac('sha512', 'whsec_test_123456789')
        .update(payloadString)
        .digest('hex');

      const result = paystackStrategy.validateWebhookSignature(
        payload,
        validSignature,
      );

      expect(result).toBe(true);
    });
  });

  describe('parseWebhookEvent', () => {
    it('should parse valid webhook event', () => {
      const mockEvent = {
        event: 'charge.success',
        data: {
          id: 123,
          reference: 'PAY_order-123_ref',
          status: 'success',
          amount: 9999,
          currency: 'NGN',
          metadata: { orderId: 'order-123' },
        },
      };

      const payload = JSON.stringify(mockEvent);
      const validSignature = crypto
        .createHmac('sha512', 'whsec_test_123456789')
        .update(payload)
        .digest('hex');

      const result = paystackStrategy.parseWebhookEvent(
        payload,
        validSignature,
      );

      expect(result).toEqual(mockEvent);
    });

    it('should throw on invalid webhook signature', () => {
      const payload = JSON.stringify({ event: 'charge.success', data: {} });

      expect(() =>
        paystackStrategy.parseWebhookEvent(payload, 'invalid_sig'),
      ).toThrow(PaymentProviderException);
    });
  });
});
