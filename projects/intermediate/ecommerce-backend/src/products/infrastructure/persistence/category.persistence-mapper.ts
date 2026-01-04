import { Injectable } from '@nestjs/common';
import { Category } from '../../domain/entities/category.entity';
import { CategoryOrmEntity } from './category.orm-entity';

@Injectable()
export class CategoryPersistenceMapper {
  toDomain(entity: CategoryOrmEntity): Category {
    return new Category(
      entity.id,
      entity.name,
      entity.slug,
      entity.description,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  toOrm(domain: Category): CategoryOrmEntity {
    const entity = new CategoryOrmEntity();
    entity.id = domain.id;
    entity.name = domain.name;
    entity.slug = domain.slug;
    entity.description = domain.description ?? '';
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }
}
