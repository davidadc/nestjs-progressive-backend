import { DomainEvent } from '../../../common/domain';

export class PaymentRefundedEvent extends DomainEvent {
  constructor(
    public readonly paymentId: string,
    public readonly orderId: string,
    public readonly refundAmount: number,
    public readonly currency: string,
  ) {
    super();
  }

  getAggregateId(): string {
    return this.paymentId;
  }
}
