import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';

export const CART_REPOSITORY = Symbol('CART_REPOSITORY');

export interface ICartRepository {
  findByUserId(userId: string): Promise<Cart | null>;
  findOrCreate(userId: string): Promise<Cart>;
  addItem(cartId: string, item: CartItem): Promise<Cart>;
  updateItemQuantity(
    cartId: string,
    itemId: string,
    quantity: number,
  ): Promise<Cart>;
  removeItem(cartId: string, itemId: string): Promise<Cart>;
  clear(cartId: string): Promise<void>;
}
