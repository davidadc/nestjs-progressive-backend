import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('TasksController (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;
  let adminToken: string;
  let projectId: string;
  let taskId: string;

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
    const adminEmail = `e2e_tasks_admin_${Date.now()}@example.com`;
    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: adminEmail,
        password: 'Admin123!',
        name: 'E2E Tasks Admin',
        role: 'ADMIN',
      });
    adminToken = adminRes.body.data?.accessToken;

    // Create a project for tasks
    const projectRes = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'E2E Tasks Test Project',
        description: 'Project for task testing',
      });
    projectId = projectRes.body.data?.id;
  });

  afterAll(async () => {
    await prismaService.project.deleteMany({
      where: { name: { contains: 'E2E Tasks' } },
    });
    await prismaService.user.deleteMany({
      where: { email: { contains: 'e2e_tasks_' } },
    });
    await app.close();
  });

  describe('/api/v1/projects/:projectId/tasks (POST)', () => {
    it('should create a task in a project', async () => {
      if (!projectId) return;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'E2E Test Task',
          description: 'A task for E2E testing',
          priority: 'HIGH',
        })
        .expect(201);

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.title).toBe('E2E Test Task');
      expect(res.body.data.status).toBe('TODO');
      taskId = res.body.data.id;
    });

    it('should return 404 for non-existent project', () => {
      return request(app.getHttpServer())
        .post('/api/v1/projects/00000000-0000-0000-0000-000000000000/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Task',
          description: 'Description',
          priority: 'MEDIUM',
        })
        .expect(404);
    });
  });

  describe('/api/v1/tasks (GET)', () => {
    it('should list tasks', () => {
      return request(app.getHttpServer())
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body).toHaveProperty('pagination');
        });
    });

    it('should filter tasks by status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/tasks?status=TODO')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should filter tasks by priority', () => {
      return request(app.getHttpServer())
        .get('/api/v1/tasks?priority=HIGH')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('/api/v1/tasks/:id (GET)', () => {
    it('should get task by id', async () => {
      if (!taskId) return;

      return request(app.getHttpServer())
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.id).toBe(taskId);
        });
    });

    it('should return 404 for non-existent task', () => {
      return request(app.getHttpServer())
        .get('/api/v1/tasks/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('/api/v1/tasks/:id (PATCH)', () => {
    it('should update task', async () => {
      if (!taskId) return;

      return request(app.getHttpServer())
        .patch(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated E2E Test Task',
          priority: 'MEDIUM',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.title).toBe('Updated E2E Test Task');
          expect(res.body.data.priority).toBe('MEDIUM');
        });
    });
  });

  describe('/api/v1/tasks/:id/status (PATCH)', () => {
    it('should update task status', async () => {
      if (!taskId) return;

      return request(app.getHttpServer())
        .patch(`/api/v1/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'IN_PROGRESS',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.status).toBe('IN_PROGRESS');
        });
    });
  });

  describe('/api/v1/tasks/:id/comments (POST, GET)', () => {
    it('should add a comment to a task', async () => {
      if (!taskId) return;

      return request(app.getHttpServer())
        .post(`/api/v1/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          content: 'E2E test comment',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data.content).toBe('E2E test comment');
        });
    });

    it('should get comments for a task', async () => {
      if (!taskId) return;

      return request(app.getHttpServer())
        .get(`/api/v1/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeInstanceOf(Array);
        });
    });
  });

  describe('/api/v1/tasks/:id (DELETE)', () => {
    it('should delete task', async () => {
      if (!taskId) return;

      return request(app.getHttpServer())
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });
  });
});
