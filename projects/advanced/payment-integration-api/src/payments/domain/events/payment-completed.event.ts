import { DomainEvent } from '../../../common/domain';

export class PaymentCompletedEvent extends DomainEvent {
  constructor(
    public readonly paymentId: string,
    public readonly orderId: string,
    public readonly amount: number,
    public readonly currency: string,
  ) {
    super();
  }

  getAggregateId(): string {
    return this.paymentId;
  }
}
