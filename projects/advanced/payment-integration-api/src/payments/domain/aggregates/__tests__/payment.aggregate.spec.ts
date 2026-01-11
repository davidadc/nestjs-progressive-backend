import { Payment } from '../payment.aggregate';
import { PaymentId, OrderId, Money, PaymentStatus } from '../../value-objects';
import { InvalidPaymentStateException } from '../../exceptions';
import {
  PaymentCreatedEvent,
  PaymentProcessedEvent,
  PaymentCompletedEvent,
  PaymentFailedEvent,
  PaymentRefundedEvent,
} from '../../events';

describe('Payment Aggregate', () => {
  const createTestPayment = () => {
    return Payment.create({
      orderId: OrderId.create('order-123'),
      amount: Money.create(99.99, 'USD'),
    });
  };

  describe('create', () => {
    it('should create a new payment with pending status', () => {
      const payment = createTestPayment();

      expect(payment.id).toBeInstanceOf(PaymentId);
      expect(payment.orderId.value).toBe('order-123');
      expect(payment.amount.amount).toBe(99.99);
      expect(payment.amount.currency).toBe('USD');
      expect(payment.status.value).toBe('pending');
      expect(payment.provider).toBe('stripe');
      expect(payment.externalId).toBeNull();
      expect(payment.checkoutUrl).toBeNull();
      expect(payment.failureReason).toBeNull();
      expect(payment.completedAt).toBeNull();
    });

    it('should use specified provider', () => {
      const payment = Payment.create({
        orderId: OrderId.create('order-123'),
        amount: Money.create(50, 'USD'),
        provider: 'paystack',
      });

      expect(payment.provider).toBe('paystack');
    });

    it('should emit PaymentCreatedEvent', () => {
      const payment = createTestPayment();
      const events = payment.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PaymentCreatedEvent);

      const event = events[0] as PaymentCreatedEvent;
      expect(event.paymentId).toBe(payment.id.value);
      expect(event.orderId).toBe('order-123');
      expect(event.amount).toBe(99.99);
      expect(event.currency).toBe('USD');
      expect(event.provider).toBe('stripe');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute payment without emitting events', () => {
      const payment = Payment.reconstitute({
        id: PaymentId.create('550e8400-e29b-41d4-a716-446655440000'),
        orderId: OrderId.create('order-456'),
        amount: Money.create(50, 'EUR'),
        status: PaymentStatus.Completed,
        provider: 'stripe',
        externalId: 'cs_123',
        checkoutUrl: 'https://checkout.stripe.com/pay/cs_123',
        failureReason: null,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
        completedAt: new Date('2026-01-02'),
      });

      expect(payment.id.value).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(payment.orderId.value).toBe('order-456');
      expect(payment.amount.amount).toBe(50);
      expect(payment.status.value).toBe('completed');
      expect(payment.externalId).toBe('cs_123');
      expect(payment.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('process', () => {
    it('should transition from pending to processing', () => {
      const payment = createTestPayment();
      payment.clearEvents();

      payment.process('cs_123', 'https://checkout.stripe.com/pay/cs_123');

      expect(payment.status.value).toBe('processing');
      expect(payment.externalId).toBe('cs_123');
      expect(payment.checkoutUrl).toBe(
        'https://checkout.stripe.com/pay/cs_123',
      );
    });

    it('should emit PaymentProcessedEvent', () => {
      const payment = createTestPayment();
      payment.clearEvents();

      payment.process('cs_123', 'https://checkout.stripe.com/pay/cs_123');

      const events = payment.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PaymentProcessedEvent);

      const event = events[0] as PaymentProcessedEvent;
      expect(event.externalId).toBe('cs_123');
      expect(event.checkoutUrl).toBe('https://checkout.stripe.com/pay/cs_123');
    });

    it('should throw when not in pending state', () => {
      const payment = createTestPayment();
      payment.process('cs_123', null);
      payment.complete();

      expect(() => payment.process('cs_456', null)).toThrow(
        InvalidPaymentStateException,
      );
    });
  });

  describe('complete', () => {
    it('should transition from processing to completed', () => {
      const payment = createTestPayment();
      payment.process('cs_123', null);
      payment.clearEvents();

      payment.complete();

      expect(payment.status.value).toBe('completed');
      expect(payment.completedAt).toBeInstanceOf(Date);
    });

    it('should emit PaymentCompletedEvent', () => {
      const payment = createTestPayment();
      payment.process('cs_123', null);
      payment.clearEvents();

      payment.complete();

      const events = payment.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PaymentCompletedEvent);

      const event = events[0] as PaymentCompletedEvent;
      expect(event.amount).toBe(99.99);
      expect(event.currency).toBe('USD');
    });

    it('should throw when not in processing state', () => {
      const payment = createTestPayment();

      expect(() => payment.complete()).toThrow(InvalidPaymentStateException);
      expect(() => payment.complete()).toThrow(
        "Cannot complete payment in 'pending' state",
      );
    });
  });

  describe('fail', () => {
    it('should transition to failed from pending', () => {
      const payment = createTestPayment();
      payment.clearEvents();

      payment.fail('Card declined');

      expect(payment.status.value).toBe('failed');
      expect(payment.failureReason).toBe('Card declined');
    });

    it('should transition to failed from processing', () => {
      const payment = createTestPayment();
      payment.process('cs_123', null);
      payment.clearEvents();

      payment.fail('Payment timeout');

      expect(payment.status.value).toBe('failed');
      expect(payment.failureReason).toBe('Payment timeout');
    });

    it('should emit PaymentFailedEvent', () => {
      const payment = createTestPayment();
      payment.clearEvents();

      payment.fail('Insufficient funds');

      const events = payment.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PaymentFailedEvent);

      const event = events[0] as PaymentFailedEvent;
      expect(event.reason).toBe('Insufficient funds');
    });

    it('should throw when in completed state', () => {
      const payment = createTestPayment();
      payment.process('cs_123', null);
      payment.complete();

      expect(() => payment.fail('Some reason')).toThrow(
        InvalidPaymentStateException,
      );
      expect(() => payment.fail('Some reason')).toThrow(
        "Cannot fail payment in 'completed' state",
      );
    });

    it('should throw when in refunded state', () => {
      const payment = createTestPayment();
      payment.process('cs_123', null);
      payment.complete();
      payment.refund();

      expect(() => payment.fail('Some reason')).toThrow(
        InvalidPaymentStateException,
      );
    });
  });

  describe('refund', () => {
    it('should transition from completed to refunded', () => {
      const payment = createTestPayment();
      payment.process('cs_123', null);
      payment.complete();
      payment.clearEvents();

      payment.refund();

      expect(payment.status.value).toBe('refunded');
    });

    it('should emit PaymentRefundedEvent', () => {
      const payment = createTestPayment();
      payment.process('cs_123', null);
      payment.complete();
      payment.clearEvents();

      payment.refund();

      const events = payment.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PaymentRefundedEvent);

      const event = events[0] as PaymentRefundedEvent;
      expect(event.refundAmount).toBe(99.99);
      expect(event.currency).toBe('USD');
    });

    it('should throw when not in completed state', () => {
      const payment = createTestPayment();

      expect(() => payment.refund()).toThrow(InvalidPaymentStateException);
      expect(() => payment.refund()).toThrow(
        "Cannot refund payment in 'pending' state",
      );
    });

    it('should throw when already refunded', () => {
      const payment = createTestPayment();
      payment.process('cs_123', null);
      payment.complete();
      payment.refund();

      expect(() => payment.refund()).toThrow(InvalidPaymentStateException);
    });
  });

  describe('status checks', () => {
    it('should correctly identify pending state', () => {
      const payment = createTestPayment();

      expect(payment.isPending()).toBe(true);
      expect(payment.isProcessing()).toBe(false);
      expect(payment.isCompleted()).toBe(false);
      expect(payment.isFailed()).toBe(false);
      expect(payment.isRefunded()).toBe(false);
    });

    it('should correctly identify processing state', () => {
      const payment = createTestPayment();
      payment.process('cs_123', null);

      expect(payment.isPending()).toBe(false);
      expect(payment.isProcessing()).toBe(true);
      expect(payment.isCompleted()).toBe(false);
    });

    it('should correctly identify completed state', () => {
      const payment = createTestPayment();
      payment.process('cs_123', null);
      payment.complete();

      expect(payment.isProcessing()).toBe(false);
      expect(payment.isCompleted()).toBe(true);
      expect(payment.isRefunded()).toBe(false);
    });

    it('should correctly identify failed state', () => {
      const payment = createTestPayment();
      payment.fail('Error');

      expect(payment.isPending()).toBe(false);
      expect(payment.isFailed()).toBe(true);
    });

    it('should correctly identify refunded state', () => {
      const payment = createTestPayment();
      payment.process('cs_123', null);
      payment.complete();
      payment.refund();

      expect(payment.isCompleted()).toBe(false);
      expect(payment.isRefunded()).toBe(true);
    });
  });

  describe('complete payment flow', () => {
    it('should handle full successful payment lifecycle', () => {
      const payment = createTestPayment();

      // Initial state
      expect(payment.isPending()).toBe(true);

      // Process payment
      payment.process('cs_123', 'https://checkout.stripe.com/pay/cs_123');
      expect(payment.isProcessing()).toBe(true);
      expect(payment.externalId).toBe('cs_123');

      // Complete payment
      payment.complete();
      expect(payment.isCompleted()).toBe(true);
      expect(payment.completedAt).toBeDefined();

      // Refund payment
      payment.refund();
      expect(payment.isRefunded()).toBe(true);

      // Verify all events were emitted
      const events = payment.getUncommittedEvents();
      expect(events).toHaveLength(4);
      expect(events[0]).toBeInstanceOf(PaymentCreatedEvent);
      expect(events[1]).toBeInstanceOf(PaymentProcessedEvent);
      expect(events[2]).toBeInstanceOf(PaymentCompletedEvent);
      expect(events[3]).toBeInstanceOf(PaymentRefundedEvent);
    });

    it('should handle failed payment flow', () => {
      const payment = createTestPayment();

      // Initial state
      expect(payment.isPending()).toBe(true);

      // Process payment
      payment.process('cs_123', null);
      expect(payment.isProcessing()).toBe(true);

      // Fail payment
      payment.fail('Card declined');
      expect(payment.isFailed()).toBe(true);
      expect(payment.failureReason).toBe('Card declined');

      // Verify events
      const events = payment.getUncommittedEvents();
      expect(events).toHaveLength(3);
      expect(events[0]).toBeInstanceOf(PaymentCreatedEvent);
      expect(events[1]).toBeInstanceOf(PaymentProcessedEvent);
      expect(events[2]).toBeInstanceOf(PaymentFailedEvent);
    });
  });

  describe('event management', () => {
    it('should clear events', () => {
      const payment = createTestPayment();

      expect(payment.getUncommittedEvents()).toHaveLength(1);

      payment.clearEvents();

      expect(payment.getUncommittedEvents()).toHaveLength(0);
    });
  });
});
