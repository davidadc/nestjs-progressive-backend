import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import Stripe from 'stripe';
import { StripePaymentStrategy } from '../../src/payments/application/strategies/stripe.strategy';
import paymentConfig from '../../src/config/payment.config';
import { PaymentProviderException } from '../../src/payments/domain/exceptions';
import { Money } from '../../src/payments/domain/value-objects';

// Mock Stripe
jest.mock('stripe');

describe('StripePaymentStrategy (Integration)', () => {
  let stripeStrategy: StripePaymentStrategy;
  let mockStripe: jest.Mocked<Stripe>;

  const mockConfig = {
    stripe: {
      secretKey: 'sk_test_123456789',
      webhookSecret: 'whsec_test_123456789',
    },
  };

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock Stripe instance
    mockStripe = {
      checkout: {
        sessions: {
          create: jest.fn(),
          retrieve: jest.fn(),
        },
      },
      refunds: {
        create: jest.fn(),
      },
      webhooks: {
        constructEvent: jest.fn(),
      },
    } as unknown as jest.Mocked<Stripe>;

    // Mock Stripe constructor
    (Stripe as unknown as jest.Mock).mockImplementation(() => mockStripe);

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [() => ({ payment: mockConfig })],
        }),
      ],
      providers: [
        StripePaymentStrategy,
        {
          provide: paymentConfig.KEY,
          useValue: mockConfig,
        },
      ],
    }).compile();

    stripeStrategy = module.get<StripePaymentStrategy>(StripePaymentStrategy);
  });

  describe('createPaymentIntent', () => {
    it('should create a checkout session successfully', async () => {
      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      };

      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession as any);

      const result = await stripeStrategy.createPaymentIntent({
        amount: Money.create(99.99, 'USD'),
        orderId: 'order-123',
        returnUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(result.externalId).toBe('cs_test_123');
      expect(result.checkoutUrl).toBe(
        'https://checkout.stripe.com/pay/cs_test_123',
      );
      expect(result.status).toBe('processing');
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'payment',
          payment_method_types: ['card'],
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price_data: expect.objectContaining({
                currency: 'usd',
                unit_amount: 9999, // cents
              }),
            }),
          ]),
          metadata: expect.objectContaining({
            orderId: 'order-123',
          }),
        }),
      );
    });

    it('should throw PaymentProviderException on Stripe error', async () => {
      const stripeError = new Stripe.errors.StripeError({
        type: 'card_error',
        message: 'Card declined',
      } as any);

      mockStripe.checkout.sessions.create.mockRejectedValue(stripeError);

      await expect(
        stripeStrategy.createPaymentIntent({
          amount: Money.create(99.99, 'USD'),
          orderId: 'order-123',
        }),
      ).rejects.toThrow(PaymentProviderException);
    });

    it('should include custom metadata', async () => {
      const mockSession = { id: 'cs_test_123', url: null };
      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession as any);

      await stripeStrategy.createPaymentIntent({
        amount: Money.create(50, 'EUR'),
        orderId: 'order-456',
        metadata: { customField: 'customValue' },
      });

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            orderId: 'order-456',
            customField: 'customValue',
          }),
        }),
      );
    });
  });

  describe('confirmPayment', () => {
    it('should return succeeded for paid session', async () => {
      const mockSession = {
        id: 'cs_test_123',
        payment_status: 'paid',
      };

      mockStripe.checkout.sessions.retrieve.mockResolvedValue(
        mockSession as any,
      );

      const result = await stripeStrategy.confirmPayment('cs_test_123');

      expect(result.status).toBe('succeeded');
      expect(mockStripe.checkout.sessions.retrieve).toHaveBeenCalledWith(
        'cs_test_123',
      );
    });

    it('should return failed for unpaid session', async () => {
      const mockSession = {
        id: 'cs_test_123',
        payment_status: 'unpaid',
      };

      mockStripe.checkout.sessions.retrieve.mockResolvedValue(
        mockSession as any,
      );

      const result = await stripeStrategy.confirmPayment('cs_test_123');

      expect(result.status).toBe('failed');
      expect(result.failureReason).toBe('Payment status: unpaid');
    });

    it('should throw PaymentProviderException on Stripe error', async () => {
      const stripeError = new Stripe.errors.StripeError({
        type: 'invalid_request_error',
        message: 'Session not found',
      } as any);

      mockStripe.checkout.sessions.retrieve.mockRejectedValue(stripeError);

      await expect(
        stripeStrategy.confirmPayment('invalid_session'),
      ).rejects.toThrow(PaymentProviderException);
    });
  });

  describe('refund', () => {
    it('should create refund successfully', async () => {
      const mockSession = {
        id: 'cs_test_123',
        payment_intent: 'pi_test_123',
      };

      const mockRefund = {
        id: 're_test_123',
        status: 'succeeded',
        failure_reason: null,
      };

      mockStripe.checkout.sessions.retrieve.mockResolvedValue(
        mockSession as any,
      );
      mockStripe.refunds.create.mockResolvedValue(mockRefund as any);

      const result = await stripeStrategy.refund('cs_test_123');

      expect(result.refundId).toBe('re_test_123');
      expect(result.status).toBe('succeeded');
      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test_123',
      });
    });

    it('should create partial refund with amount', async () => {
      const mockSession = {
        id: 'cs_test_123',
        payment_intent: 'pi_test_123',
      };

      const mockRefund = {
        id: 're_test_123',
        status: 'succeeded',
      };

      mockStripe.checkout.sessions.retrieve.mockResolvedValue(
        mockSession as any,
      );
      mockStripe.refunds.create.mockResolvedValue(mockRefund as any);

      await stripeStrategy.refund('cs_test_123', Money.create(25, 'USD'));

      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test_123',
        amount: 2500, // cents
      });
    });

    it('should throw when no payment intent found', async () => {
      const mockSession = {
        id: 'cs_test_123',
        payment_intent: null,
      };

      mockStripe.checkout.sessions.retrieve.mockResolvedValue(
        mockSession as any,
      );

      await expect(stripeStrategy.refund('cs_test_123')).rejects.toThrow(
        PaymentProviderException,
      );
    });

    it('should return pending status for pending refund', async () => {
      const mockSession = {
        id: 'cs_test_123',
        payment_intent: 'pi_test_123',
      };

      const mockRefund = {
        id: 're_test_123',
        status: 'pending',
      };

      mockStripe.checkout.sessions.retrieve.mockResolvedValue(
        mockSession as any,
      );
      mockStripe.refunds.create.mockResolvedValue(mockRefund as any);

      const result = await stripeStrategy.refund('cs_test_123');

      expect(result.status).toBe('pending');
    });
  });

  describe('validateWebhookSignature', () => {
    it('should return true for valid signature', () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({} as any);

      const result = stripeStrategy.validateWebhookSignature(
        'payload',
        'valid_signature',
      );

      expect(result).toBe(true);
    });

    it('should return false for invalid signature', () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const result = stripeStrategy.validateWebhookSignature(
        'payload',
        'invalid_signature',
      );

      expect(result).toBe(false);
    });
  });

  describe('parseWebhookEvent', () => {
    it('should parse valid webhook event', () => {
      const mockEvent = {
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        data: { object: {} },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent as any);

      const result = stripeStrategy.parseWebhookEvent('payload', 'signature');

      expect(result).toEqual(mockEvent);
      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        'payload',
        'signature',
        'whsec_test_123456789',
      );
    });

    it('should throw on invalid webhook payload', () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Stripe.errors.StripeSignatureVerificationError(
          'Invalid signature',
          {} as any,
        );
      });

      expect(() =>
        stripeStrategy.parseWebhookEvent('invalid_payload', 'invalid_sig'),
      ).toThrow();
    });
  });
});
