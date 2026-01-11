import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetUserProfileQuery } from './get-user-profile.query';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { ProblemDetailsFactory } from '../../../common/exceptions/problem-details.factory';
import { UserResponseDto } from '../dto/user-response.dto';

@QueryHandler(GetUserProfileQuery)
export class GetUserProfileHandler
  implements IQueryHandler<GetUserProfileQuery>
{
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(query: GetUserProfileQuery): Promise<UserResponseDto> {
    const { userId, currentUserId } = query;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw ProblemDetailsFactory.notFound('User', userId);
    }

    let isFollowing: boolean | undefined;
    if (currentUserId && currentUserId !== userId) {
      const follow = await this.userRepository.findFollow(currentUserId, userId);
      isFollowing = !!follow;
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      postsCount: user.postsCount,
      createdAt: user.createdAt,
      isFollowing,
    };
  }
}
