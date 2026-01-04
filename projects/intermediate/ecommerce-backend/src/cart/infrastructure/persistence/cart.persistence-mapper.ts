import { Injectable } from '@nestjs/common';
import { Cart } from '../../domain/entities/cart.entity';
import { CartItem } from '../../domain/entities/cart-item.entity';
import { CartOrmEntity } from './cart.orm-entity';
import { CartItemOrmEntity } from './cart-item.orm-entity';

@Injectable()
export class CartPersistenceMapper {
  toDomain(entity: CartOrmEntity): Cart {
    const items = (entity.items ?? []).map(
      (item) =>
        new CartItem(
          item.id,
          item.cartId,
          item.productId,
          item.productName,
          item.price,
          item.quantity,
          item.createdAt,
          item.updatedAt,
        ),
    );

    return new Cart(
      entity.id,
      entity.userId,
      items,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  toOrm(domain: Cart): CartOrmEntity {
    const entity = new CartOrmEntity();
    entity.id = domain.id;
    entity.userId = domain.userId;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }

  itemToOrm(domain: CartItem): CartItemOrmEntity {
    const entity = new CartItemOrmEntity();
    entity.id = domain.id;
    entity.cartId = domain.cartId;
    entity.productId = domain.productId;
    entity.productName = domain.productName;
    entity.price = domain.price;
    entity.quantity = domain.quantity;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }
}
