import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { PaymentRefundedEvent } from '../../domain';

@EventsHandler(PaymentRefundedEvent)
export class PaymentRefundedHandler implements IEventHandler<PaymentRefundedEvent> {
  private readonly logger = new Logger(PaymentRefundedHandler.name);

  async handle(event: PaymentRefundedEvent): Promise<void> {
    this.logger.log(
      `Payment refunded: ${event.paymentId} for order ${event.orderId}. Amount: ${event.currency} ${event.refundAmount}`,
    );

    // TODO: Update order status to 'refunded'
    // TODO: Send refund confirmation email
    // TODO: Update inventory (if applicable)
    // TODO: Update analytics

    // These would typically be done via:
    // - OrderService.markAsRefunded(event.orderId)
    // - NotificationService.sendRefundConfirmation(event)
  }
}
