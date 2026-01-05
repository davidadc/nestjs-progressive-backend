import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { UserResponseDto, OnlineUserDto } from '../dto/user-response.dto';
import { PresenceService } from '../../../chat/application/services/presence.service';
import { UserEntity } from '../../domain/entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly presenceService: PresenceService,
  ) {}

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toUserResponse(user);
  }

  async findByIds(ids: string[]): Promise<UserResponseDto[]> {
    const users = await this.userRepository.findByIds(ids);
    return users.map((user) => this.toUserResponse(user));
  }

  async getOnlineUsers(currentUserId: string): Promise<OnlineUserDto[]> {
    const onlineUserIds = await this.presenceService.getOnlineUserIds();
    const filteredIds = onlineUserIds.filter((id) => id !== currentUserId);

    if (filteredIds.length === 0) {
      return [];
    }

    const users = await this.userRepository.findByIds(filteredIds);
    const onlineUsers: OnlineUserDto[] = [];

    for (const user of users) {
      const status = await this.presenceService.getUserStatus(user.id);
      if (status) {
        onlineUsers.push({
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          status,
        });
      }
    }

    return onlineUsers;
  }

  private toUserResponse(user: UserEntity): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar ?? undefined,
      createdAt: user.createdAt,
    };
  }
}
