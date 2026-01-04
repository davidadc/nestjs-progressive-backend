import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoryMapper } from '../mappers/category.mapper';
import { CATEGORY_REPOSITORY } from '../../domain/repositories/category.repository.interface';
import { Category } from '../../domain/entities/category.entity';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid'),
}));

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoryRepository: Record<string, jest.Mock>;
  let categoryMapper: { toResponseDto: jest.Mock };

  const mockCategory = new Category(
    'cat-id',
    'Electronics',
    'electronics',
    'Electronic devices',
    new Date(),
    new Date(),
  );

  beforeEach(async () => {
    categoryRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    categoryMapper = {
      toResponseDto: jest.fn().mockImplementation((category: Category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: CATEGORY_REPOSITORY, useValue: categoryRepository },
        { provide: CategoryMapper, useValue: categoryMapper },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      categoryRepository.findAll.mockResolvedValue([mockCategory]);

      const result = await service.findAll();

      expect(categoryRepository.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('name', 'Electronics');
    });

    it('should return empty array when no categories exist', async () => {
      categoryRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('should return a category by id', async () => {
      categoryRepository.findById.mockResolvedValue(mockCategory);

      const result = await service.findById('cat-id');

      expect(categoryRepository.findById).toHaveBeenCalledWith('cat-id');
      expect(categoryMapper.toResponseDto).toHaveBeenCalledWith(mockCategory);
      expect(result).toHaveProperty('name', 'Electronics');
    });

    it('should throw NotFoundException if category not found', async () => {
      categoryRepository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const createDto = {
      name: 'New Category',
      description: 'A new category',
    };

    it('should create a category successfully', async () => {
      categoryRepository.findBySlug.mockResolvedValue(null);
      categoryRepository.save.mockResolvedValue(mockCategory);

      const result = await service.create(createDto);

      expect(categoryRepository.findBySlug).toHaveBeenCalledWith(
        'new-category',
      );
      expect(categoryRepository.save).toHaveBeenCalled();
      expect(categoryMapper.toResponseDto).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw ConflictException if slug already exists', async () => {
      categoryRepository.findBySlug.mockResolvedValue(mockCategory);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(categoryRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Category',
      description: 'Updated description',
    };

    it('should update a category successfully', async () => {
      categoryRepository.findById.mockResolvedValue(mockCategory);
      categoryRepository.findBySlug.mockResolvedValue(null);
      categoryRepository.update.mockResolvedValue({
        ...mockCategory,
        name: 'Updated Category',
      });

      const result = await service.update('cat-id', updateDto);

      expect(categoryRepository.findById).toHaveBeenCalledWith('cat-id');
      expect(categoryRepository.update).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if category not found', async () => {
      categoryRepository.findById.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if new slug already exists', async () => {
      const existingCategoryWithSlug = new Category(
        'other-cat-id',
        'Updated Category',
        'updated-category',
        'Other description',
        new Date(),
        new Date(),
      );

      categoryRepository.findById.mockResolvedValue(mockCategory);
      categoryRepository.findBySlug.mockResolvedValue(existingCategoryWithSlug);

      await expect(service.update('cat-id', updateDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should allow updating to same name (same slug)', async () => {
      categoryRepository.findById.mockResolvedValue(mockCategory);
      categoryRepository.findBySlug.mockResolvedValue(mockCategory); // Same category
      categoryRepository.update.mockResolvedValue(mockCategory);

      const result = await service.update('cat-id', { name: 'Electronics' });

      expect(result).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should delete a category', async () => {
      categoryRepository.findById.mockResolvedValue(mockCategory);
      categoryRepository.delete.mockResolvedValue(undefined);

      await service.delete('cat-id');

      expect(categoryRepository.findById).toHaveBeenCalledWith('cat-id');
      expect(categoryRepository.delete).toHaveBeenCalledWith('cat-id');
    });

    it('should throw NotFoundException if category not found', async () => {
      categoryRepository.findById.mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
