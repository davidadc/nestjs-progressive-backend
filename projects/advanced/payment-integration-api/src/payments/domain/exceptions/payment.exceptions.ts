/**
 * Base exception for all payment domain errors
 */
export abstract class PaymentDomainException extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Thrown when an invalid payment ID is provided
 */
export class InvalidPaymentIdException extends PaymentDomainException {
  constructor(id: string) {
    super(`Invalid payment ID: ${id}`, 'INVALID_PAYMENT_ID');
  }
}

/**
 * Thrown when an invalid order ID is provided
 */
export class InvalidOrderIdException extends PaymentDomainException {
  constructor(id: string) {
    super(`Invalid order ID: ${id}`, 'INVALID_ORDER_ID');
  }
}

/**
 * Thrown when a payment is not found
 */
export class PaymentNotFoundException extends PaymentDomainException {
  constructor(id: string) {
    super(`Payment not found: ${id}`, 'PAYMENT_NOT_FOUND');
  }
}

/**
 * Thrown when an invalid money amount or currency is provided
 */
export class InvalidMoneyException extends PaymentDomainException {
  constructor(reason: string) {
    super(`Invalid money: ${reason}`, 'INVALID_MONEY');
  }
}

/**
 * Thrown when attempting to perform operations on mismatched currencies
 */
export class CurrencyMismatchException extends PaymentDomainException {
  constructor(currency1: string, currency2: string) {
    super(
      `Currency mismatch: cannot perform operation between ${currency1} and ${currency2}`,
      'CURRENCY_MISMATCH',
    );
  }
}

/**
 * Thrown when a payment state transition is invalid
 */
export class InvalidPaymentStateException extends PaymentDomainException {
  constructor(reason: string) {
    super(`Invalid payment state: ${reason}`, 'INVALID_PAYMENT_STATE');
  }
}

/**
 * Thrown when there's an error with the payment provider
 */
export class PaymentProviderException extends PaymentDomainException {
  constructor(
    provider: string,
    reason: string,
    public readonly providerError?: unknown,
  ) {
    super(`Payment provider error (${provider}): ${reason}`, 'PAYMENT_PROVIDER_ERROR');
  }
}

/**
 * Thrown when a payment has already been processed
 */
export class PaymentAlreadyProcessedException extends PaymentDomainException {
  constructor(paymentId: string) {
    super(`Payment ${paymentId} has already been processed`, 'PAYMENT_ALREADY_PROCESSED');
  }
}

/**
 * Thrown when attempting to refund more than the original amount
 */
export class RefundExceedsPaymentException extends PaymentDomainException {
  constructor(refundAmount: number, paymentAmount: number) {
    super(
      `Refund amount (${refundAmount}) exceeds payment amount (${paymentAmount})`,
      'REFUND_EXCEEDS_PAYMENT',
    );
  }
}

/**
 * Thrown when an order is not found
 */
export class OrderNotFoundException extends PaymentDomainException {
  constructor(id: string) {
    super(`Order not found: ${id}`, 'ORDER_NOT_FOUND');
  }
}

/**
 * Thrown when an order is not in a valid state for payment
 */
export class OrderNotPayableException extends PaymentDomainException {
  constructor(orderId: string, currentStatus: string) {
    super(
      `Order ${orderId} is not payable. Current status: ${currentStatus}`,
      'ORDER_NOT_PAYABLE',
    );
  }
}
