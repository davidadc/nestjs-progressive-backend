import { Injectable, Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import paymentConfig from '../../config/payment.config';

@Injectable()
export class PaymentProviderHealthIndicator extends HealthIndicator {
  constructor(
    @Inject(paymentConfig.KEY)
    private readonly config: ConfigType<typeof paymentConfig>,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const provider = this.config.provider;
    let isHealthy = false;
    let message = '';

    try {
      if (provider === 'stripe') {
        isHealthy = await this.checkStripeHealth();
        message = isHealthy
          ? 'Stripe API is reachable'
          : 'Stripe API is unreachable';
      } else if (provider === 'paystack') {
        isHealthy = await this.checkPaystackHealth();
        message = isHealthy
          ? 'Paystack API is reachable'
          : 'Paystack API is unreachable';
      } else {
        message = `Unknown provider: ${provider as string}`;
      }

      const result = this.getStatus(key, isHealthy, {
        provider,
        message,
      });

      if (isHealthy) {
        return result;
      }

      throw new HealthCheckError('Payment provider check failed', result);
    } catch (error) {
      if (error instanceof HealthCheckError) {
        throw error;
      }

      const result = this.getStatus(key, false, {
        provider,
        message: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new HealthCheckError('Payment provider check failed', result);
    }
  }

  private async checkStripeHealth(): Promise<boolean> {
    try {
      // Simple health check - verify we can reach Stripe API
      const response = await fetch('https://api.stripe.com/v1/balance', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.stripe.secretKey}`,
        },
      });

      // 401 is expected without proper auth, but means API is reachable
      // 200 means API is working with valid credentials
      return response.status === 200 || response.status === 401;
    } catch {
      return false;
    }
  }

  private async checkPaystackHealth(): Promise<boolean> {
    try {
      // Simple health check - verify we can reach Paystack API
      const response = await fetch('https://api.paystack.co/bank', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.paystack.secretKey}`,
        },
      });

      // Check if API is reachable (status 200 or 401)
      return response.status === 200 || response.status === 401;
    } catch {
      return false;
    }
  }
}
