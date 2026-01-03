import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ItemResponseDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Item name',
    example: 'Product Name',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Item description',
    example: 'A detailed description of the product',
  })
  description: string | null;

  @ApiPropertyOptional({
    description: 'Item price',
    example: 29.99,
  })
  price: number | null;

  @ApiProperty({
    description: 'Item quantity in stock',
    example: 100,
  })
  quantity: number;

  @ApiPropertyOptional({
    description: 'Item category',
    example: 'electronics',
  })
  category: string | null;

  @ApiProperty({
    description: 'Whether the item is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-01-03T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2026-01-03T10:00:00Z',
  })
  updatedAt: Date;
}
