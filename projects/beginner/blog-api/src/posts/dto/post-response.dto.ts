import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Post } from '../entities/post.entity';
import { CategoryResponseDto } from '../../categories/dto/category-response.dto';

class AuthorDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;
}

export class PostResponseDto {
  @ApiProperty({ description: 'Post ID', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Post title' })
  title: string;

  @ApiProperty({ description: 'Post slug' })
  slug: string;

  @ApiProperty({ description: 'Post content' })
  content: string;

  @ApiPropertyOptional({ description: 'Post excerpt' })
  excerpt: string | null;

  @ApiProperty({ description: 'Whether the post is published' })
  published: boolean;

  @ApiProperty({ description: 'Post author', type: AuthorDto })
  author: AuthorDto;

  @ApiPropertyOptional({
    description: 'Post category',
    type: CategoryResponseDto,
  })
  category: CategoryResponseDto | null;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  constructor(post: Post) {
    this.id = post.id;
    this.title = post.title;
    this.slug = post.slug;
    this.content = post.content;
    this.excerpt = post.excerpt || null;
    this.published = post.published;
    this.author = {
      id: post.author.id,
      name: post.author.name,
    };
    this.category = post.category
      ? new CategoryResponseDto(post.category)
      : null;
    this.createdAt = post.createdAt;
    this.updatedAt = post.updatedAt;
  }
}

class CommentDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ type: AuthorDto })
  user: AuthorDto;

  @ApiProperty()
  createdAt: Date;
}

export class PostWithCommentsResponseDto extends PostResponseDto {
  @ApiProperty({ description: 'Post comments', type: [CommentDto] })
  comments: CommentDto[];

  constructor(post: Post) {
    super(post);
    this.comments = (post.comments || []).map((comment) => ({
      id: comment.id,
      content: comment.content,
      user: {
        id: comment.user.id,
        name: comment.user.name,
      },
      createdAt: comment.createdAt,
    }));
  }
}

export class PaginatedPostsResponseDto {
  @ApiProperty({ type: [PostResponseDto] })
  data: PostResponseDto[];

  @ApiProperty({
    example: { page: 1, limit: 10, total: 100, totalPages: 10 },
  })
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
