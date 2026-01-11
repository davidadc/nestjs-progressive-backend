import { PaymentStatus } from '../payment-status.vo';
import { InvalidPaymentStateException } from '../../exceptions/payment.exceptions';

describe('PaymentStatus Value Object', () => {
  describe('static instances', () => {
    it('should have Pending status', () => {
      expect(PaymentStatus.Pending.value).toBe('pending');
    });

    it('should have Processing status', () => {
      expect(PaymentStatus.Processing.value).toBe('processing');
    });

    it('should have Completed status', () => {
      expect(PaymentStatus.Completed.value).toBe('completed');
    });

    it('should have Failed status', () => {
      expect(PaymentStatus.Failed.value).toBe('failed');
    });

    it('should have Refunded status', () => {
      expect(PaymentStatus.Refunded.value).toBe('refunded');
    });
  });

  describe('fromString', () => {
    it('should create status from valid string', () => {
      const statuses = ['pending', 'processing', 'completed', 'failed', 'refunded'];

      statuses.forEach((status) => {
        const paymentStatus = PaymentStatus.fromString(status);
        expect(paymentStatus.value).toBe(status);
      });
    });

    it('should throw InvalidPaymentStateException for invalid string', () => {
      expect(() => PaymentStatus.fromString('invalid')).toThrow(
        InvalidPaymentStateException,
      );
      expect(() => PaymentStatus.fromString('invalid')).toThrow(
        'Invalid payment status: invalid',
      );
    });
  });

  describe('state checks', () => {
    it('should correctly identify pending state', () => {
      expect(PaymentStatus.Pending.isPending()).toBe(true);
      expect(PaymentStatus.Processing.isPending()).toBe(false);
    });

    it('should correctly identify processing state', () => {
      expect(PaymentStatus.Processing.isProcessing()).toBe(true);
      expect(PaymentStatus.Pending.isProcessing()).toBe(false);
    });

    it('should correctly identify completed state', () => {
      expect(PaymentStatus.Completed.isCompleted()).toBe(true);
      expect(PaymentStatus.Processing.isCompleted()).toBe(false);
    });

    it('should correctly identify failed state', () => {
      expect(PaymentStatus.Failed.isFailed()).toBe(true);
      expect(PaymentStatus.Completed.isFailed()).toBe(false);
    });

    it('should correctly identify refunded state', () => {
      expect(PaymentStatus.Refunded.isRefunded()).toBe(true);
      expect(PaymentStatus.Completed.isRefunded()).toBe(false);
    });

    it('should correctly identify terminal state', () => {
      expect(PaymentStatus.Refunded.isTerminal()).toBe(true);
      expect(PaymentStatus.Completed.isTerminal()).toBe(false);
      expect(PaymentStatus.Failed.isTerminal()).toBe(false);
    });

    it('should correctly identify successful state', () => {
      expect(PaymentStatus.Completed.isSuccessful()).toBe(true);
      expect(PaymentStatus.Refunded.isSuccessful()).toBe(true);
      expect(PaymentStatus.Failed.isSuccessful()).toBe(false);
      expect(PaymentStatus.Processing.isSuccessful()).toBe(false);
    });
  });

  describe('state transitions', () => {
    describe('from Pending', () => {
      it('should allow transition to Processing', () => {
        expect(PaymentStatus.Pending.canTransitionTo(PaymentStatus.Processing)).toBe(
          true,
        );

        const result = PaymentStatus.Pending.transitionTo(PaymentStatus.Processing);
        expect(result.value).toBe('processing');
      });

      it('should allow transition to Failed', () => {
        expect(PaymentStatus.Pending.canTransitionTo(PaymentStatus.Failed)).toBe(true);

        const result = PaymentStatus.Pending.transitionTo(PaymentStatus.Failed);
        expect(result.value).toBe('failed');
      });

      it('should not allow transition to Completed', () => {
        expect(PaymentStatus.Pending.canTransitionTo(PaymentStatus.Completed)).toBe(
          false,
        );

        expect(() =>
          PaymentStatus.Pending.transitionTo(PaymentStatus.Completed),
        ).toThrow(InvalidPaymentStateException);
      });

      it('should not allow transition to Refunded', () => {
        expect(PaymentStatus.Pending.canTransitionTo(PaymentStatus.Refunded)).toBe(
          false,
        );
      });
    });

    describe('from Processing', () => {
      it('should allow transition to Completed', () => {
        expect(
          PaymentStatus.Processing.canTransitionTo(PaymentStatus.Completed),
        ).toBe(true);

        const result = PaymentStatus.Processing.transitionTo(PaymentStatus.Completed);
        expect(result.value).toBe('completed');
      });

      it('should allow transition to Failed', () => {
        expect(PaymentStatus.Processing.canTransitionTo(PaymentStatus.Failed)).toBe(
          true,
        );

        const result = PaymentStatus.Processing.transitionTo(PaymentStatus.Failed);
        expect(result.value).toBe('failed');
      });

      it('should not allow transition to Pending', () => {
        expect(PaymentStatus.Processing.canTransitionTo(PaymentStatus.Pending)).toBe(
          false,
        );
      });

      it('should not allow transition to Refunded', () => {
        expect(
          PaymentStatus.Processing.canTransitionTo(PaymentStatus.Refunded),
        ).toBe(false);
      });
    });

    describe('from Completed', () => {
      it('should allow transition to Refunded', () => {
        expect(PaymentStatus.Completed.canTransitionTo(PaymentStatus.Refunded)).toBe(
          true,
        );

        const result = PaymentStatus.Completed.transitionTo(PaymentStatus.Refunded);
        expect(result.value).toBe('refunded');
      });

      it('should not allow transition to any other state', () => {
        expect(PaymentStatus.Completed.canTransitionTo(PaymentStatus.Pending)).toBe(
          false,
        );
        expect(
          PaymentStatus.Completed.canTransitionTo(PaymentStatus.Processing),
        ).toBe(false);
        expect(PaymentStatus.Completed.canTransitionTo(PaymentStatus.Failed)).toBe(
          false,
        );
      });
    });

    describe('from Failed', () => {
      it('should allow transition to Pending (retry)', () => {
        expect(PaymentStatus.Failed.canTransitionTo(PaymentStatus.Pending)).toBe(
          true,
        );

        const result = PaymentStatus.Failed.transitionTo(PaymentStatus.Pending);
        expect(result.value).toBe('pending');
      });

      it('should not allow transition to other states', () => {
        expect(PaymentStatus.Failed.canTransitionTo(PaymentStatus.Processing)).toBe(
          false,
        );
        expect(PaymentStatus.Failed.canTransitionTo(PaymentStatus.Completed)).toBe(
          false,
        );
        expect(PaymentStatus.Failed.canTransitionTo(PaymentStatus.Refunded)).toBe(
          false,
        );
      });
    });

    describe('from Refunded (terminal)', () => {
      it('should not allow transition to any state', () => {
        expect(PaymentStatus.Refunded.canTransitionTo(PaymentStatus.Pending)).toBe(
          false,
        );
        expect(
          PaymentStatus.Refunded.canTransitionTo(PaymentStatus.Processing),
        ).toBe(false);
        expect(PaymentStatus.Refunded.canTransitionTo(PaymentStatus.Completed)).toBe(
          false,
        );
        expect(PaymentStatus.Refunded.canTransitionTo(PaymentStatus.Failed)).toBe(
          false,
        );
      });

      it('should throw when attempting transition', () => {
        expect(() =>
          PaymentStatus.Refunded.transitionTo(PaymentStatus.Pending),
        ).toThrow(InvalidPaymentStateException);
        expect(() =>
          PaymentStatus.Refunded.transitionTo(PaymentStatus.Pending),
        ).toThrow("Cannot transition from 'refunded' to 'pending'");
      });
    });
  });

  describe('toString', () => {
    it('should return the status value', () => {
      expect(PaymentStatus.Pending.toString()).toBe('pending');
      expect(PaymentStatus.Completed.toString()).toBe('completed');
    });
  });

  describe('equality', () => {
    it('should be equal for same status', () => {
      const status1 = PaymentStatus.fromString('pending');
      const status2 = PaymentStatus.Pending;

      expect(status1.equals(status2)).toBe(true);
    });

    it('should not be equal for different status', () => {
      expect(PaymentStatus.Pending.equals(PaymentStatus.Completed)).toBe(false);
    });
  });
});
