import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { ORDER_REPOSITORY } from '../../domain/repositories/order.repository.interface';
import { CreateOrderDto } from '../dto/create-order.dto';
import {
  OrderResponseDto,
  PaginatedOrdersResponseDto,
} from '../dto/order-response.dto';
import { OrderMapper } from '../mappers/order.mapper';
import { CreateOrderUseCase } from '../use-cases/create-order.use-case';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    private readonly orderMapper: OrderMapper,
    private readonly createOrderUseCase: CreateOrderUseCase,
  ) {}

  async createOrder(
    userId: string,
    dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    return this.createOrderUseCase.execute(userId, dto);
  }

  async getOrders(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedOrdersResponseDto> {
    const { orders, total } = await this.orderRepository.findByUserId(userId, {
      page,
      limit,
    });

    return {
      orders: orders.map((order) => this.orderMapper.toResponseDto(order)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async getOrderById(
    userId: string,
    orderId: string,
  ): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Ensure user owns this order
    if (order.userId !== userId) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    return this.orderMapper.toResponseDto(order);
  }
}
