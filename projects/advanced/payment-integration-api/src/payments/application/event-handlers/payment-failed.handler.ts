import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { PaymentFailedEvent } from '../../domain';

@EventsHandler(PaymentFailedEvent)
export class PaymentFailedHandler implements IEventHandler<PaymentFailedEvent> {
  private readonly logger = new Logger(PaymentFailedHandler.name);

  async handle(event: PaymentFailedEvent): Promise<void> {
    this.logger.warn(
      `Payment failed: ${event.paymentId} for order ${event.orderId}. Reason: ${event.reason}`,
    );

    // TODO: Update order status to 'failed'
    // TODO: Send payment failure notification
    // TODO: Update analytics

    // These would typically be done via:
    // - OrderService.markAsPaymentFailed(event.orderId)
    // - NotificationService.sendPaymentFailedNotification(event)
  }
}
