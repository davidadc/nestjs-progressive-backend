import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';

describe('CartController (e2e)', () => {
  let app: INestApplication;
  let userToken: string;
  let adminToken: string;
  let productId: string;
  let categoryId: string;
  let cartItemId: string;

  const testUser = {
    email: `cart-user-${Date.now()}@example.com`,
    password: 'Password123!',
    name: 'Cart Test User',
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

    // Register and login regular user for cart operations
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser);

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    userToken = loginRes.body.data.accessToken;

    // Create a test category (admin only)
    const catRes = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `Cart Test Category ${Date.now()}`, description: 'Test' });

    categoryId = catRes.body.data.id;

    // Create a test product (admin only)
    const prodRes = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Cart Test Product ${Date.now()}`,
        description: 'A product for cart testing',
        price: 29.99,
        stock: 100,
        categoryId,
        isActive: true,
      });

    productId = prodRes.body.data.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/cart (GET)', () => {
    it('should return empty cart initially', () => {
      return request(app.getHttpServer())
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('items');
          expect(res.body.data.items).toBeInstanceOf(Array);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer()).get('/api/v1/cart').expect(401);
    });
  });

  describe('/api/v1/cart/items (POST)', () => {
    it('should add item to cart', () => {
      return request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ productId, quantity: 2 })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.items).toHaveLength(1);
          expect(res.body.data.items[0].quantity).toBe(2);
          cartItemId = res.body.data.items[0].id;
        });
    });

    it('should increase quantity for existing item', () => {
      return request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ productId, quantity: 1 })
        .expect(201)
        .expect((res) => {
          expect(res.body.data.items[0].quantity).toBe(3);
        });
    });

    it('should fail for non-existent product', () => {
      return request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: '00000000-0000-0000-0000-000000000000',
          quantity: 1,
        })
        .expect(404);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .send({ productId, quantity: 1 })
        .expect(401);
    });
  });

  describe('/api/v1/cart/items/:id (PUT)', () => {
    it('should update cart item quantity', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 5 })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.items[0].quantity).toBe(5);
        });
    });

    it('should fail for non-existent cart item', () => {
      return request(app.getHttpServer())
        .put('/api/v1/cart/items/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 1 })
        .expect(404);
    });
  });

  describe('/api/v1/cart/items/:id (DELETE)', () => {
    it('should remove item from cart', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.items).toHaveLength(0);
        });
    });
  });

  describe('/api/v1/cart (DELETE)', () => {
    it('should clear entire cart', async () => {
      // First add an item
      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ productId, quantity: 1 });

      return request(app.getHttpServer())
        .delete('/api/v1/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(204);
    });
  });
});
