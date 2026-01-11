import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateProfileCommand } from './update-profile.command';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { ProblemDetailsFactory } from '../../../common/exceptions/problem-details.factory';
import { UserResponseDto } from '../dto/user-response.dto';

@CommandHandler(UpdateProfileCommand)
export class UpdateProfileHandler
  implements ICommandHandler<UpdateProfileCommand>
{
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: UpdateProfileCommand): Promise<UserResponseDto> {
    const { userId, name, bio, avatar } = command;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw ProblemDetailsFactory.notFound('User', userId);
    }

    // Update fields if provided
    if (name !== undefined) {
      user.name = name;
    }
    if (bio !== undefined) {
      user.bio = bio;
    }
    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    const updatedUser = await this.userRepository.save(user);

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      name: updatedUser.name,
      avatar: updatedUser.avatar,
      bio: updatedUser.bio,
      followersCount: updatedUser.followersCount,
      followingCount: updatedUser.followingCount,
      postsCount: updatedUser.postsCount,
      createdAt: updatedUser.createdAt,
    };
  }
}
