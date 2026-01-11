import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  ICommentRepository,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/repositories/comment.repository.interface';
import { CommentEntity } from '../../../shared/persistence/entities/comment.entity';
import { LikeEntity } from '../../../shared/persistence/entities/like.entity';

@Injectable()
export class CommentRepository implements ICommentRepository {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly commentRepo: Repository<CommentEntity>,
    @InjectRepository(LikeEntity)
    private readonly likeRepo: Repository<LikeEntity>,
  ) {}

  async findById(id: string): Promise<CommentEntity | null> {
    return this.commentRepo.findOne({ where: { id } });
  }

  async findByIdWithUser(id: string): Promise<CommentEntity | null> {
    return this.commentRepo.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async findByPost(
    postId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResult<CommentEntity>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [items, total] = await this.commentRepo.findAndCount({
      where: { postId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async save(comment: CommentEntity): Promise<CommentEntity> {
    return this.commentRepo.save(comment);
  }

  async delete(id: string): Promise<void> {
    await this.commentRepo.delete(id);
  }

  // Like operations
  async findLike(userId: string, commentId: string): Promise<LikeEntity | null> {
    return this.likeRepo.findOne({
      where: {
        userId,
        targetId: commentId,
        targetType: 'comment',
      },
    });
  }

  async createLike(userId: string, commentId: string): Promise<LikeEntity> {
    const like = this.likeRepo.create({
      userId,
      targetId: commentId,
      targetType: 'comment',
    });
    return this.likeRepo.save(like);
  }

  async deleteLike(userId: string, commentId: string): Promise<void> {
    await this.likeRepo.delete({
      userId,
      targetId: commentId,
      targetType: 'comment',
    });
  }

  async incrementLikesCount(commentId: string): Promise<void> {
    await this.commentRepo.increment({ id: commentId }, 'likesCount', 1);
  }

  async decrementLikesCount(commentId: string): Promise<void> {
    await this.commentRepo.decrement({ id: commentId }, 'likesCount', 1);
  }
}
