# AI_CONTEXT.md - Context for Claude Code

## Project Information

**Name:** File Upload API
**Level:** Intermediate
**Description:** API for file upload and management with dual storage (local/S3), thumbnails, and user ownership
**ORM:** Prisma
**Stack:** NestJS + TypeScript + PostgreSQL + Prisma + Sharp + Multer + AWS S3

---

## Project Structure

### Intermediate Level (Modular + Clean Architecture)

```
src/
├── auth/
│   ├── auth.module.ts
│   ├── domain/
│   │   └── entities/
│   ├── application/
│   │   ├── dto/
│   │   │   ├── register.dto.ts
│   │   │   └── login.dto.ts
│   │   └── services/
│   │       └── auth.service.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── auth.controller.ts
│       ├── guards/
│       │   └── jwt-auth.guard.ts
│       └── strategies/
│           └── jwt.strategy.ts
├── users/
│   ├── users.module.ts
│   ├── domain/
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   └── repositories/
│   │       └── user.repository.interface.ts
│   └── infrastructure/
│       └── persistence/
│           └── user.repository.ts
├── files/
│   ├── files.module.ts
│   ├── domain/
│   │   ├── entities/
│   │   │   └── file.entity.ts
│   │   ├── repositories/
│   │   │   └── file.repository.interface.ts
│   │   ├── strategies/
│   │   │   └── storage.strategy.interface.ts
│   │   └── exceptions/
│   │       └── file.exceptions.ts
│   ├── application/
│   │   ├── dto/
│   │   │   ├── upload-file.dto.ts
│   │   │   ├── file-response.dto.ts
│   │   │   └── file-query.dto.ts
│   │   ├── services/
│   │   │   ├── file.service.ts
│   │   │   └── thumbnail.service.ts
│   │   ├── use-cases/
│   │   │   ├── upload-file.use-case.ts
│   │   │   ├── get-files.use-case.ts
│   │   │   ├── download-file.use-case.ts
│   │   │   ├── delete-file.use-case.ts
│   │   │   └── get-thumbnail.use-case.ts
│   │   └── mappers/
│   │       └── file.mapper.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── files.controller.ts
│       ├── persistence/
│       │   └── file.repository.ts
│       ├── storage/
│       │   ├── local.storage.strategy.ts
│       │   ├── s3.storage.strategy.ts
│       │   └── storage.factory.ts
│       ├── interceptors/
│       │   └── file-upload.interceptor.ts
│       └── config/
│           └── multer.config.ts
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── api-file.decorator.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── interceptors/
│   │   └── response.interceptor.ts
│   └── pipes/
│       └── file-validation.pipe.ts
├── config/
│   ├── app.config.ts
│   ├── database.config.ts
│   ├── jwt.config.ts
│   ├── storage.config.ts
│   └── upload.config.ts
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── app.module.ts
└── main.ts
```

---

## Architecture

### Intermediate (4 layers)

```
Controller → UseCase/Service → Domain → Repository
```

**Patterns Used:**

- Strategy Pattern (Storage: Local vs S3)
- Repository Pattern (Data access abstraction)
- Factory Pattern (StorageFactory)
- Adapter Pattern (S3 client wrapper)
- Facade Pattern (FileService)
- Decorator Pattern (Custom validators)

**Flow:**

```
HTTP Request (multipart/form-data)
    ↓
Controller (validates file, extracts metadata)
    ↓
UseCase (business logic, storage quota check)
    ↓
Storage Strategy (Local or S3)
    ↓
Repository (persist file metadata)
    ↓
Database (Prisma/PostgreSQL)
```

---

## Entities

### User Entity

```typescript
export class User {
  id: string;
  email: string;
  password: string;        // Hashed with bcrypt
  storageUsed: number;     // Bytes used
  storageLimit: number;    // Max bytes allowed
  createdAt: Date;
  updatedAt: Date;
}
```

### File Entity

```typescript
export class File {
  id: string;
  userId: string;
  originalName: string;
  storagePath: string;     // UUID-based path
  storageType: 'local' | 's3';
  mimeType: string;
  size: number;
  isImage: boolean;
  thumbnailPath: string | null;
  uploadedAt: Date;
}
```

### DTOs

