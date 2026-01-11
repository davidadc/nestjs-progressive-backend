import { DomainEvent } from '../../../common/domain';

export class PaymentCreatedEvent extends DomainEvent {
  constructor(
    public readonly paymentId: string,
    public readonly orderId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly provider: string,
  ) {
    super();
  }

  getAggregateId(): string {
    return this.paymentId;
  }
}
