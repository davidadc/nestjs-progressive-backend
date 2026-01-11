import { Injectable, Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import paymentConfig, { PaymentProvider } from '../../../config/payment.config';
import { StripePaymentStrategy } from './stripe.strategy';
import { PaystackPaymentStrategy } from './paystack.strategy';
import type { IPaymentStrategy } from './payment.strategy.interface';

@Injectable()
export class PaymentStrategyFactory {
  constructor(
    @Inject(paymentConfig.KEY)
    private readonly config: ConfigType<typeof paymentConfig>,
    private readonly stripeStrategy: StripePaymentStrategy,
    private readonly paystackStrategy: PaystackPaymentStrategy,
  ) {}

  getStrategy(provider?: PaymentProvider): IPaymentStrategy {
    const selectedProvider = provider || this.config.provider;

    switch (selectedProvider) {
      case 'stripe':
        return this.stripeStrategy;
      case 'paystack':
        return this.paystackStrategy;
      default:
        throw new Error(`Unknown payment provider: ${selectedProvider}`);
    }
  }

  getDefaultStrategy(): IPaymentStrategy {
    return this.getStrategy(this.config.provider);
  }
}
