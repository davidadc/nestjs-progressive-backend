import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetFollowingQuery } from './get-following.query';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { ProblemDetailsFactory } from '../../../common/exceptions/problem-details.factory';
import { UserSummaryDto } from '../dto/user-response.dto';
import { PaginatedResult, PaginationMeta } from '../../../common/interceptors/response-envelope.interceptor';

@QueryHandler(GetFollowingQuery)
export class GetFollowingHandler implements IQueryHandler<GetFollowingQuery> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    query: GetFollowingQuery,
  ): Promise<PaginatedResult<UserSummaryDto>> {
    const { userId, page, limit } = query;

    // Check if user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw ProblemDetailsFactory.notFound('User', userId);
    }

    const result = await this.userRepository.getFollowing(userId, {
      page,
      limit,
    });

    const items: UserSummaryDto[] = result.items.map((u) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      avatar: u.avatar,
    }));

    const pagination: PaginationMeta = {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
      hasNext: result.page < result.totalPages,
      hasPrevious: result.page > 1,
    };

    return { items, pagination };
  }
}
