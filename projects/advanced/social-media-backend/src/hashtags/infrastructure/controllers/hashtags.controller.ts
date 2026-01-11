import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { TrendingHashtagDto } from '../../application/dto/hashtag-response.dto';
import { PostResponseDto } from '../../../posts/application/dto/post-response.dto';
import { GetTrendingHashtagsQuery } from '../../application/queries/get-trending-hashtags.query';
import { GetPostsByHashtagQuery } from '../../application/queries/get-posts-by-hashtag.query';
import { PaginatedResult } from '../../../common/interceptors/response-envelope.interceptor';

@ApiTags('Hashtags')
@Controller('api/v1/hashtags')
@UseGuards(JwtAuthGuard)
export class HashtagsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('trending')
  @Public()
  @ApiOperation({ summary: 'Get trending hashtags' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of trending hashtags to return (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of trending hashtags',
    type: [TrendingHashtagDto],
  })
  async getTrending(
    @Query('limit') limit?: number,
  ): Promise<TrendingHashtagDto[]> {
    return this.queryBus.execute(
      new GetTrendingHashtagsQuery(limit || 10),
    );
  }

  @Get(':tag/posts')
  @Public()
  @ApiOperation({ summary: 'Get posts by hashtag' })
  @ApiParam({ name: 'tag', description: 'Hashtag (without #)' })
  @ApiResponse({
    status: 200,
    description: 'List of posts with the hashtag',
  })
  @ApiResponse({
    status: 404,
    description: 'Hashtag not found',
  })
  async getPostsByHashtag(
    @Param('tag') tag: string,
    @Query() pagination: PaginationQueryDto,
    @CurrentUser() currentUser?: CurrentUserPayload,
  ): Promise<PaginatedResult<PostResponseDto>> {
    return this.queryBus.execute(
      new GetPostsByHashtagQuery(
        tag,
        pagination.page,
        pagination.limit,
        currentUser?.userId,
      ),
    );
  }
}
