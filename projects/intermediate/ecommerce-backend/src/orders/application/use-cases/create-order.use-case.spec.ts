import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { CreateOrderUseCase } from './create-order.use-case';
import { OrderMapper } from '../mappers/order.mapper';
import { ORDER_REPOSITORY } from '../../domain/repositories/order.repository.interface';
import { CART_REPOSITORY } from '../../../cart/domain/repositories/cart.repository.interface';
import { PRODUCT_REPOSITORY } from '../../../products/domain/repositories/product.repository.interface';
import { USER_REPOSITORY } from '../../../auth/domain/repositories/user.repository.interface';
import { Order, OrderStatus } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { Cart } from '../../../cart/domain/entities/cart.entity';
import { CartItem } from '../../../cart/domain/entities/cart-item.entity';
import { Product } from '../../../products/domain/entities/product.entity';
import { User } from '../../../auth/domain/entities/user.entity';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid'),
}));

describe('CreateOrderUseCase', () => {
  let useCase: CreateOrderUseCase;
  let orderRepository: Record<string, jest.Mock>;
  let cartRepository: Record<string, jest.Mock>;
  let productRepository: Record<string, jest.Mock>;
  let userRepository: Record<string, jest.Mock>;
  let orderMapper: { toResponseDto: jest.Mock };
  let dataSource: { createQueryRunner: jest.Mock };
  let queryRunner: Partial<QueryRunner>;

  const mockAddress = {
    id: 'addr-id',
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
    isDefault: true,
  };

  const mockUser = new User(
    'user-id',
    'test@example.com',
    'hashed-password',
    'Test User',
    'customer',
    [mockAddress],
    new Date(),
    new Date(),
  );

  const mockProduct = new Product(
    'prod-id',
    'Laptop',
    'A great laptop',
    999.99,
    10,
    'cat-id',
    undefined,
    [],
    true,
    new Date(),
    new Date(),
    undefined,
  );

  const mockCartItem = new CartItem(
    'item-id',
    'cart-id',
    'prod-id',
    'Laptop',
    999.99,
    2,
    new Date(),
    new Date(),
  );

  const mockCart = new Cart(
    'cart-id',
    'user-id',
    [mockCartItem],
    new Date(),
    new Date(),
  );

  const emptyCart = new Cart('cart-id', 'user-id', [], new Date(), new Date());

  const mockOrderItem = new OrderItem(
    'order-item-id',
    'order-id',
    'prod-id',
    'Laptop',
    2,
    999.99,
    new Date(),
  );

  const mockOrder = new Order(
    'order-id',
    'user-id',
    [mockOrderItem],
    1999.98,
    OrderStatus.PENDING,
    mockAddress,
    new Date(),
    new Date(),
  );

  beforeEach(async () => {
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    };

    orderRepository = {
      save: jest.fn(),
    };

    cartRepository = {
      findByUserId: jest.fn(),
      clear: jest.fn(),
    };

    productRepository = {
      findById: jest.fn(),
      updateStock: jest.fn(),
    };

    userRepository = {
      findById: jest.fn(),
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

    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateOrderUseCase,
        { provide: ORDER_REPOSITORY, useValue: orderRepository },
        { provide: CART_REPOSITORY, useValue: cartRepository },
        { provide: PRODUCT_REPOSITORY, useValue: productRepository },
        { provide: USER_REPOSITORY, useValue: userRepository },
        { provide: OrderMapper, useValue: orderMapper },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    useCase = module.get<CreateOrderUseCase>(CreateOrderUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should create an order successfully', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      cartRepository.findByUserId.mockResolvedValue(mockCart);
      productRepository.findById.mockResolvedValue(mockProduct);
      orderRepository.save.mockResolvedValue(mockOrder);

      const result = await useCase.execute('user-id', {});

      expect(userRepository.findById).toHaveBeenCalledWith('user-id');
      expect(cartRepository.findByUserId).toHaveBeenCalledWith('user-id');
      expect(productRepository.findById).toHaveBeenCalledWith('prod-id');
      expect(orderRepository.save).toHaveBeenCalled();
      expect(productRepository.updateStock).toHaveBeenCalledWith('prod-id', -2);
      expect(cartRepository.clear).toHaveBeenCalledWith('cart-id');
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should use specific shipping address when provided', async () => {
      const userWithMultipleAddresses = new User(
        'user-id',
        'test@example.com',
        'hashed-password',
        'Test User',
        'customer',
        [
          mockAddress,
          { ...mockAddress, id: 'addr-2', isDefault: false, city: 'Boston' },
        ],
        new Date(),
        new Date(),
      );

      userRepository.findById.mockResolvedValue(userWithMultipleAddresses);
      cartRepository.findByUserId.mockResolvedValue(mockCart);
      productRepository.findById.mockResolvedValue(mockProduct);
      orderRepository.save.mockResolvedValue(mockOrder);

      await useCase.execute('user-id', { shippingAddressId: 'addr-2' });

      expect(orderRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('non-existent', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if no shipping address', async () => {
      const userWithoutAddresses = new User(
        'user-id',
        'test@example.com',
        'hashed-password',
        'Test User',
        'customer',
        [],
        new Date(),
        new Date(),
      );
      userRepository.findById.mockResolvedValue(userWithoutAddresses);

      await expect(useCase.execute('user-id', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if cart is empty', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      cartRepository.findByUserId.mockResolvedValue(emptyCart);

      await expect(useCase.execute('user-id', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if cart not found', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      cartRepository.findByUserId.mockResolvedValue(null);

      await expect(useCase.execute('user-id', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if product no longer exists', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      cartRepository.findByUserId.mockResolvedValue(mockCart);
      productRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('user-id', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if product is not in stock', async () => {
      const outOfStockProduct = new Product(
        'prod-id',
        'Laptop',
        'A great laptop',
        999.99,
        0,
        'cat-id',
        undefined,
        [],
        false,
        new Date(),
        new Date(),
        undefined,
      );
      userRepository.findById.mockResolvedValue(mockUser);
      cartRepository.findByUserId.mockResolvedValue(mockCart);
      productRepository.findById.mockResolvedValue(outOfStockProduct);

      await expect(useCase.execute('user-id', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if not enough stock', async () => {
      const lowStockProduct = new Product(
        'prod-id',
        'Laptop',
        'A great laptop',
        999.99,
        1, // Only 1 in stock, cart has 2
        'cat-id',
        undefined,
        [],
        true,
        new Date(),
        new Date(),
        undefined,
      );
      userRepository.findById.mockResolvedValue(mockUser);
      cartRepository.findByUserId.mockResolvedValue(mockCart);
      productRepository.findById.mockResolvedValue(lowStockProduct);

      await expect(useCase.execute('user-id', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should rollback transaction on error', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      cartRepository.findByUserId.mockResolvedValue(mockCart);
      productRepository.findById.mockResolvedValue(mockProduct);
      orderRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute('user-id', {})).rejects.toThrow(
        'Database error',
      );
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });
});
