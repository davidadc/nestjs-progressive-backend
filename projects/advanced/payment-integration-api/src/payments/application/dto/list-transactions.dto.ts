import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ListTransactionsDto {
  @ApiPropertyOptional({
    description: 'Filter by payment ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  paymentId?: string;

  @ApiPropertyOptional({
    description: 'Filter by transaction status',
    enum: ['pending', 'succeeded', 'failed'],
  })
  @IsOptional()
  @IsIn(['pending', 'succeeded', 'failed'])
  status?: 'pending' | 'succeeded' | 'failed';

  @ApiPropertyOptional({
    description: 'Filter by transaction type',
    enum: ['charge', 'refund', 'dispute'],
  })
  @IsOptional()
  @IsIn(['charge', 'refund', 'dispute'])
  type?: 'charge' | 'refund' | 'dispute';

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
