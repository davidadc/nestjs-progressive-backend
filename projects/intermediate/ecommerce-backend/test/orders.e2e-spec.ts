import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';

describe('OrdersController (e2e)', () => {
  let app: INestApplication;
  let userToken: string;
  let adminToken: string;
  let productId: string;
  let categoryId: string;
  let orderId: string;
  let addressId: string;

  const testUser = {
    email: `order-user-${Date.now()}@example.com`,
    password: 'Password123!',
    name: 'Order Test User',
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
      throw new Error('Failed to login as admin. Run ./scripts/seed-data.sh first.');
    }

    // Register and login regular user for order operations
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
      .send({ name: `Order Test Category ${Date.now()}`, description: 'Test' });

    categoryId = catRes.body.data.id;

    // Create a test product (admin only)
    const prodRes = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Order Test Product ${Date.now()}`,
        description: 'A product for order testing',
        price: 49.99,
        stock: 50,
        categoryId,
        isActive: true,
      });

    productId = prodRes.body.data.id;

    // Add a shipping address
    const addrRes = await request(app.getHttpServer())
      .post('/api/v1/users/me/addresses')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'Test Country',
        isDefault: true,
      });

    addressId = addrRes.body.data?.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/orders (GET)', () => {
    it('should return empty orders list initially', () => {
      return request(app.getHttpServer())
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeInstanceOf(Array);
        });
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/api/v1/orders?page=1&limit=5')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.meta.page).toBe(1);
          expect(res.body.meta.limit).toBe(5);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/orders')
        .expect(401);
    });
  });

  describe('/api/v1/orders (POST)', () => {
    it('should fail when cart is empty', () => {
      return request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(400);
    });

    it('should create order from cart', async () => {
      // First add item to cart
      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ productId, quantity: 2 });

      return request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data).toHaveProperty('items');
          expect(res.body.data).toHaveProperty('total');
          expect(res.body.data).toHaveProperty('status');
          expect(res.body.data.status).toBe('pending');
          orderId = res.body.data.id;
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/orders')
        .send({})
        .expect(401);
    });
  });

  describe('/api/v1/orders/:id (GET)', () => {
    it('should return order by ID', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toBe(orderId);
          expect(res.body.data).toHaveProperty('items');
          expect(res.body.data).toHaveProperty('shippingAddress');
        });
    });

    it('should return 404 for non-existent order', () => {
      return request(app.getHttpServer())
        .get('/api/v1/orders/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/orders/${orderId}`)
        .expect(401);
    });
  });

  describe('Order Flow Test', () => {
    it('should clear cart after order creation', () => {
      return request(app.getHttpServer())
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.items).toHaveLength(0);
        });
    });

    it('should reduce product stock after order', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/products/${productId}`)
        .expect(200)
        .expect((res) => {
          // Original stock was 50, ordered 2
          expect(res.body.data.stock).toBe(48);
        });
    });
  });
});
