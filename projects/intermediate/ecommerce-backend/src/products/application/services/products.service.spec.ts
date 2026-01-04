import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductMapper } from '../mappers/product.mapper';
import { PRODUCT_REPOSITORY } from '../../domain/repositories/product.repository.interface';
import { CATEGORY_REPOSITORY } from '../../domain/repositories/category.repository.interface';
import { Product } from '../../domain/entities/product.entity';
import { Category } from '../../domain/entities/category.entity';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid'),
}));

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepository: Record<string, jest.Mock>;
  let categoryRepository: Record<string, jest.Mock>;
  let productMapper: { toResponseDto: jest.Mock };

  const mockCategory = new Category(
    'cat-id',
    'Electronics',
    'electronics',
    'Electronic devices',
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
    mockCategory,
    ['image1.jpg'],
    true,
    new Date(),
    new Date(),
    undefined,
  );

  beforeEach(async () => {
    productRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    categoryRepository = {
      findById: jest.fn(),
    };

    productMapper = {
      toResponseDto: jest.fn().mockImplementation((product: Product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        categoryId: product.categoryId,
        images: product.images,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PRODUCT_REPOSITORY, useValue: productRepository },
        { provide: CATEGORY_REPOSITORY, useValue: categoryRepository },
        { provide: ProductMapper, useValue: productMapper },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const filter = { page: 1, limit: 10 };
      productRepository.findAll.mockResolvedValue({
        products: [mockProduct],
        total: 1,
      });

      const result = await service.findAll(filter);

      expect(productRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        categoryId: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        isActive: undefined,
        sort: undefined,
        order: undefined,
      });
      expect(result).toHaveProperty('products');
      expect(result).toHaveProperty('total', 1);
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('limit', 10);
      expect(result).toHaveProperty('pages', 1);
    });

    it('should apply filters correctly', async () => {
      const filter = {
        page: 1,
        limit: 5,
        search: 'laptop',
        categoryId: 'cat-id',
        minPrice: 100,
        maxPrice: 1000,
      };
      productRepository.findAll.mockResolvedValue({
        products: [mockProduct],
        total: 1,
      });

      await service.findAll(filter);

      expect(productRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'laptop',
          categoryId: 'cat-id',
          minPrice: 100,
          maxPrice: 1000,
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return a product by id', async () => {
      productRepository.findById.mockResolvedValue(mockProduct);

      const result = await service.findById('prod-id');

      expect(productRepository.findById).toHaveBeenCalledWith('prod-id');
      expect(productMapper.toResponseDto).toHaveBeenCalledWith(mockProduct);
      expect(result).toHaveProperty('name', 'Laptop');
    });

    it('should throw NotFoundException if product not found', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const createDto = {
      name: 'New Product',
      description: 'A new product',
      price: 199.99,
      stock: 50,
      categoryId: 'cat-id',
      images: ['new-image.jpg'],
      isActive: true,
    };

    it('should create a product successfully', async () => {
      categoryRepository.findById.mockResolvedValue(mockCategory);
      productRepository.save.mockResolvedValue(mockProduct);

      const result = await service.create(createDto);

      expect(categoryRepository.findById).toHaveBeenCalledWith('cat-id');
      expect(productRepository.save).toHaveBeenCalled();
      expect(productMapper.toResponseDto).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException if category not found', async () => {
      categoryRepository.findById.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(productRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Product',
      price: 299.99,
    };

    it('should update a product successfully', async () => {
      productRepository.findById.mockResolvedValue(mockProduct);
      productRepository.update.mockResolvedValue({
        ...mockProduct,
        name: 'Updated Product',
        price: 299.99,
      });

      const result = await service.update('prod-id', updateDto);

      expect(productRepository.findById).toHaveBeenCalledWith('prod-id');
      expect(productRepository.update).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if product not found', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should validate category when updating categoryId', async () => {
      const updateWithCategory = { ...updateDto, categoryId: 'new-cat-id' };
      productRepository.findById.mockResolvedValue(mockProduct);
      categoryRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('prod-id', updateWithCategory),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should soft delete a product', async () => {
      productRepository.findById.mockResolvedValue(mockProduct);
      productRepository.softDelete.mockResolvedValue(undefined);

      await service.delete('prod-id');

      expect(productRepository.findById).toHaveBeenCalledWith('prod-id');
      expect(productRepository.softDelete).toHaveBeenCalledWith('prod-id');
    });

    it('should throw NotFoundException if product not found', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
