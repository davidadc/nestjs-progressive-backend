import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { Category } from '../../domain/entities/category.entity';
import { CategoryOrmEntity } from './category.orm-entity';
import { CategoryPersistenceMapper } from './category.persistence-mapper';

@Injectable()
export class CategoryRepository implements ICategoryRepository {
  constructor(
    @InjectRepository(CategoryOrmEntity)
    private readonly repository: Repository<CategoryOrmEntity>,
    private readonly mapper: CategoryPersistenceMapper,
  ) {}

  async findAll(): Promise<Category[]> {
    const entities = await this.repository.find({
      order: { name: 'ASC' },
    });
    return entities.map((e) => this.mapper.toDomain(e));
  }

  async findById(id: string): Promise<Category | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const entity = await this.repository.findOne({ where: { slug } });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async save(category: Category): Promise<Category> {
    const entity = this.mapper.toOrm(category);
    const saved = await this.repository.save(entity);
    return this.mapper.toDomain(saved);
  }

  async update(category: Category): Promise<Category> {
    const entity = this.mapper.toOrm(category);
    const saved = await this.repository.save(entity);
    return this.mapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
