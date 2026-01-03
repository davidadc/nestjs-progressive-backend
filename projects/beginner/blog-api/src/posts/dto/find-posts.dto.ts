import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FindPostsDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by category ID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Search in title and content',
    example: 'javascript',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
