import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ITEMS_REPOSITORY } from './items.repository.interface';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { FindItemsDto } from './dto/find-items.dto';

describe('ItemsService', () => {
  let service: ItemsService;
  let mockRepository: {
    create: jest.Mock;
    findAll: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
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
    mockRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemsService,
        {
          provide: ITEMS_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ItemsService>(ItemsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an item successfully', async () => {
      const createDto: CreateItemDto = {
        name: 'Test Item',
        description: 'Test description',
        price: 29.99,
        quantity: 100,
        category: 'electronics',
      };

      mockRepository.create.mockResolvedValue(mockItem);

      const result = await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockItem);
    });
  });

  describe('findAll', () => {
    it('should return paginated items', async () => {
      const query: FindItemsDto = { page: 1, limit: 10 };
      const paginatedResult = {
        data: [mockItem],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1,
        },
      };

      mockRepository.findAll.mockResolvedValue(paginatedResult);

      const result = await service.findAll(query);

      expect(mockRepository.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(paginatedResult);
    });

    it('should return paginated items with search filter', async () => {
      const query: FindItemsDto = { page: 1, limit: 10, search: 'test' };
      const paginatedResult = {
        data: [mockItem],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1,
        },
      };

      mockRepository.findAll.mockResolvedValue(paginatedResult);

      const result = await service.findAll(query);

      expect(mockRepository.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(paginatedResult);
    });

    it('should return paginated items with category filter', async () => {
      const query: FindItemsDto = {
        page: 1,
        limit: 10,
        category: 'electronics',
      };
      const paginatedResult = {
        data: [mockItem],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1,
        },
      };

      mockRepository.findAll.mockResolvedValue(paginatedResult);

      const result = await service.findAll(query);

      expect(mockRepository.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('findOne', () => {
    it('should return an item by id', async () => {
      mockRepository.findById.mockResolvedValue(mockItem);

      const result = await service.findOne(mockItem.id);

      expect(mockRepository.findById).toHaveBeenCalledWith(mockItem.id);
      expect(result).toEqual(mockItem);
    });

    it('should throw NotFoundException when item not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        "Item with ID 'non-existent-id' not found",
      );
    });
  });

  describe('update', () => {
    it('should update an item successfully', async () => {
      const updateDto: UpdateItemDto = { name: 'Updated Item' };
      const updatedItem = { ...mockItem, name: 'Updated Item' };

      mockRepository.findById.mockResolvedValue(mockItem);
      mockRepository.update.mockResolvedValue(updatedItem);

      const result = await service.update(mockItem.id, updateDto);

      expect(mockRepository.findById).toHaveBeenCalledWith(mockItem.id);
      expect(mockRepository.update).toHaveBeenCalledWith(
        mockItem.id,
        updateDto,
      );
      expect(result).toEqual(updatedItem);
    });

    it('should throw NotFoundException when updating non-existent item', async () => {
      const updateDto: UpdateItemDto = { name: 'Updated Item' };

      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove an item successfully', async () => {
      mockRepository.findById.mockResolvedValue(mockItem);
      mockRepository.delete.mockResolvedValue(undefined);

      await service.remove(mockItem.id);

      expect(mockRepository.findById).toHaveBeenCalledWith(mockItem.id);
      expect(mockRepository.delete).toHaveBeenCalledWith(mockItem.id);
    });

    it('should throw NotFoundException when removing non-existent item', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
