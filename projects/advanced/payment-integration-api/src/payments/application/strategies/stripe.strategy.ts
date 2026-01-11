import { Injectable, Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import Stripe from 'stripe';
import paymentConfig from '../../../config/payment.config';
import { Money, PaymentProviderException } from '../../domain';
import type {
  IPaymentStrategy,
  PaymentIntentResult,
  PaymentConfirmationResult,
  RefundResult,
  CreatePaymentIntentInput,
} from './payment.strategy.interface';

@Injectable()
export class StripePaymentStrategy implements IPaymentStrategy {
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;

  constructor(
    @Inject(paymentConfig.KEY)
    private readonly config: ConfigType<typeof paymentConfig>,
  ) {
    if (!this.config.stripe.secretKey) {
      throw new Error('Stripe secret key is required');
    }
    if (!this.config.stripe.webhookSecret) {
      throw new Error('Stripe webhook secret is required');
    }
    this.stripe = new Stripe(this.config.stripe.secretKey, {
      apiVersion: '2025-12-15.clover',
    });
    this.webhookSecret = this.config.stripe.webhookSecret;
  }

  async createPaymentIntent(
    input: CreatePaymentIntentInput,
  ): Promise<PaymentIntentResult> {
    try {
      // Create a Checkout Session for redirect-based payment
      const session = await this.stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: input.amount.currency.toLowerCase(),
              product_data: {
                name: `Order ${input.orderId}`,
              },
              unit_amount: input.amount.amountInCents,
            },
            quantity: 1,
          },
        ],
        metadata: {
          orderId: input.orderId,
          ...input.metadata,
        },
        success_url: input.returnUrl || 'https://example.com/success',
        cancel_url: input.cancelUrl || 'https://example.com/cancel',
      });

      return {
        externalId: session.id,
        checkoutUrl: session.url ?? undefined,
        status: 'processing',
      };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new PaymentProviderException('stripe', error.message, error);
      }
      throw error;
    }
  }

  async confirmPayment(externalId: string): Promise<PaymentConfirmationResult> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(externalId);

      if (session.payment_status === 'paid') {
        return { status: 'succeeded' };
      }

      return {
        status: 'failed',
        failureReason: `Payment status: ${session.payment_status}`,
      };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new PaymentProviderException('stripe', error.message, error);
      }
      throw error;
    }
  }

  async refund(externalId: string, amount?: Money): Promise<RefundResult> {
    try {
      // First retrieve the session to get the payment intent
      const session = await this.stripe.checkout.sessions.retrieve(externalId);

      if (!session.payment_intent) {
        throw new PaymentProviderException(
          'stripe',
          'No payment intent found for session',
        );
      }

      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: session.payment_intent as string,
      };

      if (amount) {
        refundParams.amount = amount.amountInCents;
      }

      const refund = await this.stripe.refunds.create(refundParams);

      return {
        refundId: refund.id,
        status: refund.status === 'succeeded' ? 'succeeded' : 'pending',
        failureReason: refund.failure_reason ?? undefined,
      };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new PaymentProviderException('stripe', error.message, error);
      }
      throw error;
    }
  }

  validateWebhookSignature(
    payload: string | Buffer,
    signature: string,
  ): boolean {
    try {
      this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret,
      );
      return true;
    } catch {
      return false;
    }
  }

  parseWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.webhookSecret,
    );
  }
}
