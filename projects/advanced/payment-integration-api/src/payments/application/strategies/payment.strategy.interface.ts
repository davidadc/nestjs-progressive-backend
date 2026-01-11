import { Money } from '../../domain';

export const PAYMENT_STRATEGY = Symbol('PAYMENT_STRATEGY');

export interface PaymentIntentResult {
  externalId: string;
  clientSecret?: string;
  checkoutUrl?: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
}

export interface PaymentConfirmationResult {
  status: 'succeeded' | 'failed';
  failureReason?: string;
}

export interface RefundResult {
  refundId: string;
  status: 'pending' | 'succeeded' | 'failed';
  failureReason?: string;
}

export interface CreatePaymentIntentInput {
  amount: Money;
  orderId: string;
  metadata?: Record<string, string>;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface IPaymentStrategy {
  /**
   * Create a payment intent with the provider
   */
  createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult>;

  /**
   * Confirm payment status from provider
   */
  confirmPayment(externalId: string): Promise<PaymentConfirmationResult>;

  /**
   * Initiate a refund
   */
  refund(externalId: string, amount?: Money): Promise<RefundResult>;

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(payload: string | Buffer, signature: string): boolean;

  /**
   * Parse webhook event
   */
  parseWebhookEvent(payload: string | Buffer, signature: string): unknown;
}
