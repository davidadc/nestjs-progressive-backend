import { DomainEvent } from '../../../common/domain';

export class PaymentFailedEvent extends DomainEvent {
  constructor(
    public readonly paymentId: string,
    public readonly orderId: string,
    public readonly reason: string,
  ) {
    super();
  }

  getAggregateId(): string {
    return this.paymentId;
  }
}
