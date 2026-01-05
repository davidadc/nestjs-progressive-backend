import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { User } from '../../domain/entities/user.entity';
import type {
  IUserRepository,
  CreateUserData,
} from '../../domain/repositories/user.repository.interface';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userData: CreateUserData): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email: userData.email,
        password: userData.password,
        storageUsed: userData.storageUsed,
        storageLimit: userData.storageLimit,
      },
    });

    return new User(user);
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    return user ? new User(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    return user ? new User(user) : null;
  }

  async updateStorageUsed(id: string, storageUsed: bigint): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { storageUsed },
    });

    return new User(user);
  }

  async incrementStorageUsed(id: string, increment: bigint): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        storageUsed: {
          increment,
        },
      },
    });

    return new User(user);
  }

  async decrementStorageUsed(id: string, decrement: bigint): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        storageUsed: {
          decrement,
        },
      },
    });

    return new User(user);
  }
}
