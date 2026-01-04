import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesRepository } from './categories.repository';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: jest.Mocked<CategoriesRepository>;

  const mockCategory: Category = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Technology',
    slug: 'technology',
    posts: [],
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findAllSlugs: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findBySlugWithPosts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: CategoriesRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    repository = module.get(CategoriesRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateCategoryDto = {
      name: 'Technology',
    };

    it('should create a category with generated slug', async () => {
      repository.findAllSlugs.mockResolvedValue([]);
      repository.create.mockResolvedValue(mockCategory);

      const result = await service.create(createDto);

      expect(repository.findAllSlugs).toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalledWith({
        name: createDto.name,
        slug: 'technology',
      });
      expect(result.name).toBe(mockCategory.name);
      expect(result.slug).toBe(mockCategory.slug);
    });

    it('should create a category with unique slug when slug exists', async () => {
      repository.findAllSlugs.mockResolvedValue(['technology']);
      repository.create.mockResolvedValue({
        ...mockCategory,
        slug: 'technology-1',
      });

      const result = await service.create(createDto);

      expect(repository.create).toHaveBeenCalledWith({
        name: createDto.name,
        slug: 'technology-1',
      });
      expect(result.slug).toBe('technology-1');
    });

    it('should handle special characters in name', async () => {
      const specialDto: CreateCategoryDto = {
        name: 'Web Development & Design',
      };

      repository.findAllSlugs.mockResolvedValue([]);
      repository.create.mockResolvedValue({
        ...mockCategory,
        name: specialDto.name,
        slug: 'web-development-design',
      });

      const result = await service.create(specialDto);

      expect(repository.create).toHaveBeenCalledWith({
        name: specialDto.name,
        slug: 'web-development-design',
      });
      expect(result.slug).toBe('web-development-design');
    });
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      const categories = [
        mockCategory,
        { ...mockCategory, id: '2', name: 'Science', slug: 'science' },
      ];
      repository.findAll.mockResolvedValue(categories);

      const result = await service.findAll();

      expect(repository.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Technology');
      expect(result[1].name).toBe('Science');
    });

    it('should return empty array when no categories exist', async () => {
      repository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return category if found', async () => {
      repository.findById.mockResolvedValue(mockCategory);

      const result = await service.findById(mockCategory.id);

      expect(repository.findById).toHaveBeenCalledWith(mockCategory.id);
      expect(result).toEqual(mockCategory);
    });

    it('should return null if category not found', async () => {
      repository.findById.mockResolvedValue(null);

      const result = await service.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findBySlug', () => {
    it('should return category if found', async () => {
      repository.findBySlug.mockResolvedValue(mockCategory);

      const result = await service.findBySlug('technology');

      expect(repository.findBySlug).toHaveBeenCalledWith('technology');
      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException if category not found', async () => {
      repository.findBySlug.mockResolvedValue(null);

      await expect(service.findBySlug('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findBySlugWithPosts', () => {
    it('should return category with posts if found', async () => {
      const categoryWithPosts = {
        ...mockCategory,
        posts: [
          { id: '1', title: 'Post 1' },
          { id: '2', title: 'Post 2' },
        ],
      };
      repository.findBySlugWithPosts.mockResolvedValue(
        categoryWithPosts as Category,
      );

      const result = await service.findBySlugWithPosts('technology');

      expect(repository.findBySlugWithPosts).toHaveBeenCalledWith('technology');
      expect(result).toEqual(categoryWithPosts);
      expect(result.posts).toHaveLength(2);
    });

    it('should throw NotFoundException if category not found', async () => {
      repository.findBySlugWithPosts.mockResolvedValue(null);

      await expect(service.findBySlugWithPosts('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
