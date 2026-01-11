import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  IPostRepository,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/repositories/post.repository.interface';
import { PostEntity } from '../../../shared/persistence/entities/post.entity';
import { LikeEntity } from '../../../shared/persistence/entities/like.entity';
import { HashtagEntity } from '../../../shared/persistence/entities/hashtag.entity';
import { UserEntity } from '../../../shared/persistence/entities/user.entity';
import { CommentEntity } from '../../../shared/persistence/entities/comment.entity';

@Injectable()
export class PostRepository implements IPostRepository {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepo: Repository<PostEntity>,
    @InjectRepository(LikeEntity)
    private readonly likeRepo: Repository<LikeEntity>,
    @InjectRepository(HashtagEntity)
    private readonly hashtagRepo: Repository<HashtagEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(CommentEntity)
    private readonly commentRepo: Repository<CommentEntity>,
  ) {}

  async findById(id: string): Promise<PostEntity | null> {
    return this.postRepo.findOne({ where: { id } });
  }

  async findByIdWithAuthor(id: string): Promise<PostEntity | null> {
    return this.postRepo.findOne({
      where: { id },
      relations: ['author', 'hashtags'],
    });
  }

  async findByAuthor(
    authorId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResult<PostEntity>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [items, total] = await this.postRepo.findAndCount({
      where: { authorId },
      relations: ['author'],
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

  async save(post: PostEntity): Promise<PostEntity> {
    return this.postRepo.save(post);
  }

  async delete(id: string): Promise<void> {
    // Get the post with relations
    const post = await this.postRepo.findOne({
      where: { id },
      relations: ['hashtags'],
    });

    if (!post) {
      return;
    }

    // Get all comments for this post to delete their likes
    const comments = await this.commentRepo.find({ where: { postId: id } });
    const commentIds = comments.map((c) => c.id);

    // Delete all likes for comments (polymorphic, no FK cascade)
    if (commentIds.length > 0) {
      await this.likeRepo
        .createQueryBuilder()
        .delete()
        .where('targetId IN (:...ids)', { ids: commentIds })
        .andWhere('targetType = :type', { type: 'comment' })
        .execute();
    }

    // Delete all likes for this post (polymorphic, no FK cascade)
    await this.likeRepo.delete({
      targetId: id,
      targetType: 'post',
    });

    // Remove hashtag associations (junction table cleanup)
    post.hashtags = [];
    await this.postRepo.save(post);

    // Now delete the post (comments will be cascade deleted)
    await this.postRepo.delete(id);
  }

  // Like operations
  async findLike(userId: string, postId: string): Promise<LikeEntity | null> {
    return this.likeRepo.findOne({
      where: {
        userId,
        targetId: postId,
        targetType: 'post',
      },
    });
  }

  async createLike(userId: string, postId: string): Promise<LikeEntity> {
    const like = this.likeRepo.create({
      userId,
      targetId: postId,
      targetType: 'post',
    });
    return this.likeRepo.save(like);
  }

  async deleteLike(userId: string, postId: string): Promise<void> {
    await this.likeRepo.delete({
      userId,
      targetId: postId,
      targetType: 'post',
    });
  }

  async getPostLikes(
    postId: string,
    options: PaginationOptions,
  ): Promise<PaginatedResult<LikeEntity>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [items, total] = await this.likeRepo.findAndCount({
      where: {
        targetId: postId,
        targetType: 'post',
      },
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

  // Counter operations
  async incrementLikesCount(postId: string): Promise<void> {
    await this.postRepo.increment({ id: postId }, 'likesCount', 1);
  }

  async decrementLikesCount(postId: string): Promise<void> {
    await this.postRepo.decrement({ id: postId }, 'likesCount', 1);
  }

  async incrementCommentsCount(postId: string): Promise<void> {
    await this.postRepo.increment({ id: postId }, 'commentsCount', 1);
  }

  async decrementCommentsCount(postId: string): Promise<void> {
    await this.postRepo.decrement({ id: postId }, 'commentsCount', 1);
  }

  async incrementPostsCount(authorId: string): Promise<void> {
    await this.userRepo.increment({ id: authorId }, 'postsCount', 1);
  }

  async decrementPostsCount(authorId: string): Promise<void> {
    await this.userRepo.decrement({ id: authorId }, 'postsCount', 1);
  }

  // Hashtag operations
  async findOrCreateHashtags(tags: string[]): Promise<HashtagEntity[]> {
    const hashtags: HashtagEntity[] = [];

    for (const tag of tags) {
      let hashtag = await this.hashtagRepo.findOne({ where: { tag } });

      if (!hashtag) {
        hashtag = this.hashtagRepo.create({
          tag,
          usageCount: 0,
        });
        hashtag = await this.hashtagRepo.save(hashtag);
      }

      hashtags.push(hashtag);
    }

    return hashtags;
  }

  async incrementHashtagUsage(hashtagId: string): Promise<void> {
    await this.hashtagRepo.increment({ id: hashtagId }, 'usageCount', 1);
  }

  async decrementHashtagUsage(hashtagId: string): Promise<void> {
    await this.hashtagRepo.decrement({ id: hashtagId }, 'usageCount', 1);
  }
}
