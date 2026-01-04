import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  IOrderRepository,
  FindOrdersOptions,
  PaginatedOrders,
} from '../../domain/repositories/order.repository.interface';
import { Order } from '../../domain/entities/order.entity';
import { OrderOrmEntity } from './order.orm-entity';
import { OrderItemOrmEntity } from './order-item.orm-entity';
import { OrderPersistenceMapper } from './order.persistence-mapper';

@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor(
    @InjectRepository(OrderOrmEntity)
    private readonly orderRepository: Repository<OrderOrmEntity>,
    @InjectRepository(OrderItemOrmEntity)
    private readonly orderItemRepository: Repository<OrderItemOrmEntity>,
    private readonly mapper: OrderPersistenceMapper,
  ) {}

  async findById(id: string): Promise<Order | null> {
    const entity = await this.orderRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByUserId(
    userId: string,
    options: FindOrdersOptions,
  ): Promise<PaginatedOrders> {
    const { page = 1, limit = 10 } = options;

    const [entities, total] = await this.orderRepository.findAndCount({
      where: { userId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      orders: entities.map((e) => this.mapper.toDomain(e)),
      total,
    };
  }

  async save(order: Order): Promise<Order> {
    const orderEntity = this.mapper.toOrm(order);
    const savedOrder = await this.orderRepository.save(orderEntity);

    // Save order items
    const itemEntities = order.items.map((item) => this.mapper.itemToOrm(item));
    await this.orderItemRepository.save(itemEntities);

    const loaded = await this.orderRepository.findOne({
      where: { id: savedOrder.id },
      relations: ['items'],
    });
    return this.mapper.toDomain(loaded!);
  }

  async updateStatus(id: string, status: string): Promise<Order> {
    await this.orderRepository
      .createQueryBuilder()
      .update()
      .set({ status: () => `'${status}'`, updatedAt: new Date() })
      .where('id = :id', { id })
      .execute();

    const loaded = await this.orderRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    return this.mapper.toDomain(loaded!);
  }
}
