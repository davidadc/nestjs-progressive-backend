import { Injectable } from '@nestjs/common';
import { Category } from '../../domain/entities/category.entity';
import { CategoryOrmEntity } from '../../infrastructure/persistence/category.orm-entity';
import { CategoryResponseDto } from '../dto/category-response.dto';

@Injectable()
export class CategoryMapper {
  toDomain(ormEntity: CategoryOrmEntity): Category {
    return new Category(
      ormEntity.id,
      ormEntity.name,
      ormEntity.slug,
      ormEntity.description,
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }

  toOrmEntity(domain: Category): Partial<CategoryOrmEntity> {
    return {
      id: domain.id,
      name: domain.name,
      slug: domain.slug,
      description: domain.description ?? undefined,
    };
  }

  toResponseDto(domain: Category): CategoryResponseDto {
    return {
      id: domain.id,
      name: domain.name,
      slug: domain.slug,
      description: domain.description,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
