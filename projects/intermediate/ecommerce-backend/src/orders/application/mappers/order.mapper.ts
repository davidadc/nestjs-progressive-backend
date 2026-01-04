import { Injectable } from '@nestjs/common';
import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { OrderOrmEntity } from '../../infrastructure/persistence/order.orm-entity';
import { OrderItemOrmEntity } from '../../infrastructure/persistence/order-item.orm-entity';
import {
  OrderResponseDto,
  OrderItemResponseDto,
} from '../dto/order-response.dto';

@Injectable()
export class OrderMapper {
  toDomain(ormEntity: OrderOrmEntity): Order {
    const items = (ormEntity.items || []).map((item) =>
      this.orderItemToDomain(item),
    );

    return new Order(
      ormEntity.id,
      ormEntity.userId,
      items,
      Number(ormEntity.total),
      ormEntity.status,
      ormEntity.shippingAddress,
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }

  orderItemToDomain(ormEntity: OrderItemOrmEntity): OrderItem {
    return new OrderItem(
      ormEntity.id,
      ormEntity.orderId,
      ormEntity.productId,
      ormEntity.product?.name || '',
      ormEntity.quantity,
      Number(ormEntity.priceAtTime),
      ormEntity.createdAt,
    );
  }

  toResponseDto(domain: Order): OrderResponseDto {
    return {
      id: domain.id,
      userId: domain.userId,
      items: domain.items.map((item) => this.orderItemToResponseDto(item)),
      total: domain.total,
      status: domain.status,
      shippingAddress: domain.shippingAddress,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  orderItemToResponseDto(domain: OrderItem): OrderItemResponseDto {
    return {
      id: domain.id,
      productId: domain.productId,
      productName: domain.productName,
      quantity: domain.quantity,
      priceAtTime: domain.priceAtTime,
      subtotal: domain.getSubtotal(),
    };
  }
}
