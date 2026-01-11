import { DomainEvent } from '../../../common/domain';

export class PaymentProcessedEvent extends DomainEvent {
  constructor(
    public readonly paymentId: string,
    public readonly orderId: string,
    public readonly externalId: string,
    public readonly checkoutUrl: string | null,
  ) {
    super();
  }

  getAggregateId(): string {
    return this.paymentId;
  }
}
