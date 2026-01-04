import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { CATEGORY_REPOSITORY } from '../../domain/repositories/category.repository.interface';
import { Category } from '../../domain/entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/create-category.dto';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { CategoryMapper } from '../mappers/category.mapper';

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
    private readonly categoryMapper: CategoryMapper,
  ) {}

  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.findAll();
    return categories.map((cat) => this.categoryMapper.toResponseDto(cat));
  }

  async findById(id: string): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return this.categoryMapper.toResponseDto(category);
  }

  async create(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const slug = Category.generateSlug(dto.name);

    const existingCategory = await this.categoryRepository.findBySlug(slug);
    if (existingCategory) {
      throw new ConflictException(`Category with slug "${slug}" already exists`);
    }

    const category = Category.create({
      id: uuidv4(),
      name: dto.name,
      slug,
      description: dto.description,
    });

    const savedCategory = await this.categoryRepository.save(category);
    return this.categoryMapper.toResponseDto(savedCategory);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const existingCategory = await this.categoryRepository.findById(id);
    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    let slug = existingCategory.slug;
    if (dto.name && dto.name !== existingCategory.name) {
      slug = Category.generateSlug(dto.name);
      const categoryWithSlug = await this.categoryRepository.findBySlug(slug);
      if (categoryWithSlug && categoryWithSlug.id !== id) {
        throw new ConflictException(`Category with slug "${slug}" already exists`);
      }
    }

    const updatedCategory = new Category(
      existingCategory.id,
      dto.name ?? existingCategory.name,
      slug,
      dto.description !== undefined ? dto.description : existingCategory.description,
      existingCategory.createdAt,
      new Date(),
    );

    const savedCategory = await this.categoryRepository.update(updatedCategory);
    return this.categoryMapper.toResponseDto(savedCategory);
  }

  async delete(id: string): Promise<void> {
    const existingCategory = await this.categoryRepository.findById(id);
    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    await this.categoryRepository.delete(id);
  }
}
