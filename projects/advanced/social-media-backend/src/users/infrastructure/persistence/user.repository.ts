import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { UserEntity } from '../../../shared/persistence/entities/user.entity';
import { FollowEntity } from '../../../shared/persistence/entities/follow.entity';
import {
  IUserRepository,
  PaginatedResult,
  PaginationOptions,
} from '../../domain/repositories/user.repository.interface';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(FollowEntity)
    private readonly followRepo: Repository<FollowEntity>,
  ) {}

  async findById(id: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({ where: { email: email.toLowerCase() } });
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({
      where: { username: username.toLowerCase() },
    });
  }

  async save(user: UserEntity): Promise<UserEntity> {
    return this.userRepo.save(user);
  }

  async findFollow(
    followerId: string,
    followingId: string,
  ): Promise<FollowEntity | null> {
    return this.followRepo.findOne({
      where: { followerId, followingId },
    });
  }

  async createFollow(
    followerId: string,
    followingId: string,
  ): Promise<FollowEntity> {
    const follow = this.followRepo.create({ followerId, followingId });
    return this.followRepo.save(follow);
  }

  async deleteFollow(followerId: string, followingId: string): Promise<void> {
    await this.followRepo.delete({ followerId, followingId });
  }

  async getFollowers(
    userId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResult<UserEntity>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [follows, total] = await this.followRepo.findAndCount({
      where: { followingId: userId },
      relations: ['follower'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const items = follows.map((f) => f.follower);
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getFollowing(
    userId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResult<UserEntity>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [follows, total] = await this.followRepo.findAndCount({
      where: { followerId: userId },
      relations: ['following'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const items = follows.map((f) => f.following);
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async searchUsers(
    query: string,
    options: PaginationOptions,
  ): Promise<PaginatedResult<UserEntity>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [items, total] = await this.userRepo.findAndCount({
      where: [
        { username: ILike(`%${query}%`) },
        { name: ILike(`%${query}%`) },
      ],
      skip,
      take: limit,
      order: { followersCount: 'DESC' },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async incrementFollowersCount(userId: string): Promise<void> {
    await this.userRepo.increment({ id: userId }, 'followersCount', 1);
  }

  async decrementFollowersCount(userId: string): Promise<void> {
    await this.userRepo.decrement({ id: userId }, 'followersCount', 1);
  }

  async incrementFollowingCount(userId: string): Promise<void> {
    await this.userRepo.increment({ id: userId }, 'followingCount', 1);
  }

  async decrementFollowingCount(userId: string): Promise<void> {
    await this.userRepo.decrement({ id: userId }, 'followingCount', 1);
  }
}
