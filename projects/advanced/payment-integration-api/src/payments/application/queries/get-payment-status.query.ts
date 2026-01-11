import { IQuery, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { IPaymentRepository } from '../../domain';
import { PAYMENT_REPOSITORY, PaymentNotFoundException } from '../../domain';
import { PaymentMapper } from '../mappers';
import { PaymentResponseDto } from '../dto';

export class GetPaymentStatusQuery implements IQuery {
  constructor(public readonly orderId: string) {}
}

@QueryHandler(GetPaymentStatusQuery)
export class GetPaymentStatusHandler implements IQueryHandler<GetPaymentStatusQuery> {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
  ) {}

  async execute(query: GetPaymentStatusQuery): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findByOrderId(query.orderId);

    if (!payment) {
      throw new PaymentNotFoundException(`No payment found for order: ${query.orderId}`);
    }

    return PaymentMapper.toDto(payment);
  }
}
