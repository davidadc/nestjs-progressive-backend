import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  IHashtagRepository,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/repositories/hashtag.repository.interface';
import { HashtagEntity } from '../../../shared/persistence/entities/hashtag.entity';
import { PostEntity } from '../../../shared/persistence/entities/post.entity';

@Injectable()
export class HashtagRepository implements IHashtagRepository {
  constructor(
    @InjectRepository(HashtagEntity)
    private readonly hashtagRepo: Repository<HashtagEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepo: Repository<PostEntity>,
  ) {}

  async findByTag(tag: string): Promise<HashtagEntity | null> {
    return this.hashtagRepo.findOne({ where: { tag } });
  }

  async getTrending(limit: number): Promise<HashtagEntity[]> {
    return this.hashtagRepo.find({
      where: {},
      order: { usageCount: 'DESC' },
      take: limit,
    });
  }

  async getPostsByHashtag(
    tag: string,
    options: PaginationOptions,
  ): Promise<PaginatedResult<PostEntity>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.postRepo
      .createQueryBuilder('post')
      .innerJoin('post.hashtags', 'hashtag', 'hashtag.tag = :tag', { tag })
      .leftJoinAndSelect('post.author', 'author')
      .orderBy('post.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
