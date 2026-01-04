import { Injectable } from '@nestjs/common';
import { Product } from '../../domain/entities/product.entity';
import { ProductOrmEntity } from '../../infrastructure/persistence/product.orm-entity';
import { ProductResponseDto } from '../dto/product-response.dto';
import { CategoryMapper } from './category.mapper';

@Injectable()
export class ProductMapper {
  constructor(private readonly categoryMapper: CategoryMapper) {}

  toDomain(ormEntity: ProductOrmEntity): Product {
    return new Product(
      ormEntity.id,
      ormEntity.name,
      ormEntity.description,
      Number(ormEntity.price),
      ormEntity.stock,
      ormEntity.categoryId,
      ormEntity.category
        ? this.categoryMapper.toDomain(ormEntity.category)
        : null,
      ormEntity.images || [],
      ormEntity.isActive,
      ormEntity.createdAt,
      ormEntity.updatedAt,
      ormEntity.deletedAt,
    );
  }

  toOrmEntity(domain: Product): Partial<ProductOrmEntity> {
    return {
      id: domain.id,
      name: domain.name,
      description: domain.description,
      price: domain.price,
      stock: domain.stock,
      categoryId: domain.categoryId,
      images: domain.images,
      isActive: domain.isActive,
    };
  }

  toResponseDto(domain: Product): ProductResponseDto {
    return {
      id: domain.id,
      name: domain.name,
      description: domain.description,
      price: domain.price,
      stock: domain.stock,
      categoryId: domain.categoryId,
      category: domain.category
        ? this.categoryMapper.toResponseDto(domain.category)
        : undefined,
      images: domain.images,
      isActive: domain.isActive,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
