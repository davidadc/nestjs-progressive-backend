import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { ICartRepository } from '../../domain/repositories/cart.repository.interface';
import { CART_REPOSITORY } from '../../domain/repositories/cart.repository.interface';
import type { IProductRepository } from '../../../products/domain/repositories/product.repository.interface';
import { PRODUCT_REPOSITORY } from '../../../products/domain/repositories/product.repository.interface';
import { CartItem } from '../../domain/entities/cart-item.entity';
import { AddToCartDto, UpdateCartItemDto } from '../dto/add-to-cart.dto';
import { CartResponseDto } from '../dto/cart-response.dto';
import { CartMapper } from '../mappers/cart.mapper';

@Injectable()
export class CartService {
  constructor(
    @Inject(CART_REPOSITORY)
    private readonly cartRepository: ICartRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    private readonly cartMapper: CartMapper,
  ) {}

  async getCart(userId: string): Promise<CartResponseDto> {
    const cart = await this.cartRepository.findOrCreate(userId);
    return this.cartMapper.toResponseDto(cart);
  }

  async addItem(userId: string, dto: AddToCartDto): Promise<CartResponseDto> {
    const product = await this.productRepository.findById(dto.productId);
    if (!product) {
      throw new NotFoundException(`Product with ID ${dto.productId} not found`);
    }

    if (!product.isInStock()) {
      throw new BadRequestException('Product is not available');
    }

    if (!product.hasEnoughStock(dto.quantity)) {
      throw new BadRequestException(
        `Not enough stock. Available: ${product.stock}`,
      );
    }

    const cart = await this.cartRepository.findOrCreate(userId);

    const existingItem = cart.findItem(dto.productId);
    if (existingItem) {
      const newQuantity = existingItem.quantity + dto.quantity;
      if (!product.hasEnoughStock(newQuantity)) {
        throw new BadRequestException(
          `Not enough stock. Available: ${product.stock}`,
        );
      }
      const updatedCart = await this.cartRepository.updateItemQuantity(
        cart.id,
        existingItem.id,
        newQuantity,
      );
      return this.cartMapper.toResponseDto(updatedCart);
    }

    const newItem = CartItem.create({
      id: uuidv4(),
      cartId: cart.id,
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: dto.quantity,
    });

    const updatedCart = await this.cartRepository.addItem(cart.id, newItem);
    return this.cartMapper.toResponseDto(updatedCart);
  }

  async updateItemQuantity(
    userId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const item = cart.items.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException(`Cart item with ID ${itemId} not found`);
    }

    const product = await this.productRepository.findById(item.productId);
    if (!product || !product.hasEnoughStock(dto.quantity)) {
      throw new BadRequestException(
        `Not enough stock. Available: ${product?.stock ?? 0}`,
      );
    }

    const updatedCart = await this.cartRepository.updateItemQuantity(
      cart.id,
      itemId,
      dto.quantity,
    );
    return this.cartMapper.toResponseDto(updatedCart);
  }

  async removeItem(userId: string, itemId: string): Promise<CartResponseDto> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const item = cart.items.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException(`Cart item with ID ${itemId} not found`);
    }

    const updatedCart = await this.cartRepository.removeItem(cart.id, itemId);
    return this.cartMapper.toResponseDto(updatedCart);
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (cart) {
      await this.cartRepository.clear(cart.id);
    }
  }
}
