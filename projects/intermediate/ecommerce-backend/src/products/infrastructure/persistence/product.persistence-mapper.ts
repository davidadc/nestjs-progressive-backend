import { Injectable } from '@nestjs/common';
import { Product } from '../../domain/entities/product.entity';
import { Category } from '../../domain/entities/category.entity';
import { ProductOrmEntity } from './product.orm-entity';

@Injectable()
export class ProductPersistenceMapper {
  toDomain(entity: ProductOrmEntity): Product {
    const category = entity.category
      ? new Category(
          entity.category.id,
          entity.category.name,
          entity.category.slug,
          entity.category.description,
          entity.category.createdAt,
          entity.category.updatedAt,
        )
      : null;

    return new Product(
      entity.id,
      entity.name,
      entity.description,
      Number(entity.price),
      entity.stock,
      entity.categoryId,
      category,
      entity.images,
      entity.isActive,
      entity.createdAt,
      entity.updatedAt,
      entity.deletedAt ?? null,
    );
  }

  toOrm(domain: Product): ProductOrmEntity {
    const entity = new ProductOrmEntity();
    entity.id = domain.id;
    entity.name = domain.name;
    entity.description = domain.description;
    entity.price = domain.price;
    entity.stock = domain.stock;
    entity.categoryId = domain.categoryId;
    entity.images = domain.images;
    entity.isActive = domain.isActive;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    if (domain.deletedAt) {
      entity.deletedAt = domain.deletedAt;
    }
    return entity;
  }
}
