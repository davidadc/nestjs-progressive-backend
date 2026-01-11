import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ProblemDetailsFilter } from '../src/common/filters/problem-details.filter';

describe('PostsController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let userId: string;
  let postId: string;

  const testUser = {
    email: `e2e-posts-${Date.now()}@example.com`,
    username: `e2eposts${Date.now()}`,
    password: 'TestPass123!',
    name: 'E2E Posts User',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new ProblemDetailsFilter());
    await app.init();

    // Register a test user
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser);

    accessToken = registerResponse.body.data.accessToken;
    userId = registerResponse.body.data.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/posts (POST)', () => {
    it('should create a post', () => {
      return request(app.getHttpServer())
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'This is a test post #testing #e2e',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data.content).toBe('This is a test post #testing #e2e');
          expect(res.body.data.author.id).toBe(userId);
          expect(res.body.data.likesCount).toBe(0);
          expect(res.body.data.commentsCount).toBe(0);
          postId = res.body.data.id;
        });
    });

    it('should reject post without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/posts')
        .send({
          content: 'Unauthorized post',
        })
        .expect(401);
    });

    it('should reject empty content', () => {
      return request(app.getHttpServer())
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: '',
        })
        .expect(400);
    });
  });

  describe('/api/v1/posts/:id (GET)', () => {
    it('should get a post by id', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/posts/${postId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.id).toBe(postId);
          expect(res.body.data).toHaveProperty('content');
          expect(res.body.data).toHaveProperty('author');
        });
    });

    it('should return 404 for non-existent post', () => {
      return request(app.getHttpServer())
        .get('/api/v1/posts/00000000-0000-0000-0000-000000000000')
        .expect(404)
        .expect((res) => {
          expect(res.body).toHaveProperty('type');
          expect(res.body).toHaveProperty('status', 404);
        });
    });
  });

  describe('/api/v1/posts/:id/like (POST)', () => {
    it('should like a post', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/posts/${postId}/like`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);
    });

    it('should reject duplicate like', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/posts/${postId}/like`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(409);
    });
  });

  describe('/api/v1/posts/:id/likes (GET)', () => {
    it('should get post likes', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/posts/${postId}/likes`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('items');
          expect(Array.isArray(res.body.data.items)).toBe(true);
        });
    });
  });

  describe('/api/v1/posts/:id/like (DELETE)', () => {
    it('should unlike a post', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/posts/${postId}/like`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });
  });

  describe('/api/v1/posts/:id/comments (POST)', () => {
    it('should create a comment', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'This is a test comment',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data.content).toBe('This is a test comment');
        });
    });
  });

  describe('/api/v1/posts/:id/comments (GET)', () => {
    it('should get post comments', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/posts/${postId}/comments`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('items');
          expect(res.body.data.items.length).toBeGreaterThan(0);
        });
    });
  });

  describe('/api/v1/posts/user/:userId (GET)', () => {
    it('should get user posts', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/posts/user/${userId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('items');
          expect(res.body.data.items.length).toBeGreaterThan(0);
        });
    });
  });

  describe('/api/v1/posts/:id (DELETE)', () => {
    it('should delete own post', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });

    it('should return 404 for deleted post', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/posts/${postId}`)
        .expect(404);
    });
  });
});
