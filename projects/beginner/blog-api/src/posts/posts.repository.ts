import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { FindPostsDto } from './dto/find-posts.dto';
import { PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectRepository(Post)
    private readonly repository: Repository<Post>,
  ) {}

  async create(data: Partial<Post>): Promise<Post> {
    const post = this.repository.create(data);
    return this.repository.save(post);
  }

  async findAllPublished(dto: FindPostsDto): Promise<PaginatedResult<Post>> {
    const { page = 1, limit = 10, categoryId, search } = dto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.category', 'category')
      .where('post.published = :published', { published: true });

    if (categoryId) {
      queryBuilder.andWhere('post.categoryId = :categoryId', { categoryId });
    }

    if (search) {
      queryBuilder.andWhere(
        '(post.title ILIKE :search OR post.content ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy('post.createdAt', 'DESC').skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByAuthor(
    authorId: string,
    dto: FindPostsDto,
  ): Promise<PaginatedResult<Post>> {
    const { page = 1, limit = 10 } = dto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.repository.findAndCount({
      where: { authorId },
      relations: ['author', 'category'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<Post | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['author', 'category'],
    });
  }

  async findBySlug(slug: string): Promise<Post | null> {
    return this.repository.findOne({
      where: { slug },
      relations: ['author', 'category'],
    });
  }

  async findBySlugWithComments(slug: string): Promise<Post | null> {
    return this.repository.findOne({
      where: { slug },
      relations: ['author', 'category', 'comments', 'comments.user'],
    });
  }

  async findAllSlugs(): Promise<string[]> {
    const posts = await this.repository.find({
      select: ['slug'],
      withDeleted: true,
    });
    return posts.map((p) => p.slug);
  }

  async update(id: string, data: Partial<Post>): Promise<Post | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