**UploadFileDto** (input - multipart)
- file: Express.Multer.File (required, max 10MB)

**FileResponseDto** (output)
- id: string
- originalName: string
- mimeType: string
- size: number
- url: string
- thumbnailUrl: string | null
- uploadedAt: Date

**FileQueryDto** (list query)
- page: number (default: 1)
- limit: number (default: 10)
- mimeType: string (optional filter)
- search: string (optional, search by name)

---

## Security Requirements

### Authentication

- [x] JWT tokens (access token, 15 min expiration)
- [x] Password hashing (bcrypt, 10 rounds)
- [x] Rate limiting on upload endpoint

### Authorization

- [x] All file endpoints require authentication
- [x] Resource ownership validation (users can only access their files)

### Validation

- [x] DTOs with class-validator
- [x] File type validation (MIME type + magic bytes)
- [x] File size validation (max 10MB)
- [x] Storage quota validation

### Error Handling

- [x] Consistent error responses with envelope
- [x] No stack traces in production
- [x] Meaningful error messages

---

## Endpoints

### POST /api/v1/auth/register

**Description:** Register a new user

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "storageLimit": 104857600
  }
}
```

### POST /api/v1/auth/login

**Description:** Login and get JWT token

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "accessToken": "jwt.token.here",
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    }
  }
}
```

### POST /api/v1/files/upload

**Description:** Upload a file (multipart/form-data)

**Request:** `multipart/form-data` with `file` field

**Success (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": "file-uuid",
    "originalName": "image.png",
    "mimeType": "image/png",
    "size": 102400,
    "url": "/api/v1/files/file-uuid/download",
    "thumbnailUrl": "/api/v1/files/file-uuid/thumbnail",
    "uploadedAt": "2026-01-05T10:00:00Z"
  }
}
```

**Error (413 - File too large):**
```json
{
  "success": false,
  "statusCode": 413,
  "message": "File size exceeds maximum limit of 10MB",
  "error": "PayloadTooLargeException"
}
```

### GET /api/v1/files

**Description:** List user's files with pagination

**Query Params:** `?page=1&limit=10&mimeType=image/png&search=photo`

**Success (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

### GET /api/v1/files/:id/download

**Description:** Download a file

**Success:** File stream with appropriate Content-Type header

### GET /api/v1/files/:id/thumbnail

**Description:** Get thumbnail for an image file

**Success:** Thumbnail image (200x200 WebP)

**Error (400 - Not an image):**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Thumbnails are only available for image files",
  "error": "BadRequestException"
}
```

### DELETE /api/v1/files/:id

**Description:** Delete a file

**Success (204):** No content

---

## Testing Strategy

### Unit Tests (80% minimum coverage)

```typescript
describe('FileService', () => {
  describe('upload', () => {
    it('should upload file and create database record');
    it('should generate thumbnail for image files');
    it('should throw error when storage quota exceeded');
    it('should throw error for invalid MIME type');
  });
});

describe('LocalStorageStrategy', () => {
  describe('save', () => {
    it('should save file to uploads directory');
    it('should create unique filename');
  });
  describe('delete', () => {
    it('should remove file from filesystem');
  });
});

describe('S3StorageStrategy', () => {
  describe('save', () => {
    it('should upload file to S3 bucket');
  });
  describe('getSignedUrl', () => {
    it('should return presigned download URL');
  });
});
```

### E2E Tests

```typescript
describe('Files Endpoints', () => {
  describe('POST /api/v1/files/upload', () => {
    it('should upload file successfully');
    it('should reject unauthenticated requests');
    it('should reject files exceeding size limit');
    it('should reject invalid file types');
  });

  describe('GET /api/v1/files/:id/download', () => {
    it('should download file');
    it('should return 404 for non-existent file');
    it('should return 403 for other user files');
  });
});
```

---

## Dependencies

### Core

```json
{
  "@nestjs/common": "^10.0.0",
  "@nestjs/core": "^10.0.0",
  "@nestjs/platform-express": "^10.0.0",
  "@nestjs/config": "^3.0.0",
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.1"
}
```

### Authentication

```json
{
  "@nestjs/jwt": "^10.0.0",
  "@nestjs/passport": "^10.0.0",
  "passport": "^0.7.0",
  "passport-jwt": "^4.0.1",
  "bcrypt": "^5.1.0"
}
```

