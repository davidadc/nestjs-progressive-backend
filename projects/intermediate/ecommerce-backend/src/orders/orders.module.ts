import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderOrmEntity } from './infrastructure/persistence/order.orm-entity';
import { OrderItemOrmEntity } from './infrastructure/persistence/order-item.orm-entity';
import { OrderRepository } from './infrastructure/persistence/order.repository';
import { OrderPersistenceMapper } from './infrastructure/persistence/order.persistence-mapper';
import { OrdersService } from './application/services/orders.service';
import { CreateOrderUseCase } from './application/use-cases/create-order.use-case';
import { OrderMapper } from './application/mappers/order.mapper';
import { OrdersController } from './infrastructure/controllers/orders.controller';
import { ORDER_REPOSITORY } from './domain/repositories/order.repository.interface';
import { ProductsModule } from '../products/products.module';
import { CartModule } from '../cart/cart.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderOrmEntity, OrderItemOrmEntity]),
    ProductsModule,
    CartModule,
    AuthModule,
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    CreateOrderUseCase,
    OrderMapper,
    OrderPersistenceMapper,
    {
      provide: ORDER_REPOSITORY,
      useClass: OrderRepository,
    },
  ],
  exports: [ORDER_REPOSITORY],
})
export class OrdersModule {}
