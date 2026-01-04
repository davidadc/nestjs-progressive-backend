import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { UsersRepository } from '../src/users/users.repository';
import { PostsRepository } from '../src/posts/posts.repository';
import { CategoriesRepository } from '../src/categories/categories.repository';
import { User, UserRole } from '../src/users/entities/user.entity';
import { Post } from '../src/posts/entities/post.entity';
import { Category } from '../src/categories/entities/category.entity';
import * as bcrypt from 'bcrypt';

describe('PostsController (e2e)', () => {
  let app: INestApplication<App>;
  let usersRepository: Partial<UsersRepository>;
  let postsRepository: Partial<PostsRepository>;
  let categoriesRepository: Partial<CategoriesRepository>;
  let authToken: string;

  const mockAuthor: User = {
    id: 'author-id-123',
    email: 'author@example.com',
    name: 'Test Author',
    password: '',
    role: UserRole.AUTHOR,
    posts: [],
    comments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockReader: User = {
    id: 'reader-id-456',
    email: 'reader@example.com',
    name: 'Test Reader',
    password: '',
    role: UserRole.READER,
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
    content: 'This is test content that is long enough to pass validation requirements.',
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

  beforeAll(async () => {
    mockAuthor.password = await bcrypt.hash('password123', 10);
    mockReader.password = await bcrypt.hash('password123', 10);

    usersRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };

    postsRepository = {
      create: jest.fn(),
      findAllPublished: jest.fn(),
      findAllSlugs: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findBySlugWithComments: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    categoriesRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findAllSlugs: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(UsersRepository)
      .useValue(usersRepository)
      .overrideProvider(PostsRepository)
      .useValue(postsRepository)
      .overrideProvider(CategoriesRepository)
      .useValue(categoriesRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    await app.init();

    // Get auth token for author
    (usersRepository.findByEmail as jest.Mock).mockResolvedValue(mockAuthor);
    (usersRepository.findById as jest.Mock).mockResolvedValue(mockAuthor);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'author@example.com', password: 'password123' });

    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (usersRepository.findById as jest.Mock).mockResolvedValue(mockAuthor);
  });

  describe('/posts (GET)', () => {
    it('should return paginated published posts', async () => {
      (postsRepository.findAllPublished as jest.Mock).mockResolvedValue({
        data: [mockPost],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      const response = await request(app.getHttpServer())
        .get('/posts')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('title', mockPost.title);
    });

    it('should return empty list when no posts', async () => {
      (postsRepository.findAllPublished as jest.Mock).mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      const response = await request(app.getHttpServer())
        .get('/posts')
        .expect(200);

      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('/posts/:slug (GET)', () => {
    it('should return post with comments', async () => {
      const postWithComments = {
        ...mockPost,
        comments: [
          {
            id: 'comment-1',
            content: 'Great post!',
            user: { id: 'user-1', name: 'Commenter' },
            createdAt: new Date(),
          },
        ],
      };
      (postsRepository.findBySlugWithComments as jest.Mock).mockResolvedValue(
        postWithComments,
      );

      const response = await request(app.getHttpServer())
        .get('/posts/test-post')
        .expect(200);

      expect(response.body).toHaveProperty('title', mockPost.title);
      expect(response.body).toHaveProperty('comments');
      expect(response.body.comments).toHaveLength(1);
    });

    it('should return 404 for non-existent post', async () => {
      (postsRepository.findBySlugWithComments as jest.Mock).mockResolvedValue(
        null,
      );

      await request(app.getHttpServer())
        .get('/posts/non-existent')
        .expect(404);
    });
  });

  describe('/posts (POST)', () => {
    const createPostDto = {
      title: 'New Blog Post',
      content:
        'This is the content of my new blog post. It needs to be at least 50 characters long.',
      excerpt: 'A brief summary',
      published: true,
    };

    it('should create a post as author', async () => {
      (postsRepository.findAllSlugs as jest.Mock).mockResolvedValue([]);
      (postsRepository.create as jest.Mock).mockResolvedValue({
        ...mockPost,
        title: createPostDto.title,
        slug: 'new-blog-post',
      });

      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createPostDto)
        .expect(201);

      expect(response.body).toHaveProperty('title', createPostDto.title);
      expect(response.body).toHaveProperty('slug', 'new-blog-post');
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post('/posts')
        .send(createPostDto)
        .expect(401);
    });

    it('should return 403 for reader role', async () => {
      (usersRepository.findById as jest.Mock).mockResolvedValue(mockReader);
      (usersRepository.findByEmail as jest.Mock).mockResolvedValue(mockReader);

      const readerLoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'reader@example.com', password: 'password123' });

      const readerToken = readerLoginResponse.body.accessToken;

      await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${readerToken}`)
        .send(createPostDto)
        .expect(403);
    });

    it('should return 400 for invalid data', async () => {
      const invalidDto = {
        title: 'Hi',
        content: 'Too short',
      };

      await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('/posts/:slug (PUT)', () => {
    const updatePostDto = {
      title: 'Updated Title',
      published: true,
    };

    beforeEach(() => {
      (usersRepository.findById as jest.Mock).mockResolvedValue(mockAuthor);
    });

    it('should update own post', async () => {
      (postsRepository.findBySlug as jest.Mock).mockResolvedValue(mockPost);
      (postsRepository.findAllSlugs as jest.Mock).mockResolvedValue([
        'test-post',
      ]);
      (postsRepository.update as jest.Mock).mockResolvedValue({
        ...mockPost,
        ...updatePostDto,
        slug: 'updated-title',
      });

      const response = await request(app.getHttpServer())
        .put('/posts/test-post')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatePostDto)
        .expect(200);

      expect(response.body).toHaveProperty('title', updatePostDto.title);
    });

    it('should return 404 for non-existent post', async () => {
      (postsRepository.findBySlug as jest.Mock).mockResolvedValue(null);

      await request(app.getHttpServer())
        .put('/posts/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatePostDto)
        .expect(404);
    });

    it('should return 403 when updating other user post', async () => {
      const otherUserPost = {
        ...mockPost,
        authorId: 'other-author-id',
      };
      (postsRepository.findBySlug as jest.Mock).mockResolvedValue(otherUserPost);

      await request(app.getHttpServer())
        .put('/posts/test-post')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatePostDto)
        .expect(403);
    });
  });

  describe('/posts/:slug (DELETE)', () => {
    beforeEach(() => {
      (usersRepository.findById as jest.Mock).mockResolvedValue(mockAuthor);
    });

    it('should soft delete own post', async () => {
      (postsRepository.findBySlug as jest.Mock).mockResolvedValue(mockPost);
      (postsRepository.softDelete as jest.Mock).mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/posts/test-post')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      expect(postsRepository.softDelete).toHaveBeenCalledWith(mockPost.id);
    });

    it('should return 404 for non-existent post', async () => {
      (postsRepository.findBySlug as jest.Mock).mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete('/posts/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 403 when deleting other user post', async () => {
      const otherUserPost = {
        ...mockPost,
        authorId: 'other-author-id',
      };
      (postsRepository.findBySlug as jest.Mock).mockResolvedValue(otherUserPost);

      await request(app.getHttpServer())
        .delete('/posts/test-post')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });
});
