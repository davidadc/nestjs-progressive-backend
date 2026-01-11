import { registerAs } from '@nestjs/config';

export type PaymentProvider = 'stripe' | 'paystack';

export default registerAs('payment', () => ({
  provider: (process.env.PAYMENT_PROVIDER as PaymentProvider) || 'stripe',
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    apiVersion: process.env.STRIPE_API_VERSION || '2023-10-16',
  },
  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY,
    publicKey: process.env.PAYSTACK_PUBLIC_KEY,
    webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET,
    baseUrl: process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co',
  },
}));
