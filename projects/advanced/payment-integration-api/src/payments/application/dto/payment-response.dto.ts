import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentResponseDto {
  @ApiProperty({
    description: 'Payment ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Order ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  orderId: string;

  @ApiProperty({
    description: 'Payment amount',
    example: 99.99,
  })
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
  })
  currency: string;

  @ApiProperty({
    description: 'Payment status',
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    example: 'processing',
  })
  status: string;

  @ApiProperty({
    description: 'Payment provider',
    enum: ['stripe', 'paystack'],
    example: 'stripe',
  })
  provider: string;

  @ApiPropertyOptional({
    description: 'External payment provider ID',
    example: 'pi_1234567890',
  })
  externalId?: string;

  @ApiPropertyOptional({
    description: 'Checkout URL for completing payment',
    example: 'https://checkout.stripe.com/pay/cs_test_...',
  })
  checkoutUrl?: string;

  @ApiPropertyOptional({
    description: 'Failure reason if payment failed',
    example: 'Card declined',
  })
  failureReason?: string;

  @ApiProperty({
    description: 'Payment creation timestamp',
    example: '2026-01-11T10:00:00Z',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'Payment completion timestamp',
    example: '2026-01-11T10:05:00Z',
  })
  completedAt?: Date;
}
