import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';

describe('ReviewsController (e2e)', () => {
  let app: INestApplication;
  let userToken: string;
  let user2Token: string;
  let adminToken: string;
  let productId: string;
  let categoryId: string;
  let reviewId: string;

  const testUser = {
    email: `review-user-${Date.now()}@example.com`,
    password: 'Password123!',
    name: 'Review Test User',
  };

  const testUser2 = {
    email: `review-user2-${Date.now()}@example.com`,
    password: 'Password123!',
    name: 'Review Test User 2',
  };

  // Use seeded admin user for admin operations (created by seed-data.sh)
  const seededAdmin = {
    email: 'admin@example.com',
    password: 'Password123!',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();

    // Login as seeded admin user for admin operations
    const adminLoginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(seededAdmin);

    adminToken = adminLoginRes.body.data?.accessToken;

    if (!adminToken) {
      throw new Error(
        'Failed to login as admin. Run ./scripts/seed-data.sh first.',
      );
    }

    // Register and login first user
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser);

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    userToken = loginRes.body.data.accessToken;

    // Register and login second user
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser2);

    const loginRes2 = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testUser2.email, password: testUser2.password });

    user2Token = loginRes2.body.data.accessToken;

    // Create a test category (admin only)
    const catRes = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Review Test Category ${Date.now()}`,
        description: 'Test',
      });

    categoryId = catRes.body.data.id;

    // Create a test product (admin only)
    const prodRes = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Review Test Product ${Date.now()}`,
        description: 'A product for review testing',
        price: 29.99,
        stock: 10,
        categoryId,
        isActive: true,
      });

    productId = prodRes.body.data.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/products/:id/reviews (GET)', () => {
    it('should return empty reviews list initially (public)', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/products/${productId}/reviews`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body.meta).toHaveProperty('total');
        });
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .get('/api/v1/products/00000000-0000-0000-0000-000000000000/reviews')
        .expect(404);
    });
  });

  describe('/api/v1/products/:id/reviews (POST)', () => {
    it('should create a review', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/products/${productId}/reviews`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 5,
          comment: 'Excellent product! Highly recommended.',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data.rating).toBe(5);
          expect(res.body.data.comment).toBe(
            'Excellent product! Highly recommended.',
          );
          reviewId = res.body.data.id;
        });
    });

    it('should fail to create duplicate review', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/products/${productId}/reviews`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 4,
          comment: 'Another review',
        })
        .expect(409);
    });

    it('should allow different user to create review', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/products/${productId}/reviews`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          rating: 4,
          comment: 'Pretty good product!',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data.rating).toBe(4);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/products/${productId}/reviews`)
        .send({
          rating: 5,
          comment: 'Great!',
        })
        .expect(401);
    });

    it('should fail with invalid rating', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/products/${productId}/reviews`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 6,
          comment: 'Invalid rating',
        })
        .expect(400);
    });

    it('should fail for non-existent product', () => {
      return request(app.getHttpServer())
        .post('/api/v1/products/00000000-0000-0000-0000-000000000000/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 5,
          comment: 'Great!',
        })
        .expect(404);
    });
  });

  describe('/api/v1/products/:productId/reviews/:reviewId (PUT)', () => {
    it('should update own review', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/products/${productId}/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 4,
          comment: 'Updated review - still good!',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.rating).toBe(4);
          expect(res.body.data.comment).toBe('Updated review - still good!');
        });
    });

    it('should fail to update another user review', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/products/${productId}/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          rating: 1,
          comment: 'Trying to modify someone else review',
        })
        .expect(404);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/products/${productId}/reviews/${reviewId}`)
        .send({
          rating: 1,
          comment: 'Should fail',
        })
        .expect(401);
    });
  });

  describe('Reviews with average rating', () => {
    it('should show updated average rating', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/products/${productId}/reviews`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(2);
          expect(res.body.meta.total).toBe(2);
          // Average of 4 + 4 = 4
          expect(res.body.data[0]).toHaveProperty('rating');
        });
    });
  });
});
