import { Test, TestingModule } from '@nestjs/testing';
import { ItemsRepository } from './items.repository';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { FindItemsDto } from './dto/find-items.dto';

describe('ItemsRepository', () => {
  let repository: ItemsRepository;
  let mockPrismaService: {
    item: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
  };

  const mockItem = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Item',
    description: 'Test description',
    price: 29.99,
    quantity: 100,
    category: 'electronics',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockPrismaService = {
      item: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemsRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<ItemsRepository>(ItemsRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create an item', async () => {
      const createDto: CreateItemDto = {
        name: 'Test Item',
        description: 'Test description',
        price: 29.99,
        quantity: 100,
        category: 'electronics',
      };

      mockPrismaService.item.create.mockResolvedValue(mockItem);

      const result = await repository.create(createDto);

      expect(mockPrismaService.item.create).toHaveBeenCalledWith({
        data: {
          name: createDto.name,
          description: createDto.description,
          price: createDto.price,
          quantity: createDto.quantity,
          category: createDto.category,
        },
      });
      expect(result).toEqual(mockItem);
    });

    it('should create an item with default quantity', async () => {
      const createDto: CreateItemDto = {
        name: 'Test Item',
      };

      mockPrismaService.item.create.mockResolvedValue({
        ...mockItem,
        description: null,
        price: null,
        quantity: 0,
        category: null,
      });

      const result = await repository.create(createDto);

      expect(mockPrismaService.item.create).toHaveBeenCalledWith({
        data: {
          name: createDto.name,
          description: undefined,
          price: undefined,
          quantity: 0,
          category: undefined,
        },
      });
      expect(result.quantity).toBe(0);
    });
  });

  describe('findAll', () => {
    it('should return paginated items with default values', async () => {
      const query: FindItemsDto = {};

      mockPrismaService.item.findMany.mockResolvedValue([mockItem]);
      mockPrismaService.item.count.mockResolvedValue(1);

      const result = await repository.findAll(query);

      expect(mockPrismaService.item.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual({
        data: [mockItem],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1,
        },
      });
    });

    it('should apply search filter', async () => {
      const query: FindItemsDto = { search: 'test' };

      mockPrismaService.item.findMany.mockResolvedValue([mockItem]);
      mockPrismaService.item.count.mockResolvedValue(1);

      await repository.findAll(query);

      expect(mockPrismaService.item.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'test', mode: 'insensitive' } },
            { description: { contains: 'test', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should apply category filter', async () => {
      const query: FindItemsDto = { category: 'electronics' };

      mockPrismaService.item.findMany.mockResolvedValue([mockItem]);
      mockPrismaService.item.count.mockResolvedValue(1);

      await repository.findAll(query);

      expect(mockPrismaService.item.findMany).toHaveBeenCalledWith({
        where: { category: 'electronics' },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should apply isActive filter', async () => {
      const query: FindItemsDto = { isActive: true };

      mockPrismaService.item.findMany.mockResolvedValue([mockItem]);
      mockPrismaService.item.count.mockResolvedValue(1);

      await repository.findAll(query);

      expect(mockPrismaService.item.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should apply sorting', async () => {
      const query: FindItemsDto = { sort: 'price', order: 'asc' };

      mockPrismaService.item.findMany.mockResolvedValue([mockItem]);
      mockPrismaService.item.count.mockResolvedValue(1);

      await repository.findAll(query);

      expect(mockPrismaService.item.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { price: 'asc' },
      });
    });

    it('should apply pagination', async () => {
      const query: FindItemsDto = { page: 2, limit: 5 };

      mockPrismaService.item.findMany.mockResolvedValue([mockItem]);
      mockPrismaService.item.count.mockResolvedValue(10);

      const result = await repository.findAll(query);

      expect(mockPrismaService.item.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 5,
        take: 5,
        orderBy: { createdAt: 'desc' },
      });
      expect(result.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 10,
        pages: 2,
      });
    });
  });

  describe('findById', () => {
    it('should return an item by id', async () => {
      mockPrismaService.item.findUnique.mockResolvedValue(mockItem);

      const result = await repository.findById(mockItem.id);

      expect(mockPrismaService.item.findUnique).toHaveBeenCalledWith({
        where: { id: mockItem.id },
      });
      expect(result).toEqual(mockItem);
    });

    it('should return null when item not found', async () => {
      mockPrismaService.item.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an item', async () => {
      const updateDto: UpdateItemDto = { name: 'Updated Item' };
      const updatedItem = { ...mockItem, name: 'Updated Item' };

      mockPrismaService.item.update.mockResolvedValue(updatedItem);

      const result = await repository.update(mockItem.id, updateDto);

      expect(mockPrismaService.item.update).toHaveBeenCalledWith({
        where: { id: mockItem.id },
        data: {
          name: updateDto.name,
          description: undefined,
          price: undefined,
          quantity: undefined,
          category: undefined,
        },
      });
      expect(result).toEqual(updatedItem);
    });
  });

  describe('delete', () => {
    it('should delete an item', async () => {
      mockPrismaService.item.delete.mockResolvedValue(mockItem);

      await repository.delete(mockItem.id);

      expect(mockPrismaService.item.delete).toHaveBeenCalledWith({
        where: { id: mockItem.id },
      });
    });
  });

  describe('count', () => {
    it('should count items with filters', async () => {
      const query: FindItemsDto = { category: 'electronics' };

      mockPrismaService.item.count.mockResolvedValue(5);

      const result = await repository.count(query);

      expect(mockPrismaService.item.count).toHaveBeenCalledWith({
        where: { category: 'electronics' },
      });
      expect(result).toBe(5);
    });
  });
});
