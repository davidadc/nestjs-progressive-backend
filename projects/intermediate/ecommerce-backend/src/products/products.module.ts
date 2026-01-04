import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductOrmEntity } from './infrastructure/persistence/product.orm-entity';
import { CategoryOrmEntity } from './infrastructure/persistence/category.orm-entity';
import { ProductRepository } from './infrastructure/persistence/product.repository';
import { CategoryRepository } from './infrastructure/persistence/category.repository';
import { ProductPersistenceMapper } from './infrastructure/persistence/product.persistence-mapper';
import { CategoryPersistenceMapper } from './infrastructure/persistence/category.persistence-mapper';
import { ProductsService } from './application/services/products.service';
import { CategoriesService } from './application/services/categories.service';
import { ProductMapper } from './application/mappers/product.mapper';
import { CategoryMapper } from './application/mappers/category.mapper';
import { ProductsController } from './infrastructure/controllers/products.controller';
import { CategoriesController } from './infrastructure/controllers/categories.controller';
import { PRODUCT_REPOSITORY } from './domain/repositories/product.repository.interface';
import { CATEGORY_REPOSITORY } from './domain/repositories/category.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([ProductOrmEntity, CategoryOrmEntity])],
  controllers: [ProductsController, CategoriesController],
  providers: [
    ProductsService,
    CategoriesService,
    ProductMapper,
    CategoryMapper,
    ProductPersistenceMapper,
    CategoryPersistenceMapper,
    {
      provide: PRODUCT_REPOSITORY,
      useClass: ProductRepository,
    },
    {
      provide: CATEGORY_REPOSITORY,
      useClass: CategoryRepository,
    },
  ],
  exports: [PRODUCT_REPOSITORY, CATEGORY_REPOSITORY],
})
export class ProductsModule {}
