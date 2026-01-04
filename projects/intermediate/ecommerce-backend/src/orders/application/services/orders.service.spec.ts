import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderMapper } from '../mappers/order.mapper';
import { CreateOrderUseCase } from '../use-cases/create-order.use-case';
import { ORDER_REPOSITORY } from '../../domain/repositories/order.repository.interface';
import { Order, OrderStatus } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepository: Record<string, jest.Mock>;
  let orderMapper: { toResponseDto: jest.Mock };
  let createOrderUseCase: { execute: jest.Mock };

  const mockOrderItem = new OrderItem(
    'item-id',
    'order-id',
    'prod-id',
    'Laptop',
    1,
    999.99,
    new Date(),
  );

  const mockShippingAddress = {
    id: 'addr-id',
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
    isDefault: true,
  };

  const mockOrder = new Order(
    'order-id',
    'user-id',
    [mockOrderItem],
    999.99,
    OrderStatus.PENDING,
    mockShippingAddress,
    new Date(),
    new Date(),
  );

  beforeEach(async () => {
    orderRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
    };

    orderMapper = {
      toResponseDto: jest.fn().mockImplementation((order: Order) => ({
        id: order.id,
        userId: order.userId,
        items: order.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          priceAtTime: item.priceAtTime,
          subtotal: item.getSubtotal(),
        })),
        total: order.total,
        status: order.status,
        shippingAddress: order.shippingAddress,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })),
    };

    createOrderUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: ORDER_REPOSITORY, useValue: orderRepository },
        { provide: OrderMapper, useValue: orderMapper },
        { provide: CreateOrderUseCase, useValue: createOrderUseCase },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should delegate to CreateOrderUseCase', async () => {
      const createDto = { shippingAddressId: 'addr-id' };
      const expectedResponse = {
        id: 'order-id',
        userId: 'user-id',
        items: [],
        total: 999.99,
        status: OrderStatus.PENDING,
      };
      createOrderUseCase.execute.mockResolvedValue(expectedResponse);

      const result = await service.createOrder('user-id', createDto);

      expect(createOrderUseCase.execute).toHaveBeenCalledWith(
        'user-id',
        createDto,
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getOrders', () => {
    it('should return paginated orders for user', async () => {
      orderRepository.findByUserId.mockResolvedValue({
        orders: [mockOrder],
        total: 1,
      });

      const result = await service.getOrders('user-id', 1, 10);

      expect(orderRepository.findByUserId).toHaveBeenCalledWith('user-id', {
        page: 1,
        limit: 10,
      });
      expect(result).toHaveProperty('orders');
      expect(result).toHaveProperty('total', 1);
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('limit', 10);
      expect(result).toHaveProperty('pages', 1);
    });

    it('should use default pagination values', async () => {
      orderRepository.findByUserId.mockResolvedValue({
        orders: [],
        total: 0,
      });

      await service.getOrders('user-id');

      expect(orderRepository.findByUserId).toHaveBeenCalledWith('user-id', {
        page: 1,
        limit: 10,
      });
    });
  });

  describe('getOrderById', () => {
    it('should return order if found and owned by user', async () => {
      orderRepository.findById.mockResolvedValue(mockOrder);

      const result = await service.getOrderById('user-id', 'order-id');

      expect(orderRepository.findById).toHaveBeenCalledWith('order-id');
      expect(orderMapper.toResponseDto).toHaveBeenCalledWith(mockOrder);
      expect(result).toHaveProperty('id', 'order-id');
    });

    it('should throw NotFoundException if order not found', async () => {
      orderRepository.findById.mockResolvedValue(null);

      await expect(
        service.getOrderById('user-id', 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if order belongs to different user', async () => {
      const otherUserOrder = new Order(
        'order-id',
        'other-user-id',
        [mockOrderItem],
        999.99,
        OrderStatus.PENDING,
        mockShippingAddress,
        new Date(),
        new Date(),
      );
      orderRepository.findById.mockResolvedValue(otherUserOrder);

      await expect(service.getOrderById('user-id', 'order-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
