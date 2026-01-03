import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

interface ItemResponse {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  quantity: number;
  category: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedItemsResponse {
  data: ItemResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}

describe('Items (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply the same validation pipe as in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    // Clean up the database before each test
    await prisma.item.deleteMany();
  });

  afterAll(async () => {
    // Clean up and close connections
    await prisma.item.deleteMany();
    await app.close();
  });

  describe('POST /items', () => {
    it('should create a new item', async () => {
      const createItemDto = {
        name: 'Test Item',
        description: 'Test description',
        price: 29.99,
        quantity: 100,
        category: 'electronics',
      };

      const response = await request(app.getHttpServer())
        .post('/items')
        .send(createItemDto)
        .expect(201);

      const body = response.body as ItemResponse;
      expect(typeof body.id).toBe('string');
      expect(body.name).toBe(createItemDto.name);
      expect(body.description).toBe(createItemDto.description);
      expect(body.price).toBe(createItemDto.price);
      expect(body.quantity).toBe(createItemDto.quantity);
      expect(body.category).toBe(createItemDto.category);
      expect(body.isActive).toBe(true);
    });

    it('should create an item with minimal data', async () => {
      const createItemDto = {
        name: 'Minimal Item',
      };

      const response = await request(app.getHttpServer())
        .post('/items')
        .send(createItemDto)
        .expect(201);

      const body = response.body as ItemResponse;
      expect(body.name).toBe('Minimal Item');
      expect(body.quantity).toBe(0);
      expect(body.isActive).toBe(true);
    });

    it('should fail with validation error for missing name', async () => {
      const response = await request(app.getHttpServer())
        .post('/items')
        .send({})
        .expect(400);

      const body = response.body as ErrorResponse;
      expect(body.message).toContain('name should not be empty');
    });

    it('should fail with validation error for short name', async () => {
      const response = await request(app.getHttpServer())
        .post('/items')
        .send({ name: 'A' })
        .expect(400);

      const body = response.body as ErrorResponse;
      expect(body.message).toContain(
        'name must be longer than or equal to 2 characters',
      );
    });

    it('should fail with validation error for negative price', async () => {
      const response = await request(app.getHttpServer())
        .post('/items')
        .send({ name: 'Test Item', price: -10 })
        .expect(400);

      const body = response.body as ErrorResponse;
      expect(body.message).toContain('price must not be less than 0');
    });
  });

  describe('GET /items', () => {
    beforeEach(async () => {
      // Create test items
      await prisma.item.createMany({
        data: [
          {
            name: 'Item 1',
            category: 'electronics',
            price: 10.0,
            quantity: 5,
          },
          {
            name: 'Item 2',
            category: 'books',
            price: 20.0,
            quantity: 10,
          },
          {
            name: 'Item 3',
            category: 'electronics',
            price: 30.0,
            quantity: 15,
          },
        ],
      });
    });

    it('should return paginated items', async () => {
      const response = await request(app.getHttpServer())
        .get('/items')
        .expect(200);

      const body = response.body as PaginatedItemsResponse;
      expect(body.data).toHaveLength(3);
      expect(body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 3,
        pages: 1,
      });
    });

    it('should filter by search term', async () => {
      const response = await request(app.getHttpServer())
        .get('/items')
        .query({ search: 'Item 1' })
        .expect(200);

      const body = response.body as PaginatedItemsResponse;
      expect(body.data).toHaveLength(1);
      expect(body.data[0].name).toBe('Item 1');
    });

    it('should filter by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/items')
        .query({ category: 'electronics' })
        .expect(200);

      const body = response.body as PaginatedItemsResponse;
      expect(body.data).toHaveLength(2);
      expect(body.data.every((item) => item.category === 'electronics')).toBe(
        true,
      );
    });

    it('should sort by price ascending', async () => {
      const response = await request(app.getHttpServer())
        .get('/items')
        .query({ sort: 'price', order: 'asc' })
        .expect(200);

      const body = response.body as PaginatedItemsResponse;
      const prices = body.data.map((item) => item.price);
      expect(prices).toEqual([10, 20, 30]);
    });

    it('should paginate correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/items')
        .query({ page: 1, limit: 2 })
        .expect(200);

      const body = response.body as PaginatedItemsResponse;
      expect(body.data).toHaveLength(2);
      expect(body.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: 3,
        pages: 2,
      });
    });
  });

  describe('GET /items/:id', () => {
    let testItemId: string;

    beforeEach(async () => {
      const item = await prisma.item.create({
        data: {
          name: 'Test Item',
          description: 'Test description',
          price: 29.99,
          quantity: 100,
          category: 'electronics',
        },
      });
      testItemId = item.id;
    });

    it('should return an item by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/items/${testItemId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testItemId,
        name: 'Test Item',
        description: 'Test description',
      });
    });

    it('should return 404 for non-existent item', async () => {
      const response = await request(app.getHttpServer())
        .get('/items/550e8400-e29b-41d4-a716-446655440000')
        .expect(404);

      const body = response.body as ErrorResponse;
      expect(body.message).toContain('not found');
    });

    it('should return 400 for invalid UUID', async () => {
      await request(app.getHttpServer()).get('/items/invalid-uuid').expect(400);
    });
  });

  describe('PUT /items/:id', () => {
    let testItemId: string;

    beforeEach(async () => {
      const item = await prisma.item.create({
        data: {
          name: 'Original Item',
          price: 10.0,
          quantity: 5,
        },
      });
      testItemId = item.id;
    });

    it('should update an item', async () => {
      const updateDto = {
        name: 'Updated Item',
        price: 25.0,
      };

      const response = await request(app.getHttpServer())
        .put(`/items/${testItemId}`)
        .send(updateDto)
        .expect(200);

      const body = response.body as ItemResponse;
      expect(body.name).toBe('Updated Item');
      expect(body.price).toBe(25.0);
    });

    it('should return 404 for non-existent item', async () => {
      await request(app.getHttpServer())
        .put('/items/550e8400-e29b-41d4-a716-446655440000')
        .send({ name: 'Updated' })
        .expect(404);
    });
  });

  describe('PATCH /items/:id', () => {
    let testItemId: string;

    beforeEach(async () => {
      const item = await prisma.item.create({
        data: {
          name: 'Original Item',
          description: 'Original description',
          price: 10.0,
          quantity: 5,
        },
      });
      testItemId = item.id;
    });

    it('should partially update an item', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/items/${testItemId}`)
        .send({ name: 'Patched Item' })
        .expect(200);

      const body = response.body as ItemResponse;
      expect(body.name).toBe('Patched Item');
      // Other fields should remain unchanged
      expect(body.price).toBe(10.0);
    });
  });

  describe('DELETE /items/:id', () => {
    let testItemId: string;

    beforeEach(async () => {
      const item = await prisma.item.create({
        data: {
          name: 'Item to Delete',
        },
      });
      testItemId = item.id;
    });

    it('should delete an item', async () => {
      await request(app.getHttpServer())
        .delete(`/items/${testItemId}`)
        .expect(204);

      // Verify item is deleted
      const deletedItem = await prisma.item.findUnique({
        where: { id: testItemId },
      });
      expect(deletedItem).toBeNull();
    });

    it('should return 404 for non-existent item', async () => {
      await request(app.getHttpServer())
        .delete('/items/550e8400-e29b-41d4-a716-446655440000')
        .expect(404);
    });
  });
});
