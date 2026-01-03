import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { generateSlug, makeSlugUnique } from '../common/utils/slug.util';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async create(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const baseSlug = generateSlug(dto.name);
    const existingSlugs = await this.categoriesRepository.findAllSlugs();
    const slug = makeSlugUnique(baseSlug, existingSlugs);

    const category = await this.categoriesRepository.create({
      name: dto.name,
      slug,
    });

    return new CategoryResponseDto(category);
  }

  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoriesRepository.findAll();
    return categories.map((category) => new CategoryResponseDto(category));
  }

  async findById(id: string): Promise<Category | null> {
    return this.categoriesRepository.findById(id);
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoriesRepository.findBySlug(slug);
    if (!category) {
      throw new NotFoundException(`Category with slug '${slug}' not found`);
    }
    return category;
  }

  async findBySlugWithPosts(slug: string): Promise<Category> {
    const category = await this.categoriesRepository.findBySlugWithPosts(slug);
    if (!category) {
      throw new NotFoundException(`Category with slug '${slug}' not found`);
    }
    return category;
  }
}
