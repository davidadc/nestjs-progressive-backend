import { ICommand, CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { IPaymentRepository } from '../../domain';
import {
  Payment,
  OrderId,
  Money,
  PAYMENT_REPOSITORY,
  PaymentAlreadyProcessedException,
  OrderNotFoundException,
} from '../../domain';
import { PaymentMapper } from '../mappers';
import { PaymentResponseDto } from '../dto';
import type { IPaymentStrategy } from '../strategies/payment.strategy.interface';
import { PAYMENT_STRATEGY } from '../strategies/payment.strategy.interface';

export class InitiatePaymentCommand implements ICommand {
  constructor(
    public readonly orderId: string,
    public readonly amount: number,
    public readonly currency: string = 'USD',
    public readonly returnUrl?: string,
    public readonly cancelUrl?: string,
  ) {}
}

@CommandHandler(InitiatePaymentCommand)
export class InitiatePaymentHandler implements ICommandHandler<InitiatePaymentCommand> {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
    @Inject(PAYMENT_STRATEGY)
    private readonly paymentStrategy: IPaymentStrategy,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: InitiatePaymentCommand): Promise<PaymentResponseDto> {
    // Check if payment already exists for this order
    const existingPayment = await this.paymentRepository.findByOrderId(command.orderId);
    if (existingPayment && !existingPayment.isFailed()) {
      throw new PaymentAlreadyProcessedException(existingPayment.id.value);
    }

    // Create payment aggregate
    const payment = Payment.create({
      orderId: OrderId.create(command.orderId),
      amount: Money.create(command.amount, command.currency),
    });

    // Create payment intent with provider
    const paymentResult = await this.paymentStrategy.createPaymentIntent({
      amount: payment.amount,
      orderId: command.orderId,
      returnUrl: command.returnUrl,
      cancelUrl: command.cancelUrl,
    });

    // Update payment with external details
    payment.process(paymentResult.externalId, paymentResult.checkoutUrl ?? null);

    // Persist payment
    await this.paymentRepository.save(payment);

    // Publish domain events
    const events = payment.getUncommittedEvents();
    for (const event of events) {
      this.eventBus.publish(event);
    }
    payment.clearEvents();

    return PaymentMapper.toDto(payment);
  }
}
