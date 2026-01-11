import { AggregateRoot } from '../../../common/domain';
import { PaymentId, OrderId, Money, PaymentStatus } from '../value-objects';
import {
  PaymentCreatedEvent,
  PaymentProcessedEvent,
  PaymentCompletedEvent,
  PaymentFailedEvent,
  PaymentRefundedEvent,
} from '../events';
import { InvalidPaymentStateException } from '../exceptions';

export type PaymentProvider = 'stripe' | 'paystack';

export interface CreatePaymentProps {
  orderId: OrderId;
  amount: Money;
  provider?: PaymentProvider;
}

export interface ReconstitutePaymentProps {
  id: PaymentId;
  orderId: OrderId;
  amount: Money;
  status: PaymentStatus;
  provider: PaymentProvider;
  externalId: string | null;
  checkoutUrl: string | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

export class Payment extends AggregateRoot {
  private _id: PaymentId;
  private _orderId: OrderId;
  private _amount: Money;
  private _status: PaymentStatus;
  private _provider: PaymentProvider;
  private _externalId: string | null;
  private _checkoutUrl: string | null;
  private _failureReason: string | null;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _completedAt: Date | null;

  private constructor() {
    super();
  }

  /**
   * Factory method to create a new payment
   */
  public static create(props: CreatePaymentProps): Payment {
    const payment = new Payment();
    payment._id = PaymentId.generate();
    payment._orderId = props.orderId;
    payment._amount = props.amount;
    payment._status = PaymentStatus.Pending;
    payment._provider = props.provider ?? 'stripe';
    payment._externalId = null;
    payment._checkoutUrl = null;
    payment._failureReason = null;
    payment._createdAt = new Date();
    payment._updatedAt = new Date();
    payment._completedAt = null;

    payment.addDomainEvent(
      new PaymentCreatedEvent(
        payment._id.value,
        payment._orderId.value,
        payment._amount.amount,
        payment._amount.currency,
        payment._provider,
      ),
    );

    return payment;
  }

  /**
   * Reconstitute a payment from persistence (no events emitted)
   */
  public static reconstitute(props: ReconstitutePaymentProps): Payment {
    const payment = new Payment();
    payment._id = props.id;
    payment._orderId = props.orderId;
    payment._amount = props.amount;
    payment._status = props.status;
    payment._provider = props.provider;
    payment._externalId = props.externalId;
    payment._checkoutUrl = props.checkoutUrl;
    payment._failureReason = props.failureReason;
    payment._createdAt = props.createdAt;
    payment._updatedAt = props.updatedAt;
    payment._completedAt = props.completedAt;

    return payment;
  }

  /**
   * Process payment with external provider
   */
  public process(externalId: string, checkoutUrl: string | null = null): void {
    if (!this._status.canTransitionTo(PaymentStatus.Processing)) {
      throw new InvalidPaymentStateException(
        `Cannot process payment in '${this._status.value}' state`,
      );
    }

    this._status = PaymentStatus.Processing;
    this._externalId = externalId;
    this._checkoutUrl = checkoutUrl;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new PaymentProcessedEvent(
        this._id.value,
        this._orderId.value,
        externalId,
        checkoutUrl,
      ),
    );
  }

  /**
   * Complete payment (called after webhook confirmation)
   */
  public complete(): void {
    if (!this._status.canTransitionTo(PaymentStatus.Completed)) {
      throw new InvalidPaymentStateException(
        `Cannot complete payment in '${this._status.value}' state`,
      );
    }

    this._status = PaymentStatus.Completed;
    this._completedAt = new Date();
    this._updatedAt = new Date();

    this.addDomainEvent(
      new PaymentCompletedEvent(
        this._id.value,
        this._orderId.value,
        this._amount.amount,
        this._amount.currency,
      ),
    );
  }

  /**
   * Fail payment
   */
  public fail(reason: string): void {
    if (this._status.isCompleted() || this._status.isRefunded()) {
      throw new InvalidPaymentStateException(
        `Cannot fail payment in '${this._status.value}' state`,
      );
    }

    this._status = PaymentStatus.Failed;
    this._failureReason = reason;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new PaymentFailedEvent(this._id.value, this._orderId.value, reason),
    );
  }

  /**
   * Refund payment
   */
  public refund(): void {
    if (!this._status.canTransitionTo(PaymentStatus.Refunded)) {
      throw new InvalidPaymentStateException(
        `Cannot refund payment in '${this._status.value}' state`,
      );
    }

    this._status = PaymentStatus.Refunded;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new PaymentRefundedEvent(
        this._id.value,
        this._orderId.value,
        this._amount.amount,
        this._amount.currency,
      ),
    );
  }

  // Getters
  get id(): PaymentId {
    return this._id;
  }

  get orderId(): OrderId {
    return this._orderId;
  }

  get amount(): Money {
    return this._amount;
  }

  get status(): PaymentStatus {
    return this._status;
  }

  get provider(): PaymentProvider {
    return this._provider;
  }

  get externalId(): string | null {
    return this._externalId;
  }

  get checkoutUrl(): string | null {
    return this._checkoutUrl;
  }

  get failureReason(): string | null {
    return this._failureReason;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get completedAt(): Date | null {
    return this._completedAt;
  }

  // Status checks
  public isPending(): boolean {
    return this._status.isPending();
  }

  public isProcessing(): boolean {
    return this._status.isProcessing();
  }

  public isCompleted(): boolean {
    return this._status.isCompleted();
  }

  public isFailed(): boolean {
    return this._status.isFailed();
  }

  public isRefunded(): boolean {
    return this._status.isRefunded();
  }
}
