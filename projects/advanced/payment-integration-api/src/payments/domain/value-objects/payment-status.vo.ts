import { ValueObject } from '../../../common/domain';
import { InvalidPaymentStateException } from '../exceptions/payment.exceptions';

export type PaymentStatusValue = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

interface PaymentStatusProps {
  value: PaymentStatusValue;
}

// Define valid state transitions
const VALID_TRANSITIONS: Record<PaymentStatusValue, PaymentStatusValue[]> = {
  pending: ['processing', 'failed'],
  processing: ['completed', 'failed'],
  completed: ['refunded'],
  failed: ['pending'], // Allow retry
  refunded: [], // Terminal state
};

export class PaymentStatus extends ValueObject<PaymentStatusProps> {
  public static readonly Pending = new PaymentStatus({ value: 'pending' });
  public static readonly Processing = new PaymentStatus({ value: 'processing' });
  public static readonly Completed = new PaymentStatus({ value: 'completed' });
  public static readonly Failed = new PaymentStatus({ value: 'failed' });
  public static readonly Refunded = new PaymentStatus({ value: 'refunded' });

  private constructor(props: PaymentStatusProps) {
    super(props);
  }

  public static fromString(status: string): PaymentStatus {
    const validStatuses: PaymentStatusValue[] = [
      'pending',
      'processing',
      'completed',
      'failed',
      'refunded',
    ];

    if (!validStatuses.includes(status as PaymentStatusValue)) {
      throw new InvalidPaymentStateException(`Invalid payment status: ${status}`);
    }

    return new PaymentStatus({ value: status as PaymentStatusValue });
  }

  get value(): PaymentStatusValue {
    return this.props.value;
  }

  public canTransitionTo(targetStatus: PaymentStatus): boolean {
    const allowedTransitions = VALID_TRANSITIONS[this.value];
    return allowedTransitions.includes(targetStatus.value);
  }

  public transitionTo(targetStatus: PaymentStatus): PaymentStatus {
    if (!this.canTransitionTo(targetStatus)) {
      throw new InvalidPaymentStateException(
        `Cannot transition from '${this.value}' to '${targetStatus.value}'`,
      );
    }
    return targetStatus;
  }

  public isPending(): boolean {
    return this.value === 'pending';
  }

  public isProcessing(): boolean {
    return this.value === 'processing';
  }

  public isCompleted(): boolean {
    return this.value === 'completed';
  }

  public isFailed(): boolean {
    return this.value === 'failed';
  }

  public isRefunded(): boolean {
    return this.value === 'refunded';
  }

  public isTerminal(): boolean {
    return this.isRefunded();
  }

  public isSuccessful(): boolean {
    return this.isCompleted() || this.isRefunded();
  }

  public toString(): string {
    return this.value;
  }
}
