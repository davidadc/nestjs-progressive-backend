import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsRepository } from './posts.repository';
import { CategoriesService } from '../categories/categories.service';
import { Post } from './entities/post.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { FindPostsDto } from './dto/find-posts.dto';

describe('PostsService', () => {
  let service: PostsService;
  let postsRepository: jest.Mocked<PostsRepository>;
  let categoriesService: jest.Mocked<CategoriesService>;

  const mockAuthor: User = {
    id: 'author-id-123',
    email: 'author@example.com',
    name: 'Test Author',
    password: 'hashedPassword',
    role: UserRole.AUTHOR,
    posts: [],
    comments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCategory: Category = {
    id: 'category-id-123',
    name: 'Technology',
    slug: 'technology',
    posts: [],
  };

  const mockPost: Post = {
    id: 'post-id-123',
    title: 'Test Post',
    slug: 'test-post',
    content: 'Test content',
    excerpt: 'Test excerpt',
    published: true,
    authorId: mockAuthor.id,
    author: mockAuthor,
    categoryId: mockCategory.id,
    category: mockCategory,
    comments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null as unknown as Date,
  };

  beforeEach(async () => {
    const mockPostsRepository = {
      create: jest.fn(),
      findAllPublished: jest.fn(),
      findAllSlugs: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findBySlugWithComments: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    const mockCategoriesService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: PostsRepository, useValue: mockPostsRepository },
        { provide: CategoriesService, useValue: mockCategoriesService },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    postsRepository = module.get(PostsRepository);
    categoriesService = module.get(CategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreatePostDto = {
      title: 'New Post',
      content: 'Post content',
      excerpt: 'Excerpt',
      categoryId: mockCategory.id,
      published: true,
    };

    it('should create a post successfully', async () => {
      categoriesService.findById.mockResolvedValue(mockCategory);
      postsRepository.findAllSlugs.mockResolvedValue([]);
      postsRepository.create.mockResolvedValue({
        ...mockPost,
        title: createDto.title,
        slug: 'new-post',
      });

      const result = await service.create(mockAuthor.id, createDto);

      expect(categoriesService.findById).toHaveBeenCalledWith(
        createDto.categoryId,
      );
      expect(postsRepository.findAllSlugs).toHaveBeenCalled();
      expect(postsRepository.create).toHaveBeenCalledWith({
        title: createDto.title,
        slug: 'new-post',
        content: createDto.content,
        excerpt: createDto.excerpt,
        categoryId: createDto.categoryId,
        published: createDto.published,
        authorId: mockAuthor.id,
      });
      expect(result.title).toBe(createDto.title);
    });

    it('should create post without category', async () => {
      const dtoWithoutCategory: CreatePostDto = {
        title: 'No Category Post',
        content: 'Content',
      };

      postsRepository.findAllSlugs.mockResolvedValue([]);
      postsRepository.create.mockResolvedValue({
        ...mockPost,
        title: dtoWithoutCategory.title,
        categoryId: null as unknown as string,
        category: null as unknown as Category,
      });

      await service.create(mockAuthor.id, dtoWithoutCategory);

      expect(categoriesService.findById).not.toHaveBeenCalled();
      expect(postsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId: undefined,
        }),
      );
    });

    it('should throw NotFoundException if category not found', async () => {
      categoriesService.findById.mockResolvedValue(null);

      await expect(service.create(mockAuthor.id, createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should generate unique slug when slug exists', async () => {
      categoriesService.findById.mockResolvedValue(mockCategory);
      postsRepository.findAllSlugs.mockResolvedValue(['new-post']);
      postsRepository.create.mockResolvedValue({
        ...mockPost,
        title: createDto.title,
        slug: 'new-post-1',
      });

      const result = await service.create(mockAuthor.id, createDto);

      expect(postsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'new-post-1',
        }),
      );
      expect(result.slug).toBe('new-post-1');
    });
  });

  describe('findAllPublished', () => {
    it('should return paginated posts', async () => {
      const dto: FindPostsDto = { page: 1, limit: 10 };
      const paginatedResult = {
        data: [mockPost],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      postsRepository.findAllPublished.mockResolvedValue(paginatedResult);

      const result = await service.findAllPublished(dto);

      expect(postsRepository.findAllPublished).toHaveBeenCalledWith(dto);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should return empty data when no posts', async () => {
      const dto: FindPostsDto = { page: 1, limit: 10 };
      postsRepository.findAllPublished.mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      const result = await service.findAllPublished(dto);

      expect(result.data).toHaveLength(0);
    });
  });

  describe('findBySlug', () => {
    it('should return post with comments', async () => {
      const postWithComments = {
        ...mockPost,
        comments: [
          {
            id: '1',
            content: 'Comment 1',
            user: { id: 'user-1', name: 'Commenter' },
            createdAt: new Date(),
          },
        ],
      };
      postsRepository.findBySlugWithComments.mockResolvedValue(
        postWithComments as Post,
      );

      const result = await service.findBySlug('test-post');

      expect(postsRepository.findBySlugWithComments).toHaveBeenCalledWith(
        'test-post',
      );
      expect(result.comments).toBeDefined();
      expect(result.comments).toHaveLength(1);
    });

    it('should throw NotFoundException if post not found', async () => {
      postsRepository.findBySlugWithComments.mockResolvedValue(null);

      await expect(service.findBySlug('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdatePostDto = {
      title: 'Updated Title',
      content: 'Updated content',
    };

    it('should update post successfully', async () => {
      postsRepository.findBySlug.mockResolvedValue(mockPost);
      postsRepository.findAllSlugs.mockResolvedValue(['test-post']);
      postsRepository.update.mockResolvedValue({
        ...mockPost,
        ...updateDto,
        slug: 'updated-title',
      });

      const result = await service.update(
        mockAuthor.id,
        'test-post',
        updateDto,
      );

      expect(postsRepository.findBySlug).toHaveBeenCalledWith('test-post');
      expect(postsRepository.update).toHaveBeenCalled();
      expect(result.title).toBe('Updated Title');
    });

    it('should throw NotFoundException if post not found', async () => {
      postsRepository.findBySlug.mockResolvedValue(null);

      await expect(
        service.update(mockAuthor.id, 'non-existent', updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not author', async () => {
      postsRepository.findBySlug.mockResolvedValue(mockPost);

      await expect(
        service.update('different-author-id', 'test-post', updateDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if category not found', async () => {
      const updateWithCategory: UpdatePostDto = {
        categoryId: 'non-existent-category',
      };
      postsRepository.findBySlug.mockResolvedValue(mockPost);
      categoriesService.findById.mockResolvedValue(null);

      await expect(
        service.update(mockAuthor.id, 'test-post', updateWithCategory),
      ).rejects.toThrow(NotFoundException);
    });

    it('should keep same slug if title not changed', async () => {
      const updateWithoutTitle: UpdatePostDto = {
        content: 'Updated content only',
      };
      postsRepository.findBySlug.mockResolvedValue(mockPost);
      postsRepository.update.mockResolvedValue({
        ...mockPost,
        ...updateWithoutTitle,
      });

      await service.update(mockAuthor.id, 'test-post', updateWithoutTitle);

      expect(postsRepository.update).toHaveBeenCalledWith(
        mockPost.id,
        expect.objectContaining({
          slug: mockPost.slug,
        }),
      );
    });
  });

  describe('remove', () => {
    it('should soft delete post successfully', async () => {
      postsRepository.findBySlug.mockResolvedValue(mockPost);
      postsRepository.softDelete.mockResolvedValue(undefined);

      await service.remove(mockAuthor.id, 'test-post');

      expect(postsRepository.findBySlug).toHaveBeenCalledWith('test-post');
      expect(postsRepository.softDelete).toHaveBeenCalledWith(mockPost.id);
    });

    it('should throw NotFoundException if post not found', async () => {
      postsRepository.findBySlug.mockResolvedValue(null);

      await expect(
        service.remove(mockAuthor.id, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not author', async () => {
      postsRepository.findBySlug.mockResolvedValue(mockPost);

      await expect(
        service.remove('different-author-id', 'test-post'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findById', () => {
    it('should return post by id', async () => {
      postsRepository.findById.mockResolvedValue(mockPost);

      const result = await service.findById(mockPost.id);

      expect(postsRepository.findById).toHaveBeenCalledWith(mockPost.id);
      expect(result).toEqual(mockPost);
    });
  });
});
