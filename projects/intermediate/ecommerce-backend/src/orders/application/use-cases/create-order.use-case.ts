import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import type { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { ORDER_REPOSITORY } from '../../domain/repositories/order.repository.interface';
import type { ICartRepository } from '../../../cart/domain/repositories/cart.repository.interface';
import { CART_REPOSITORY } from '../../../cart/domain/repositories/cart.repository.interface';
import type { IProductRepository } from '../../../products/domain/repositories/product.repository.interface';
import { PRODUCT_REPOSITORY } from '../../../products/domain/repositories/product.repository.interface';
import type { IUserRepository } from '../../../auth/domain/repositories/user.repository.interface';
import { USER_REPOSITORY } from '../../../auth/domain/repositories/user.repository.interface';
import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderResponseDto } from '../dto/order-response.dto';
import { OrderMapper } from '../mappers/order.mapper';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(CART_REPOSITORY)
    private readonly cartRepository: ICartRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly orderMapper: OrderMapper,
    private readonly dataSource: DataSource,
  ) {}

  async execute(userId: string, dto: CreateOrderDto): Promise<OrderResponseDto> {
    // Get user for address
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get shipping address
    let shippingAddress = user.getDefaultAddress();
    if (dto.shippingAddressId) {
      shippingAddress = user.getAddressById(dto.shippingAddressId);
    }

    if (!shippingAddress) {
      throw new BadRequestException('No shipping address available');
    }

    // Get cart
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart || cart.isEmpty()) {
      throw new BadRequestException('Cart is empty');
    }

    // Validate stock for all items
    const orderItems: OrderItem[] = [];
    const orderId = uuidv4();

    for (const cartItem of cart.items) {
      const product = await this.productRepository.findById(cartItem.productId);

      if (!product) {
        throw new BadRequestException(
          `Product ${cartItem.productId} no longer exists`,
        );
      }

      if (!product.isInStock()) {
        throw new BadRequestException(`Product "${product.name}" is not available`);
      }

      if (!product.hasEnoughStock(cartItem.quantity)) {
        throw new BadRequestException(
          `Not enough stock for "${product.name}". Available: ${product.stock}`,
        );
      }

      orderItems.push(
        OrderItem.create({
          id: uuidv4(),
          orderId,
          productId: product.id,
          productName: product.name,
          quantity: cartItem.quantity,
          priceAtTime: product.price,
        }),
      );
    }

    // Create order
    const order = Order.create({
      id: orderId,
      userId,
      items: orderItems,
      shippingAddress,
    });

    // Use transaction to save order and reduce stock
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Save order
      const savedOrder = await this.orderRepository.save(order);

      // Reduce stock for each item
      for (const item of orderItems) {
        await this.productRepository.updateStock(item.productId, -item.quantity);
      }

      // Clear cart
      await this.cartRepository.clear(cart.id);

      await queryRunner.commitTransaction();

      return this.orderMapper.toResponseDto(savedOrder);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
