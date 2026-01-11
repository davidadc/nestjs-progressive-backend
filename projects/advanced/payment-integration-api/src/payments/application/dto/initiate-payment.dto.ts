import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString, IsIn, IsUrl } from 'class-validator';

export class InitiatePaymentDto {
  @ApiPropertyOptional({
    description: 'Currency code (default: USD)',
    example: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD'])
  currency?: string;

  @ApiPropertyOptional({
    description: 'URL to redirect after payment completion',
    example: 'https://example.com/payment/complete',
  })
  @IsOptional()
  @IsUrl()
  returnUrl?: string;

  @ApiPropertyOptional({
    description: 'URL to redirect if payment is cancelled',
    example: 'https://example.com/payment/cancel',
  })
  @IsOptional()
  @IsUrl()
  cancelUrl?: string;
}
