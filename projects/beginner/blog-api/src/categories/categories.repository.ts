import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesRepository {
  constructor(
    @InjectRepository(Category)
    private readonly repository: Repository<Category>,
  ) {}

  async create(data: Partial<Category>): Promise<Category> {
    const category = this.repository.create(data);
    return this.repository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.repository.find({
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Category | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return this.repository.findOne({ where: { slug } });
  }

  async findBySlugWithPosts(slug: string): Promise<Category | null> {
    return this.repository.findOne({
      where: { slug },
      relations: ['posts', 'posts.author'],
    });
  }

  async findAllSlugs(): Promise<string[]> {
    const categories = await this.repository.find({ select: ['slug'] });
    return categories.map((c) => c.slug);
  }

  async update(id: string, data: Partial<Category>): Promise<Category | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
