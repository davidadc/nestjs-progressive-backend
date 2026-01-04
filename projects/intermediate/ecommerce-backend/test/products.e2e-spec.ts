import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';

describe('ProductsController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let categoryId: string;
  let productId: string;

  // Use seeded admin user (created by seed-data.sh)
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

    // Login as seeded admin user
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(seededAdmin);

    adminToken = loginRes.body.data?.accessToken;

    if (!adminToken) {
      throw new Error(
        'Failed to login as admin. Run ./scripts/seed-data.sh first.',
      );
    }

    // Create a test category first
    const catRes = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Test Category ${Date.now()}`,
        description: 'Test description',
      });

    categoryId = catRes.body.data?.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/products (GET)', () => {
    it('should return products list (public)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/products')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body.meta).toHaveProperty('total');
          expect(res.body.meta).toHaveProperty('page');
        });
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/api/v1/products?page=1&limit=5')
        .expect(200)
        .expect((res) => {
          expect(res.body.meta.page).toBe(1);
          expect(res.body.meta.limit).toBe(5);
        });
    });

    it('should support search', () => {
      return request(app.getHttpServer())
        .get('/api/v1/products?search=laptop')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('/api/v1/products (POST)', () => {
    it('should create a product (admin)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Test Product ${Date.now()}`,
          description: 'A test product',
          price: 99.99,
          stock: 10,
          categoryId,
          images: ['image1.jpg'],
          isActive: true,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data.name).toContain('Test Product');
          productId = res.body.data.id;
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/products')
        .send({
          name: 'Test Product',
          description: 'A test product',
          price: 99.99,
          stock: 10,
          categoryId,
        })
        .expect(401);
    });

    it('should fail with invalid category', () => {
      return request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Product',
          description: 'A test product',
          price: 99.99,
          stock: 10,
          categoryId: 'invalid-uuid',
        })
        .expect(400);
    });
  });

  describe('/api/v1/products/:id (GET)', () => {
    it('should return a product by ID (public)', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/products/${productId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toBe(productId);
        });
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .get('/api/v1/products/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('/api/v1/products/:id (PUT)', () => {
    it('should update a product (admin)', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Product Name',
          price: 149.99,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.name).toBe('Updated Product Name');
          expect(res.body.data.price).toBe(149.99);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/products/${productId}`)
        .send({ name: 'Updated' })
        .expect(401);
    });
  });

  describe('/api/v1/products/:id (DELETE)', () => {
    it('should soft delete a product (admin)', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/products/${productId}`)
        .expect(401);
    });
  });
});

describe('CategoriesController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let categoryId: string;

  // Use seeded admin user (created by seed-data.sh)
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

    // Login as seeded admin user
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(seededAdmin);

    adminToken = loginRes.body.data?.accessToken;

    if (!adminToken) {
      throw new Error(
        'Failed to login as admin. Run ./scripts/seed-data.sh first.',
      );
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/categories (GET)', () => {
    it('should return categories list (public)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/categories')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeInstanceOf(Array);
        });
    });
  });

  describe('/api/v1/categories (POST)', () => {
    it('should create a category (admin)', () => {
      const categoryName = `Electronics ${Date.now()}`;
      return request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: categoryName,
          description: 'Electronic devices',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data.name).toBe(categoryName);
          categoryId = res.body.data.id;
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/categories')
        .send({ name: 'Test Category' })
        .expect(401);
    });
  });

  describe('/api/v1/categories/:id (GET)', () => {
    it('should return a category by ID (public)', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/categories/${categoryId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toBe(categoryId);
        });
    });

    it('should return 404 for non-existent category', () => {
      return request(app.getHttpServer())
        .get('/api/v1/categories/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('/api/v1/categories/:id (PUT)', () => {
    it('should update a category (admin)', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Category Name',
          description: 'Updated description',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.name).toBe('Updated Category Name');
        });
    });
  });

  describe('/api/v1/categories/:id (DELETE)', () => {
    it('should delete a category (admin)', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });
  });
});
