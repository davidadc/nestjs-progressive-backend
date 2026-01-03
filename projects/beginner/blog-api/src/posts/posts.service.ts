import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostsRepository } from './posts.repository';
import { CategoriesService } from '../categories/categories.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { FindPostsDto } from './dto/find-posts.dto';
import {
  PostResponseDto,
  PostWithCommentsResponseDto,
  PaginatedPostsResponseDto,
} from './dto/post-response.dto';
import { generateSlug, makeSlugUnique } from '../common/utils/slug.util';

@Injectable()
export class PostsService {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly categoriesService: CategoriesService,
  ) {}

  async create(authorId: string, dto: CreatePostDto): Promise<PostResponseDto> {
    // Validate category if provided
    if (dto.categoryId) {
      const category = await this.categoriesService.findById(dto.categoryId);
      if (!category) {
        throw new NotFoundException(
          `Category with ID '${dto.categoryId}' not found`,
        );
      }
    }

    // Generate unique slug
    const baseSlug = generateSlug(dto.title);
    const existingSlugs = await this.postsRepository.findAllSlugs();
    const slug = makeSlugUnique(baseSlug, existingSlugs);

    const post = await this.postsRepository.create({
      title: dto.title,
      slug,
      content: dto.content,
      excerpt: dto.excerpt,
      categoryId: dto.categoryId,
      published: dto.published ?? false,
      authorId,
    });

    return new PostResponseDto(post);
  }

  async findAllPublished(
    dto: FindPostsDto,
  ): Promise<PaginatedPostsResponseDto> {
    const result = await this.postsRepository.findAllPublished(dto);
    return {
      data: result.data.map((post) => new PostResponseDto(post)),
      meta: result.meta,
    };
  }

  async findBySlug(slug: string): Promise<PostWithCommentsResponseDto> {
    const post = await this.postsRepository.findBySlugWithComments(slug);
    if (!post) {
      throw new NotFoundException(`Post with slug '${slug}' not found`);
    }
    return new PostWithCommentsResponseDto(post);
  }

  async update(
    authorId: string,
    slug: string,
    dto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    const post = await this.postsRepository.findBySlug(slug);
    if (!post) {
      throw new NotFoundException(`Post with slug '${slug}' not found`);
    }

    if (post.authorId !== authorId) {
      throw new ForbiddenException('You can only update your own posts');
    }

    // Validate category if provided
    if (dto.categoryId) {
      const category = await this.categoriesService.findById(dto.categoryId);
      if (!category) {
        throw new NotFoundException(
          `Category with ID '${dto.categoryId}' not found`,
        );
      }
    }

    // Generate new slug if title changed
    let newSlug = post.slug;
    if (dto.title && dto.title !== post.title) {
      const baseSlug = generateSlug(dto.title);
      const existingSlugs = await this.postsRepository.findAllSlugs();
      // Remove current slug from existing slugs to allow keeping it
      const filteredSlugs = existingSlugs.filter((s) => s !== post.slug);
      newSlug = makeSlugUnique(baseSlug, filteredSlugs);
    }

    const updatedPost = await this.postsRepository.update(post.id, {
      ...dto,
      slug: newSlug,
    });

    return new PostResponseDto(updatedPost!);
  }

  async remove(authorId: string, slug: string): Promise<void> {
    const post = await this.postsRepository.findBySlug(slug);
    if (!post) {
      throw new NotFoundException(`Post with slug '${slug}' not found`);
    }

    if (post.authorId !== authorId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.postsRepository.softDelete(post.id);
  }

  async findById(id: string) {
    return this.postsRepository.findById(id);
  }
}
