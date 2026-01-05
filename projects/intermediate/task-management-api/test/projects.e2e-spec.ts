import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('ProjectsController (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;
  let adminToken: string;
  let userToken: string;
  let projectId: string;

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
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    // Create admin user
    const adminEmail = `e2e_admin_${Date.now()}@example.com`;
    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: adminEmail,
        password: 'Admin123!',
        name: 'E2E Admin',
        role: 'ADMIN',
      });
    adminToken = adminRes.body.data?.accessToken;

    // Create regular user
    const userEmail = `e2e_user_${Date.now()}@example.com`;
    const userRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: userEmail,
        password: 'User123!',
        name: 'E2E User',
      });
    userToken = userRes.body.data?.accessToken;
  });

  afterAll(async () => {
    // Clean up test data
    await prismaService.project.deleteMany({
      where: { name: { contains: 'E2E Test' } },
    });
    await prismaService.user.deleteMany({
      where: { email: { contains: 'e2e_' } },
    });
    await app.close();
  });

  describe('/api/v1/projects (POST)', () => {
    it('should create a project as admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'E2E Test Project',
          description: 'A project for E2E testing',
        })
        .expect(201);

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('E2E Test Project');
      projectId = res.body.data.id;
    });

    it('should return 403 for regular user creating project', () => {
      return request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Unauthorized Project',
          description: 'This should fail',
        })
        .expect(403);
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/projects')
        .send({
          name: 'No Auth Project',
          description: 'This should fail',
        })
        .expect(401);
    });
  });

  describe('/api/v1/projects (GET)', () => {
    it('should list projects for authenticated user', () => {
      return request(app.getHttpServer())
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeInstanceOf(Array);
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/projects')
        .expect(401);
    });
  });

  describe('/api/v1/projects/:id (GET)', () => {
    it('should get project by id', async () => {
      if (!projectId) return;

      return request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.id).toBe(projectId);
        });
    });

    it('should return 404 for non-existent project', () => {
      return request(app.getHttpServer())
        .get('/api/v1/projects/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('/api/v1/projects/:id (PATCH)', () => {
    it('should update project as owner', async () => {
      if (!projectId) return;

      return request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'E2E Test Project Updated',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.name).toBe('E2E Test Project Updated');
        });
    });
  });

  describe('/api/v1/projects/:id (DELETE)', () => {
    it('should delete project as owner', async () => {
      // Create a project to delete
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'E2E Test Project To Delete',
          description: 'Will be deleted',
        });

      const deleteProjectId = createRes.body.data?.id;
      if (!deleteProjectId) return;

      return request(app.getHttpServer())
        .delete(`/api/v1/projects/${deleteProjectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });
  });
});
