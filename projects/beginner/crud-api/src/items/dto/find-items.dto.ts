import { IsOptional, IsString, IsIn, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FindItemsDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search term to filter by name or description',
    example: 'book',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by category',
    example: 'electronics',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['name', 'price', 'createdAt'],
    example: 'createdAt',
  })
  @IsOptional()
  @IsIn(['name', 'price', 'createdAt'])
  sort?: 'name' | 'price' | 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }): boolean | undefined => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  isActive?: boolean;
}
