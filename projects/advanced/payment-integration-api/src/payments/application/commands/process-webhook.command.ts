import { ICommand, CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import type { IPaymentRepository, ITransactionRepository } from '../../domain';
import {
  PAYMENT_REPOSITORY,
  TRANSACTION_REPOSITORY,
  PaymentNotFoundException,
} from '../../domain';
import type { IPaymentStrategy } from '../strategies/payment.strategy.interface';
import { PAYMENT_STRATEGY } from '../strategies/payment.strategy.interface';

export class ProcessWebhookCommand implements ICommand {
  constructor(
    public readonly payload: string | Buffer,
    public readonly signature: string,
  ) {}
}

@CommandHandler(ProcessWebhookCommand)
export class ProcessWebhookHandler implements ICommandHandler<ProcessWebhookCommand> {
  private readonly logger = new Logger(ProcessWebhookHandler.name);

  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    @Inject(PAYMENT_STRATEGY)
    private readonly paymentStrategy: IPaymentStrategy,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ProcessWebhookCommand): Promise<{ received: boolean }> {
    // Parse and validate webhook
    const event = this.paymentStrategy.parseWebhookEvent(
      command.payload,
      command.signature,
    ) as Stripe.Event;

    this.logger.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'checkout.session.expired':
        await this.handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const payment = await this.paymentRepository.findByExternalId(session.id);

    if (!payment) {
      this.logger.warn(`Payment not found for session: ${session.id}`);
      return;
    }

    if (payment.isCompleted()) {
      this.logger.log(`Payment ${payment.id.value} already completed`);
      return;
    }

    // Complete the payment
    payment.complete();
    await this.paymentRepository.save(payment);

    // Record transaction
    await this.transactionRepository.create({
      paymentId: payment.id.value,
      type: 'charge',
      amount: payment.amount.amount,
      currency: payment.amount.currency,
      status: 'succeeded',
      externalId: session.payment_intent as string,
    });

    // Publish domain events
    const events = payment.getUncommittedEvents();
    for (const event of events) {
      this.eventBus.publish(event);
    }
    payment.clearEvents();

    this.logger.log(`Payment ${payment.id.value} completed successfully`);
  }

  private async handleCheckoutExpired(session: Stripe.Checkout.Session): Promise<void> {
    const payment = await this.paymentRepository.findByExternalId(session.id);

    if (!payment) {
      this.logger.warn(`Payment not found for session: ${session.id}`);
      return;
    }

    if (payment.isFailed() || payment.isCompleted()) {
      return;
    }

    // Fail the payment
    payment.fail('Checkout session expired');
    await this.paymentRepository.save(payment);

    // Record transaction
    await this.transactionRepository.create({
      paymentId: payment.id.value,
      type: 'charge',
      amount: payment.amount.amount,
      currency: payment.amount.currency,
      status: 'failed',
      failureReason: 'Checkout session expired',
    });

    // Publish domain events
    const events = payment.getUncommittedEvents();
    for (const event of events) {
      this.eventBus.publish(event);
    }
    payment.clearEvents();

    this.logger.log(`Payment ${payment.id.value} failed: session expired`);
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    // Find payment by payment intent metadata or other means
    const orderId = paymentIntent.metadata?.orderId;
    if (!orderId) {
      this.logger.warn(`No orderId in payment intent metadata: ${paymentIntent.id}`);
      return;
    }

    const payment = await this.paymentRepository.findByOrderId(orderId);
    if (!payment) {
      this.logger.warn(`Payment not found for order: ${orderId}`);
      return;
    }

    if (payment.isFailed() || payment.isCompleted()) {
      return;
    }

    const failureReason =
      paymentIntent.last_payment_error?.message || 'Payment failed';

    payment.fail(failureReason);
    await this.paymentRepository.save(payment);

    // Record transaction
    await this.transactionRepository.create({
      paymentId: payment.id.value,
      type: 'charge',
      amount: payment.amount.amount,
      currency: payment.amount.currency,
      status: 'failed',
      externalId: paymentIntent.id,
      failureReason,
    });

    // Publish domain events
    const events = payment.getUncommittedEvents();
    for (const event of events) {
      this.eventBus.publish(event);
    }
    payment.clearEvents();

    this.logger.log(`Payment ${payment.id.value} failed: ${failureReason}`);
  }
}
