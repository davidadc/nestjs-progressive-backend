import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { SearchUsersQuery } from './search-users.query';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { UserSummaryDto } from '../dto/user-response.dto';
import { PaginatedResult, PaginationMeta } from '../../../common/interceptors/response-envelope.interceptor';

@QueryHandler(SearchUsersQuery)
export class SearchUsersHandler implements IQueryHandler<SearchUsersQuery> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    query: SearchUsersQuery,
  ): Promise<PaginatedResult<UserSummaryDto>> {
    const { query: searchQuery, page, limit } = query;

    const result = await this.userRepository.searchUsers(searchQuery, {
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
