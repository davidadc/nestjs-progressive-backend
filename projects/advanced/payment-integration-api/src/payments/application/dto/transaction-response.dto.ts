import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransactionResponseDto {
  @ApiProperty({
    description: 'Transaction ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Payment ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  paymentId: string;

  @ApiProperty({
    description: 'Transaction type',
    enum: ['charge', 'refund', 'dispute'],
    example: 'charge',
  })
  type: string;

  @ApiProperty({
    description: 'Transaction amount',
    example: 99.99,
  })
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
  })
  currency: string;

  @ApiProperty({
    description: 'Transaction status',
    enum: ['pending', 'succeeded', 'failed'],
    example: 'succeeded',
  })
  status: string;

  @ApiPropertyOptional({
    description: 'External provider transaction ID',
    example: 'ch_1234567890',
  })
  externalId?: string;

  @ApiPropertyOptional({
    description: 'Failure reason if transaction failed',
    example: 'Insufficient funds',
  })
  failureReason?: string;

  @ApiProperty({
    description: 'Transaction timestamp',
    example: '2026-01-11T10:00:00Z',
  })
  timestamp: Date;
}

export class PaginatedTransactionsResponseDto {
  @ApiProperty({
    description: 'List of transactions',
    type: [TransactionResponseDto],
  })
  data: TransactionResponseDto[];

  @ApiProperty({
    description: 'Total number of transactions',
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Items per page',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 8,
  })
  pages: number;
}
