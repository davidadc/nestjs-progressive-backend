import { Order, OrderStatus } from '../entities/order.entity';

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');

export interface FindOrdersOptions {
  userId?: string;
  status?: OrderStatus;
  page?: number;
  limit?: number;
}

export interface PaginatedOrders {
  orders: Order[];
  total: number;
}

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  findByUserId(
    userId: string,
    options?: FindOrdersOptions,
  ): Promise<PaginatedOrders>;
  save(order: Order): Promise<Order>;
  updateStatus(id: string, status: OrderStatus): Promise<Order>;
}
