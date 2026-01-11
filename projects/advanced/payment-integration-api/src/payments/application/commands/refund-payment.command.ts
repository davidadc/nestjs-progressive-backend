import {
  ICommand,
  CommandHandler,
  ICommandHandler,
  EventBus,
} from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { IPaymentRepository, ITransactionRepository } from '../../domain';
import {
  PAYMENT_REPOSITORY,
  TRANSACTION_REPOSITORY,
  PaymentNotFoundException,
  InvalidPaymentStateException,
} from '../../domain';
import { PaymentMapper } from '../mappers';
import { PaymentResponseDto } from '../dto';
import type { IPaymentStrategy } from '../strategies/payment.strategy.interface';
import { PAYMENT_STRATEGY } from '../strategies/payment.strategy.interface';

export class RefundPaymentCommand implements ICommand {
  constructor(public readonly paymentId: string) {}
}

@CommandHandler(RefundPaymentCommand)
export class RefundPaymentHandler implements ICommandHandler<RefundPaymentCommand> {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    @Inject(PAYMENT_STRATEGY)
    private readonly paymentStrategy: IPaymentStrategy,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RefundPaymentCommand): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepository.findById(command.paymentId);

    if (!payment) {
      throw new PaymentNotFoundException(command.paymentId);
    }

    if (!payment.isCompleted()) {
      throw new InvalidPaymentStateException(
        `Cannot refund payment in '${payment.status.value}' state`,
      );
    }

    if (!payment.externalId) {
      throw new InvalidPaymentStateException('Payment has no external ID');
    }

    // Initiate refund with provider
    const refundResult = await this.paymentStrategy.refund(payment.externalId);

    // Update payment status
    payment.refund();
    await this.paymentRepository.save(payment);

    // Record refund transaction
    await this.transactionRepository.create({
      paymentId: payment.id.value,
      type: 'refund',
      amount: payment.amount.amount,
      currency: payment.amount.currency,
      status: refundResult.status,
      externalId: refundResult.refundId,
      failureReason: refundResult.failureReason,
    });

    // Publish domain events
    const events = payment.getUncommittedEvents();
    for (const event of events) {
      this.eventBus.publish(event);
    }
    payment.clearEvents();

    return PaymentMapper.toDto(payment);
  }
}
