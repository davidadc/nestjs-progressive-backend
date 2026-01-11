import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostResponseDto } from '../../../posts/application/dto/post-response.dto';

export class FeedItemDto extends PostResponseDto {}

export class CursorPaginationMetaDto {
  @ApiPropertyOptional({
    description: 'Cursor for the next page',
    example: '2024-01-15T10:30:00.000Z',
  })
  nextCursor?: string;

  @ApiProperty({
    description: 'Whether there are more items',
    example: true,
  })
  hasMore: boolean;
}

export class FeedResponseDto {
  @ApiProperty({
    description: 'Feed items',
    type: [FeedItemDto],
  })
  items: FeedItemDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: CursorPaginationMetaDto,
  })
  pagination: CursorPaginationMetaDto;
}
