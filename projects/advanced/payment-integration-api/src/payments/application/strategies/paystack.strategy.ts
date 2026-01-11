import { Injectable, Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import * as crypto from 'crypto';
import paymentConfig from '../../../config/payment.config';
import { Money, PaymentProviderException } from '../../domain';
import type {
  IPaymentStrategy,
  PaymentIntentResult,
  PaymentConfirmationResult,
  RefundResult,
  CreatePaymentIntentInput,
} from './payment.strategy.interface';

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    status: 'success' | 'failed' | 'abandoned' | 'pending';
    reference: string;
    amount: number;
    currency: string;
    transaction_date: string;
    gateway_response: string;
  };
}

interface PaystackRefundResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    transaction: {
      id: number;
      reference: string;
    };
    amount: number;
    currency: string;
    status: 'pending' | 'processed' | 'failed';
    refunded_at: string;
  };
}

interface PaystackWebhookEvent {
  event: string;
  data: {
    id: number;
    reference: string;
    status: string;
    amount: number;
    currency: string;
    metadata?: {
      orderId?: string;
      [key: string]: unknown;
    };
  };
}

@Injectable()
export class PaystackPaymentStrategy implements IPaymentStrategy {
  private readonly secretKey: string;
  private readonly webhookSecret: string;
  private readonly baseUrl: string;

  constructor(
    @Inject(paymentConfig.KEY)
    private readonly config: ConfigType<typeof paymentConfig>,
  ) {
    if (!this.config.paystack.secretKey) {
      throw new Error('Paystack secret key is required');
    }
    if (!this.config.paystack.webhookSecret) {
      throw new Error('Paystack webhook secret is required');
    }
    this.secretKey = this.config.paystack.secretKey;
    this.webhookSecret = this.config.paystack.webhookSecret;
    this.baseUrl = this.config.paystack.baseUrl || 'https://api.paystack.co';
  }

  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult> {
    try {
      const reference = this.generateReference(input.orderId);

      const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: input.metadata?.email || 'customer@example.com',
          amount: input.amount.amountInCents, // Paystack uses smallest currency unit (kobo for NGN)
          currency: input.amount.currency.toUpperCase(),
          reference,
          callback_url: input.returnUrl,
          metadata: {
            orderId: input.orderId,
            cancel_action: input.cancelUrl,
            ...input.metadata,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new PaymentProviderException(
          'paystack',
          errorData.message || 'Failed to initialize transaction',
        );
      }

      const result = (await response.json()) as PaystackInitializeResponse;

      if (!result.status) {
        throw new PaymentProviderException('paystack', result.message);
      }

      return {
        externalId: result.data.reference,
        checkoutUrl: result.data.authorization_url,
        status: 'processing',
      };
    } catch (error) {
      if (error instanceof PaymentProviderException) {
        throw error;
      }
      throw new PaymentProviderException(
        'paystack',
        error instanceof Error ? error.message : 'Unknown error',
        error,
      );
    }
  }

  async confirmPayment(externalId: string): Promise<PaymentConfirmationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/transaction/verify/${externalId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new PaymentProviderException(
          'paystack',
          errorData.message || 'Failed to verify transaction',
        );
      }

      const result = (await response.json()) as PaystackVerifyResponse;

      if (!result.status) {
        throw new PaymentProviderException('paystack', result.message);
      }

      if (result.data.status === 'success') {
        return { status: 'succeeded' };
      }

      return {
        status: 'failed',
        failureReason: result.data.gateway_response || `Payment status: ${result.data.status}`,
      };
    } catch (error) {
      if (error instanceof PaymentProviderException) {
        throw error;
      }
      throw new PaymentProviderException(
        'paystack',
        error instanceof Error ? error.message : 'Unknown error',
        error,
      );
    }
  }

  async refund(externalId: string, amount?: Money): Promise<RefundResult> {
    try {
      const refundBody: { transaction: string; amount?: number } = {
        transaction: externalId,
      };

      if (amount) {
        refundBody.amount = amount.amountInCents;
      }

      const response = await fetch(`${this.baseUrl}/refund`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(refundBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new PaymentProviderException(
          'paystack',
          errorData.message || 'Failed to create refund',
        );
      }

      const result = (await response.json()) as PaystackRefundResponse;

      if (!result.status) {
        throw new PaymentProviderException('paystack', result.message);
      }

      const statusMap: Record<string, 'pending' | 'succeeded' | 'failed'> = {
        pending: 'pending',
        processed: 'succeeded',
        failed: 'failed',
      };

      return {
        refundId: result.data.id.toString(),
        status: statusMap[result.data.status] || 'pending',
      };
    } catch (error) {
      if (error instanceof PaymentProviderException) {
        throw error;
      }
      throw new PaymentProviderException(
        'paystack',
        error instanceof Error ? error.message : 'Unknown error',
        error,
      );
    }
  }

  validateWebhookSignature(payload: string | Buffer, signature: string): boolean {
    try {
      const payloadString = typeof payload === 'string' ? payload : payload.toString('utf8');
      const hash = crypto
        .createHmac('sha512', this.webhookSecret)
        .update(payloadString)
        .digest('hex');

      return hash === signature;
    } catch {
      return false;
    }
  }

  parseWebhookEvent(payload: string | Buffer, signature: string): PaystackWebhookEvent {
    if (!this.validateWebhookSignature(payload, signature)) {
      throw new PaymentProviderException('paystack', 'Invalid webhook signature');
    }

    const payloadString = typeof payload === 'string' ? payload : payload.toString('utf8');
    return JSON.parse(payloadString) as PaystackWebhookEvent;
  }

  private generateReference(orderId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `PAY_${orderId}_${timestamp}_${random}`;
  }
}
