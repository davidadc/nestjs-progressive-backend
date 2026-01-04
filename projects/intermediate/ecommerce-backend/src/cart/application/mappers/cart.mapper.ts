import { Injectable } from '@nestjs/common';
import { Cart } from '../../domain/entities/cart.entity';
import { CartItem } from '../../domain/entities/cart-item.entity';
import { CartOrmEntity } from '../../infrastructure/persistence/cart.orm-entity';
import { CartItemOrmEntity } from '../../infrastructure/persistence/cart-item.orm-entity';
import { CartResponseDto, CartItemResponseDto } from '../dto/cart-response.dto';

@Injectable()
export class CartMapper {
  toDomain(ormEntity: CartOrmEntity): Cart {
    const items = (ormEntity.items || []).map((item) =>
      this.cartItemToDomain(item),
    );

    return new Cart(
      ormEntity.id,
      ormEntity.userId,
      items,
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }

  cartItemToDomain(ormEntity: CartItemOrmEntity): CartItem {
    return new CartItem(
      ormEntity.id,
      ormEntity.cartId,
      ormEntity.productId,
      ormEntity.product?.name || '',
      Number(ormEntity.product?.price || 0),
      ormEntity.quantity,
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }

  toResponseDto(domain: Cart): CartResponseDto {
    return {
      id: domain.id,
      userId: domain.userId,
      items: domain.items.map((item) => this.cartItemToResponseDto(item)),
      total: domain.getTotal(),
      itemCount: domain.getItemCount(),
    };
  }

  cartItemToResponseDto(domain: CartItem): CartItemResponseDto {
    return {
      id: domain.id,
      productId: domain.productId,
      productName: domain.productName,
      price: domain.price,
      quantity: domain.quantity,
      subtotal: domain.getSubtotal(),
    };
  }
}