### Database (Prisma)

```json
{
  "@prisma/client": "^5.0.0"
}
// Dev: "prisma": "^5.0.0"
```

### File Handling

```json
{
  "multer": "^1.4.5",
  "@types/multer": "^1.4.11",
  "sharp": "^0.33.0",
  "mime-types": "^2.1.35",
  "uuid": "^9.0.0"
}
```

### AWS S3 (Optional)

```json
{
  "@aws-sdk/client-s3": "^3.500.0",
  "@aws-sdk/s3-request-presigner": "^3.500.0"
}
```

### Documentation

```json
{
  "@nestjs/swagger": "^7.0.0",
  "swagger-ui-express": "^5.0.0"
}
```

---

## Configuration (.env)

```bash
# Database
DATABASE_URL=postgresql://dev:dev@localhost:5432/practice_db

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=900

# Storage
STORAGE_TYPE=local
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain

# S3 (when STORAGE_TYPE=s3)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name

# Thumbnails
THUMBNAIL_WIDTH=200
THUMBNAIL_HEIGHT=200

# User Quota
DEFAULT_STORAGE_LIMIT=104857600

# App
NODE_ENV=development
PORT=3000
```

---

## Code Conventions

### Naming

- Controllers: `*.controller.ts`
- Services: `*.service.ts`
- Repositories: `*.repository.ts`
- DTOs: `*.dto.ts`
- Entities: `*.entity.ts`
- Use Cases: `*.use-case.ts`
- Strategies: `*.strategy.ts`
- Interfaces: `*.interface.ts`

### Style

- Strict TypeScript
- Prettier + ESLint
- 2 spaces indentation

---

## Workflow with Claude Code

### 1. Setup

```
"Create the folder and file structure for File Upload API with intermediate-level Clean Architecture"
```

### 2. Domain Layer

```
"Implement File entity, IFileRepository interface, and IStorageStrategy interface"
```

### 3. Application Layer

```
"Implement DTOs, FileService, ThumbnailService, and upload/download use cases"
```

### 4. Infrastructure Layer

```
"Implement FilesController with Swagger docs, LocalStorageStrategy, and S3StorageStrategy"
```

### 5. Testing

```
"Create unit tests for FileService and storage strategies, and E2E tests for file endpoints"
```

---

## Storage Strategy Interface

```typescript
export interface IStorageStrategy {
  save(file: Express.Multer.File, filename: string): Promise<string>;
  get(path: string): Promise<Buffer>;
  getStream(path: string): ReadableStream;
  delete(path: string): Promise<void>;
  getUrl(path: string): Promise<string>;
}
```

The factory creates the appropriate strategy based on `STORAGE_TYPE` env var:

```typescript
@Injectable()
export class StorageFactory {
  create(): IStorageStrategy {
    if (process.env.STORAGE_TYPE === 's3') {
      return new S3StorageStrategy(s3Client, bucket);
    }
    return new LocalStorageStrategy(uploadDir);
  }
}
```

---

## Learning Goals

Upon completing this project:

- [x] Understand multipart file uploads with Multer
- [x] Implement Strategy pattern for pluggable storage backends
- [x] Use Sharp for image processing and thumbnail generation
- [x] Handle file streaming for downloads
- [x] Implement per-user storage quotas
- [x] Apply Clean Architecture in a NestJS context

---

## Next Steps

After completion:

1. Add file sharing with expiring links
2. Implement bulk upload
3. Add folder organization
4. Integrate ClamAV for malware scanning

Then proceed to: **Advanced Level Projects**

---

## Quick Reference

**Where does X go?**

- Business logic → `src/files/application/services/` or `src/files/application/use-cases/`
- DTOs → `src/files/application/dto/`
- Database access → `src/files/infrastructure/persistence/`
- Endpoints → `src/files/infrastructure/controllers/`
- Domain entities → `src/files/domain/entities/`
- Storage strategies → `src/files/infrastructure/storage/`

**ORM Commands (Prisma):**

```bash
pnpm exec prisma generate
pnpm exec prisma migrate dev --name migration_name
pnpm exec prisma studio
```

---

**Last updated:** 2026-01-05
