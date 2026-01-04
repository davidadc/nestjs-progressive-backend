import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import type {
  IProductRepository,
  FindProductsOptions,
  PaginatedProducts,
} from '../../domain/repositories/product.repository.interface';
import { Product } from '../../domain/entities/product.entity';
import { ProductOrmEntity } from './product.orm-entity';
import { ProductPersistenceMapper } from './product.persistence-mapper';

@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly repository: Repository<ProductOrmEntity>,
    private readonly mapper: ProductPersistenceMapper,
  ) {}

  async findAll(options: FindProductsOptions): Promise<PaginatedProducts> {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      minPrice,
      maxPrice,
      isActive,
      sort = 'createdAt',
      order = 'DESC',
    } = options;

    const qb = this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.deletedAt IS NULL');

    if (search) {
      qb.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (categoryId) {
      qb.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    if (minPrice !== undefined) {
      qb.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    if (isActive !== undefined) {
      qb.andWhere('product.isActive = :isActive', { isActive });
    }

    const validSortFields = ['createdAt', 'name', 'price', 'stock'];
    const sortField = validSortFields.includes(sort) ? sort : 'createdAt';
    qb.orderBy(`product.${sortField}`, order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');

    const [entities, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      products: entities.map((e) => this.mapper.toDomain(e)),
      total,
    };
  }

  async findById(id: string): Promise<Product | null> {
    const entity = await this.repository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['category'],
    });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async save(product: Product): Promise<Product> {
    const entity = this.mapper.toOrm(product);
    const saved = await this.repository.save(entity);
    const loaded = await this.repository.findOne({
      where: { id: saved.id },
      relations: ['category'],
    });
    return this.mapper.toDomain(loaded!);
  }

  async update(product: Product): Promise<Product> {
    const entity = this.mapper.toOrm(product);
    const saved = await this.repository.save(entity);
    const loaded = await this.repository.findOne({
      where: { id: saved.id },
      relations: ['category'],
    });
    return this.mapper.toDomain(loaded!);
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.update(id, { deletedAt: new Date() });
  }

  async updateStock(id: string, quantityChange: number): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(ProductOrmEntity)
      .set({ stock: () => `stock + ${quantityChange}` })
      .where('id = :id', { id })
      .execute();
  }
}
