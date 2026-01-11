import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetTrendingHashtagsQuery } from './get-trending-hashtags.query';
import type { IHashtagRepository } from '../../domain/repositories/hashtag.repository.interface';
import { HASHTAG_REPOSITORY } from '../../domain/repositories/hashtag.repository.interface';
import { TrendingHashtagDto } from '../dto/hashtag-response.dto';

@QueryHandler(GetTrendingHashtagsQuery)
export class GetTrendingHashtagsHandler
  implements IQueryHandler<GetTrendingHashtagsQuery>
{
  constructor(
    @Inject(HASHTAG_REPOSITORY)
    private readonly hashtagRepository: IHashtagRepository,
  ) {}

  async execute(query: GetTrendingHashtagsQuery): Promise<TrendingHashtagDto[]> {
    const { limit } = query;

    const hashtags = await this.hashtagRepository.getTrending(limit);

    return hashtags.map((hashtag, index) => ({
      tag: hashtag.tag,
      usageCount: hashtag.usageCount,
      rank: index + 1,
    }));
  }
}
