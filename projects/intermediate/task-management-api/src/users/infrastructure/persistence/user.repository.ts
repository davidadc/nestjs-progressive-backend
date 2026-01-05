import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  type IUserRepository,
  type CreateUserData,
} from '../../domain/repositories/user.repository.interface';
import { User, UserRole } from '../../domain/entities/user.entity';
import { User as PrismaUser, UserRole as PrismaUserRole } from '@prisma/client';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserData): Promise<User> {
    const prismaUser = await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: data.password,
        role: data.role as PrismaUserRole,
      },
    });
    return this.mapToDomain(prismaUser);
  }

  async findById(id: string): Promise<User | null> {
    const prismaUser = await this.prisma.user.findUnique({
      where: { id },
    });
    return prismaUser ? this.mapToDomain(prismaUser) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const prismaUser = await this.prisma.user.findUnique({
      where: { email },
    });
    return prismaUser ? this.mapToDomain(prismaUser) : null;
  }

  async findAll(): Promise<User[]> {
    const prismaUsers = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return prismaUsers.map((u) => this.mapToDomain(u));
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.password !== undefined) updateData.password = data.password;
    if (data.role !== undefined) updateData.role = data.role as PrismaUserRole;

    const prismaUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });
    return this.mapToDomain(prismaUser);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  private mapToDomain(prismaUser: PrismaUser): User {
    return new User({
      id: prismaUser.id,
      email: prismaUser.email,
      name: prismaUser.name,
      password: prismaUser.password,
      role: prismaUser.role as UserRole,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    });
  }
}
