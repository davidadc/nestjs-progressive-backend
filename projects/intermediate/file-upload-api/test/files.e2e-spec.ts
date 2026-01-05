import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('FilesController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;
  let uploadedFileId: string;

  const testUser = {
    email: `filetest-${Date.now()}@example.com`,
    password: 'SecurePass123!',
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
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Register and login test user
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser);

    accessToken = registerResponse.body.data.accessToken;
    userId = registerResponse.body.data.user.id;
  });

  afterAll(async () => {
    // Clean up: delete files first (due to FK constraint), then user
    await prisma.file.deleteMany({
      where: { userId },
    });
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
    await app.close();
  });

  describe('/api/v1/files/upload (POST)', () => {
    it('should upload a text file', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/files/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from('test content'), 'test.txt')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.originalName).toBe('test.txt');
      expect(response.body.data.mimeType).toBe('text/plain');
      expect(response.body.data.isImage).toBe(false);

      uploadedFileId = response.body.data.id;
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/files/upload')
        .attach('file', Buffer.from('test'), 'test.txt')
        .expect(401);
    });

    it('should fail without file', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/files/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with unsupported MIME type', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/files/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from('test'), {
          filename: 'test.exe',
          contentType: 'application/x-msdownload',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('/api/v1/files (GET)', () => {
    it('should list files with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/files')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('pagination');
    });

    it('should support pagination parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/files?page=1&limit=5')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer()).get('/api/v1/files').expect(401);
    });
  });

  describe('/api/v1/files/:id (GET)', () => {
    it('should get file details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/files/${uploadedFileId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(uploadedFileId);
    });

    it('should return 404 for non-existent file', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/files/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('/api/v1/files/:id/download (GET)', () => {
    it('should download file', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/files/${uploadedFileId}/download`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.header['content-disposition']).toContain('attachment');
      expect(response.text).toBe('test content');
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/files/${uploadedFileId}/download`)
        .expect(401);
    });
  });

  describe('/api/v1/files/storage (GET)', () => {
    it('should get storage usage', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/files/storage')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('used');
      expect(response.body.data).toHaveProperty('limit');
      expect(response.body.data).toHaveProperty('available');
      expect(response.body.data).toHaveProperty('usagePercentage');
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/files/storage')
        .expect(401);
    });
  });

  describe('/api/v1/files/:id (DELETE)', () => {
    it('should delete file', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/files/${uploadedFileId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      // Verify file is deleted
      await request(app.getHttpServer())
        .get(`/api/v1/files/${uploadedFileId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/files/some-id')
        .expect(401);
    });

    it('should return 404 for non-existent file', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/files/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('File access control', () => {
    let otherUserToken: string;
    let fileForAccessTest: string;

    beforeAll(async () => {
      // Create another user
      const otherUser = {
        email: `other-${Date.now()}@example.com`,
        password: 'OtherPass123!',
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(otherUser);

      otherUserToken = registerResponse.body.data.accessToken;

      // Upload a file with the original user
      const uploadResponse = await request(app.getHttpServer())
        .post('/api/v1/files/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from('private content'), 'private.txt');

      fileForAccessTest = uploadResponse.body.data.id;
    });

    it('should deny access to other user files', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/files/${fileForAccessTest}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);
    });

    it('should deny download of other user files', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/files/${fileForAccessTest}/download`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);
    });

    it('should deny deletion of other user files', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/files/${fileForAccessTest}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);
    });
  });
});
