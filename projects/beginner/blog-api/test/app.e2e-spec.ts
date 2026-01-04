import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PostsRepository } from '../src/posts/posts.repository';

describe('App (e2e)', () => {
  let app: INestApplication<App>;
  let postsRepository: Partial<PostsRepository>;

  beforeAll(async () => {
    postsRepository = {
      findAllPublished: jest.fn().mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PostsRepository)
      .useValue(postsRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/posts (GET) should return 200', () => {
    return request(app.getHttpServer()).get('/posts').expect(200);
  });

  it('/auth/register (POST) without body should return 400', () => {
    return request(app.getHttpServer()).post('/auth/register').expect(400);
  });

  it('/auth/login (POST) without body should return 400', () => {
    return request(app.getHttpServer()).post('/auth/login').expect(400);
  });
});
