import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartMapper } from '../mappers/cart.mapper';
import { CART_REPOSITORY } from '../../domain/repositories/cart.repository.interface';
import { PRODUCT_REPOSITORY } from '../../../products/domain/repositories/product.repository.interface';
import { Cart } from '../../domain/entities/cart.entity';
import { CartItem } from '../../domain/entities/cart-item.entity';
import { Product } from '../../../products/domain/entities/product.entity';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid'),
}));

describe('CartService', () => {
  let service: CartService;
  let cartRepository: Record<string, jest.Mock>;
  let productRepository: Record<string, jest.Mock>;
  let cartMapper: { toResponseDto: jest.Mock };

  const mockProduct = new Product(
    'prod-id',
    'Laptop',
    'A great laptop',
    999.99,
    10,
    'cat-id',
    undefined,
    ['image1.jpg'],
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

  beforeEach(async () => {
    cartRepository = {
      findByUserId: jest.fn(),
      findOrCreate: jest.fn(),
      addItem: jest.fn(),
      updateItemQuantity: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };

    productRepository = {
      findById: jest.fn(),
    };

    cartMapper = {
      toResponseDto: jest.fn().mockImplementation((cart: Cart) => ({
        id: cart.id,
        userId: cart.userId,
        items: cart.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.getSubtotal(),
        })),
        total: cart.getTotal(),
        itemCount: cart.getItemCount(),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: CART_REPOSITORY, useValue: cartRepository },
        { provide: PRODUCT_REPOSITORY, useValue: productRepository },
        { provide: CartMapper, useValue: cartMapper },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCart', () => {
    it('should return user cart', async () => {
      cartRepository.findOrCreate.mockResolvedValue(mockCart);

      const result = await service.getCart('user-id');

      expect(cartRepository.findOrCreate).toHaveBeenCalledWith('user-id');
      expect(cartMapper.toResponseDto).toHaveBeenCalledWith(mockCart);
      expect(result).toHaveProperty('items');
    });
  });

  describe('addItem', () => {
    const addToCartDto = { productId: 'prod-id', quantity: 2 };

    it('should add a new item to cart', async () => {
      productRepository.findById.mockResolvedValue(mockProduct);
      cartRepository.findOrCreate.mockResolvedValue(emptyCart);
      cartRepository.addItem.mockResolvedValue(mockCart);

      const result = await service.addItem('user-id', addToCartDto);

      expect(productRepository.findById).toHaveBeenCalledWith('prod-id');
      expect(cartRepository.findOrCreate).toHaveBeenCalledWith('user-id');
      expect(cartRepository.addItem).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should update quantity if item already in cart', async () => {
      productRepository.findById.mockResolvedValue(mockProduct);
      cartRepository.findOrCreate.mockResolvedValue(mockCart);
      cartRepository.updateItemQuantity.mockResolvedValue(mockCart);

      await service.addItem('user-id', addToCartDto);

      expect(cartRepository.updateItemQuantity).toHaveBeenCalledWith(
        'cart-id',
        'item-id',
        4, // existing 2 + new 2
      );
    });

    it('should throw NotFoundException if product not found', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(service.addItem('user-id', addToCartDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if product out of stock', async () => {
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
      productRepository.findById.mockResolvedValue(outOfStockProduct);

      await expect(service.addItem('user-id', addToCartDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if not enough stock', async () => {
      const lowStockProduct = new Product(
        'prod-id',
        'Laptop',
        'A great laptop',
        999.99,
        1,
        'cat-id',
        undefined,
        [],
        true,
        new Date(),
        new Date(),
        undefined,
      );
      productRepository.findById.mockResolvedValue(lowStockProduct);

      await expect(service.addItem('user-id', addToCartDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateItemQuantity', () => {
    const updateDto = { quantity: 5 };

    it('should update cart item quantity', async () => {
      productRepository.findById.mockResolvedValue(mockProduct);
      cartRepository.findByUserId.mockResolvedValue(mockCart);
      cartRepository.updateItemQuantity.mockResolvedValue(mockCart);

      const result = await service.updateItemQuantity(
        'user-id',
        'item-id',
        updateDto,
      );

      expect(cartRepository.findByUserId).toHaveBeenCalledWith('user-id');
      expect(cartRepository.updateItemQuantity).toHaveBeenCalledWith(
        'cart-id',
        'item-id',
        5,
      );
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if cart not found', async () => {
      cartRepository.findByUserId.mockResolvedValue(null);

      await expect(
        service.updateItemQuantity('user-id', 'item-id', updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if item not found in cart', async () => {
      cartRepository.findByUserId.mockResolvedValue(emptyCart);

      await expect(
        service.updateItemQuantity('user-id', 'non-existent', updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if not enough stock', async () => {
      productRepository.findById.mockResolvedValue(mockProduct);
      cartRepository.findByUserId.mockResolvedValue(mockCart);

      await expect(
        service.updateItemQuantity('user-id', 'item-id', { quantity: 100 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
      cartRepository.findByUserId.mockResolvedValue(mockCart);
      cartRepository.removeItem.mockResolvedValue(emptyCart);

      const result = await service.removeItem('user-id', 'item-id');

      expect(cartRepository.findByUserId).toHaveBeenCalledWith('user-id');
      expect(cartRepository.removeItem).toHaveBeenCalledWith(
        'cart-id',
        'item-id',
      );
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if cart not found', async () => {
      cartRepository.findByUserId.mockResolvedValue(null);

      await expect(service.removeItem('user-id', 'item-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if item not found', async () => {
      cartRepository.findByUserId.mockResolvedValue(emptyCart);

      await expect(
        service.removeItem('user-id', 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('clearCart', () => {
    it('should clear the cart', async () => {
      cartRepository.findByUserId.mockResolvedValue(mockCart);
      cartRepository.clear.mockResolvedValue(undefined);

      await service.clearCart('user-id');

      expect(cartRepository.findByUserId).toHaveBeenCalledWith('user-id');
      expect(cartRepository.clear).toHaveBeenCalledWith('cart-id');
    });

    it('should do nothing if cart not found', async () => {
      cartRepository.findByUserId.mockResolvedValue(null);

      await service.clearCart('user-id');

      expect(cartRepository.clear).not.toHaveBeenCalled();
    });
  });
});
