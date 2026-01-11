import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { FeedQueryDto } from '../../application/dto/feed-query.dto';
import { FeedResponseDto } from '../../application/dto/feed-response.dto';
import { GetPersonalizedFeedQuery } from '../../application/queries/get-personalized-feed.query';
import { GetTrendingFeedQuery } from '../../application/queries/get-trending-feed.query';

@ApiTags('Feed')
@Controller('api/v1/feed')
@UseGuards(JwtAuthGuard)
export class FeedController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get personalized feed',
    description: 'Returns posts from users you follow, ordered by recency',
  })
  @ApiResponse({
    status: 200,
    description: 'Personalized feed',
    type: FeedResponseDto,
  })
  async getPersonalizedFeed(
    @Query() query: FeedQueryDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<FeedResponseDto> {
    return this.queryBus.execute(
      new GetPersonalizedFeedQuery(
        currentUser.userId,
        query.cursor,
        query.limit,
      ),
    );
  }

  @Get('trending')
  @Public()
  @ApiOperation({
    summary: 'Get trending feed',
    description:
      'Returns trending posts based on engagement (likes + comments)',
  })
  @ApiResponse({
    status: 200,
    description: 'Trending feed',
    type: FeedResponseDto,
  })
  async getTrendingFeed(
    @Query() query: FeedQueryDto,
    @CurrentUser() currentUser?: CurrentUserPayload,
  ): Promise<FeedResponseDto> {
    return this.queryBus.execute(
      new GetTrendingFeedQuery(query.cursor, query.limit, currentUser?.userId),
    );
  }
}
