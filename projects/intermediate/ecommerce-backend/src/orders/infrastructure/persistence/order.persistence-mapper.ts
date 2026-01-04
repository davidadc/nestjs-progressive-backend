import { Injectable } from '@nestjs/common';
import { Order, OrderStatus } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { OrderOrmEntity, OrderStatus as OrmOrderStatus } from './order.orm-entity';
import { OrderItemOrmEntity } from './order-item.orm-entity';
import type { Address } from '../../../auth/domain/value-objects/address.value-object';

@Injectable()
export class OrderPersistenceMapper {
  toDomain(entity: OrderOrmEntity): Order {
    const items = (entity.items ?? []).map(
      (item) =>
        new OrderItem(
          item.id,
          item.orderId,
          item.productId,
          item.productName,
          item.quantity,
          Number(item.priceAtTime),
          item.createdAt,
        ),
    );

    return new Order(
      entity.id,
      entity.userId,
      items,
      Number(entity.total),
      entity.status as unknown as OrderStatus,
      entity.shippingAddress as Address,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  toOrm(domain: Order): OrderOrmEntity {
    const entity = new OrderOrmEntity();
    entity.id = domain.id;
    entity.userId = domain.userId;
    entity.status = domain.status as unknown as OrmOrderStatus;
    entity.total = domain.total;
    entity.shippingAddress = domain.shippingAddress;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }

  itemToOrm(domain: OrderItem): OrderItemOrmEntity {
    const entity = new OrderItemOrmEntity();
    entity.id = domain.id;
    entity.orderId = domain.orderId;
    entity.productId = domain.productId;
    entity.productName = domain.productName;
    entity.quantity = domain.quantity;
    entity.priceAtTime = domain.priceAtTime;
    entity.createdAt = domain.createdAt;
    return entity;
  }
}
