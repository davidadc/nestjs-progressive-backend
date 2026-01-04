import { ApiProperty } from '@nestjs/swagger';
import { Category } from '../entities/category.entity';

export class CategoryResponseDto {
  @ApiProperty({ description: 'Category ID', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Category name' })
  name: string;

  @ApiProperty({ description: 'Category slug (URL-friendly)' })
  slug: string;

  constructor(category: Category) {
    this.id = category.id;
    this.name = category.name;
    this.slug = category.slug;
  }
}

export class CategoryWithPostCountDto extends CategoryResponseDto {
  @ApiProperty({ description: 'Number of posts in this category' })
  postCount: number;

  constructor(category: Category) {
    super(category);
    this.postCount = category.posts?.length || 0;
  }
}
