import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import type { ICartRepository } from '../../domain/repositories/cart.repository.interface';
import { Cart } from '../../domain/entities/cart.entity';
import { CartItem } from '../../domain/entities/cart-item.entity';
import { CartOrmEntity } from './cart.orm-entity';
import { CartItemOrmEntity } from './cart-item.orm-entity';
import { CartPersistenceMapper } from './cart.persistence-mapper';

@Injectable()
export class CartRepository implements ICartRepository {
  constructor(
    @InjectRepository(CartOrmEntity)
    private readonly cartRepository: Repository<CartOrmEntity>,
    @InjectRepository(CartItemOrmEntity)
    private readonly cartItemRepository: Repository<CartItemOrmEntity>,
    private readonly mapper: CartPersistenceMapper,
  ) {}

  async findByUserId(userId: string): Promise<Cart | null> {
    const entity = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items'],
    });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findOrCreate(userId: string): Promise<Cart> {
    let cart = await this.findByUserId(userId);
    if (!cart) {
      const newCart = new CartOrmEntity();
      newCart.id = uuidv4();
      newCart.userId = userId;
      const saved = await this.cartRepository.save(newCart);
      const loaded = await this.cartRepository.findOne({
        where: { id: saved.id },
        relations: ['items'],
      });
      cart = this.mapper.toDomain(loaded!);
    }
    return cart;
  }

  async addItem(cartId: string, item: CartItem): Promise<Cart> {
    const itemEntity = this.mapper.itemToOrm(item);
    await this.cartItemRepository.save(itemEntity);

    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: ['items'],
    });
    return this.mapper.toDomain(cart!);
  }

  async updateItemQuantity(
    cartId: string,
    itemId: string,
    quantity: number,
  ): Promise<Cart> {
    await this.cartItemRepository.update(
      { id: itemId, cartId },
      { quantity, updatedAt: new Date() },
    );

    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: ['items'],
    });
    return this.mapper.toDomain(cart!);
  }

  async removeItem(cartId: string, itemId: string): Promise<Cart> {
    await this.cartItemRepository.delete({ id: itemId, cartId });

    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: ['items'],
    });
    return this.mapper.toDomain(cart!);
  }

  async clear(cartId: string): Promise<void> {
    await this.cartItemRepository.delete({ cartId });
  }
}
