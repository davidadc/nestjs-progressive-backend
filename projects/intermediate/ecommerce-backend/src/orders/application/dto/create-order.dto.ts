import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional } from 'class-validator';

export class CreateOrderDto {
  @ApiPropertyOptional({
    example: 'uuid-of-address',
    description: 'ID of the shipping address from user addresses',
  })
  @IsUUID()
  @IsOptional()
  shippingAddressId?: string;
}
