import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartOrmEntity } from './infrastructure/persistence/cart.orm-entity';
import { CartItemOrmEntity } from './infrastructure/persistence/cart-item.orm-entity';
import { CartRepository } from './infrastructure/persistence/cart.repository';
import { CartPersistenceMapper } from './infrastructure/persistence/cart.persistence-mapper';
import { CartService } from './application/services/cart.service';
import { CartMapper } from './application/mappers/cart.mapper';
import { CartController } from './infrastructure/controllers/cart.controller';
import { CART_REPOSITORY } from './domain/repositories/cart.repository.interface';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CartOrmEntity, CartItemOrmEntity]),
    ProductsModule,
  ],
  controllers: [CartController],
  providers: [
    CartService,
    CartMapper,
    CartPersistenceMapper,
    {
      provide: CART_REPOSITORY,
      useClass: CartRepository,
    },
  ],
  exports: [CART_REPOSITORY],
})
export class CartModule {}
