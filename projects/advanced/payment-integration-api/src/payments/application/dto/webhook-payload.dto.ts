import { ApiProperty } from '@nestjs/swagger';

/**
 * Stripe webhook event structure
 */
export class StripeWebhookEventDto {
  @ApiProperty({ example: 'evt_1234567890' })
  id: string;

  @ApiProperty({ example: 'payment_intent.succeeded' })
  type: string;

  @ApiProperty()
  data: {
    object: {
      id: string;
      amount: number;
      currency: string;
      status: string;
      metadata?: Record<string, string>;
      last_payment_error?: {
        message: string;
        code: string;
      };
    };
  };

  @ApiProperty({ example: 1704067200 })
  created: number;
}

/**
 * Generic webhook result
 */
export class WebhookResultDto {
  @ApiProperty({ example: true })
  received: boolean;

  @ApiProperty({ example: 'Webhook processed successfully', required: false })
  message?: string;
}
