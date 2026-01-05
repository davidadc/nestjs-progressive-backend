import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  type ICommentRepository,
  type CreateCommentData,
} from '../../domain/repositories/comment.repository.interface';
import { TaskComment } from '../../domain/entities/comment.entity';
import { User, UserRole } from '../../../users/domain/entities/user.entity';
import {
  TaskComment as PrismaTaskComment,
  User as PrismaUser,
} from '@prisma/client';

type PrismaCommentWithRelations = PrismaTaskComment & {
  user?: PrismaUser;
};

@Injectable()
export class CommentRepository implements ICommentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCommentData): Promise<TaskComment> {
    const prismaComment = await this.prisma.taskComment.create({
      data: {
        taskId: data.taskId,
        userId: data.userId,
        content: data.content,
      },
      include: {
        user: true,
      },
    });
    return this.mapToDomain(prismaComment);
  }

  async findById(id: string): Promise<TaskComment | null> {
    const prismaComment = await this.prisma.taskComment.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
    return prismaComment ? this.mapToDomain(prismaComment) : null;
  }

  async findByTaskId(taskId: string): Promise<TaskComment[]> {
    const prismaComments = await this.prisma.taskComment.findMany({
      where: { taskId },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    return prismaComments.map((c) => this.mapToDomain(c));
  }

  async findByUserId(userId: string): Promise<TaskComment[]> {
    const prismaComments = await this.prisma.taskComment.findMany({
      where: { userId },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return prismaComments.map((c) => this.mapToDomain(c));
  }

  async update(id: string, content: string): Promise<TaskComment> {
    const prismaComment = await this.prisma.taskComment.update({
      where: { id },
      data: { content },
      include: {
        user: true,
      },
    });
    return this.mapToDomain(prismaComment);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.taskComment.delete({
      where: { id },
    });
  }

  async countByTaskId(taskId: string): Promise<number> {
    return this.prisma.taskComment.count({
      where: { taskId },
    });
  }

  private mapToDomain(prismaComment: PrismaCommentWithRelations): TaskComment {
    return new TaskComment({
      id: prismaComment.id,
      taskId: prismaComment.taskId,
      userId: prismaComment.userId,
      user: prismaComment.user
        ? this.mapUserToDomain(prismaComment.user)
        : undefined,
      content: prismaComment.content,
      createdAt: prismaComment.createdAt,
      updatedAt: prismaComment.updatedAt,
    });
  }

  private mapUserToDomain(prismaUser: PrismaUser): User {
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
