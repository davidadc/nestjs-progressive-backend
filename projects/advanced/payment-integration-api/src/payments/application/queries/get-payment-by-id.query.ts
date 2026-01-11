import { IQuery, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { IPaymentRepository } from '../../domain';
import { PAYMENT_REPOSITORY, PaymentNotFoundException } from '../../domain';
import { PaymentMapper } from '../mappers';
import { PaymentResponseDto } from '../dto';

export class GetPaymentByIdQuery implements IQuery {
  constructor(public readonly paymentId: string) {}
}

@QueryHandler(GetPaymentByIdQuery)
export class GetPaymentByIdHandler implements IQueryHandler<GetPaymentByIdQuery> {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
  ) {}

  async execute(query: GetPaymentByIdQuery): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findById(query.paymentId);

    if (!payment) {
      throw new PaymentNotFoundException(query.paymentId);
    }

    return PaymentMapper.toDto(payment);
  }
}
