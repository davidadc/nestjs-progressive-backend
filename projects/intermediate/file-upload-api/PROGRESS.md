# File Upload API - Implementation Progress

**Project:** file-upload-api
**Level:** Intermediate
**ORM:** Prisma
**Architecture:** 4-Layer Clean Architecture (Controller → UseCase/Service → Domain → Repository)

---

## Project Overview

**Description:** API for file upload and management with support for local and cloud (S3) storage, image thumbnail generation, and user-based file ownership.

**Technical Requirements:**

- JWT Authentication with user registration/login
- Multipart form-data handling with Multer
- File type validation (MIME types)
- Dual storage strategy (Local + AWS S3) via Strategy Pattern
- Image thumbnail generation using Sharp
- File size limits (configurable)
- Storage quota per user
- Secure file serving

---

## Implementation Status

### Phase 1: Project Scaffolding

- [x] Initialize NestJS project with CLI
- [x] Install core dependencies
  - [x] @nestjs/platform-express
  - [x] @nestjs/config
  - [x] @nestjs/jwt, @nestjs/passport, passport-jwt
  - [x] class-validator, class-transformer
  - [x] @nestjs/swagger, swagger-ui-express
- [x] Install file handling dependencies
  - [x] multer, @types/multer
  - [x] sharp
  - [x] @aws-sdk/client-s3 (for S3 storage)
  - [x] uuid
  - [x] mime-types
- [x] Install database dependencies
  - [x] @prisma/client (v7.2.0)
  - [x] @prisma/adapter-pg (for Prisma 7 adapter)
  - [x] pg (PostgreSQL driver)
  - [x] prisma (dev, v7.2.0)
- [x] Create .env and .env.example files
- [x] Set up folder structure (Clean Architecture)

### Phase 2: Database Setup (Prisma 7)

- [x] Initialize Prisma (`npx prisma init`)
- [x] Configure Prisma 7 adapter pattern
  - [x] Create `prisma/prisma.config.ts` for migrations
  - [x] Update `PrismaService` with `@prisma/adapter-pg` and `pg` Pool
- [x] Define models in schema.prisma
  - [x] User model (id, email, password, storageUsed, storageLimit, createdAt, updatedAt)
  - [x] File model (id, userId, originalName, storagePath, storageType, mimeType, size, isImage, thumbnailPath, uploadedAt)
- [x] Run initial migration
- [x] Generate Prisma client
- [x] Create PrismaModule and PrismaService

### Phase 3: Domain Layer

- [x] Create domain entities
  - [x] src/files/domain/entities/file.entity.ts
  - [x] src/users/domain/entities/user.entity.ts
- [x] Create repository interfaces
  - [x] src/files/domain/repositories/file.repository.interface.ts
  - [x] src/users/domain/repositories/user.repository.interface.ts
- [x] Create storage strategy interface
  - [x] src/files/domain/strategies/storage.strategy.interface.ts
- [x] Create domain exceptions
  - [x] src/files/domain/exceptions/file.exceptions.ts

### Phase 4: Application Layer

- [x] Create DTOs with validation
  - [x] src/files/application/dto/file-response.dto.ts
  - [x] src/files/application/dto/file-query.dto.ts
  - [x] src/auth/application/dto/register.dto.ts
  - [x] src/auth/application/dto/login.dto.ts
  - [x] ~~upload-file.dto.ts~~ - Not needed (using Multer file directly)
- [x] Create file service
  - [x] src/files/application/services/file.service.ts
  - [x] ~~Separate use-cases~~ - Consolidated into FileService for simplicity
- [x] Create mappers
  - [x] src/files/application/mappers/file.mapper.ts
- [x] Create thumbnail service
  - [x] src/files/application/services/thumbnail.service.ts

### Phase 5: Infrastructure Layer

- [x] Create storage strategies (Strategy Pattern)
  - [x] src/files/infrastructure/storage/local.storage.strategy.ts
  - [x] src/files/infrastructure/storage/s3.storage.strategy.ts
  - [x] src/files/infrastructure/storage/storage.factory.ts
- [x] Create repository implementations
  - [x] src/files/infrastructure/persistence/file.repository.ts
  - [x] src/users/infrastructure/persistence/user.repository.ts
- [x] Create controllers with Swagger docs
  - [x] src/files/infrastructure/controllers/files.controller.ts
  - [x] src/auth/infrastructure/controllers/auth.controller.ts
- [x] Create auth guards
  - [x] src/auth/infrastructure/guards/jwt-auth.guard.ts
  - [x] src/auth/infrastructure/strategies/jwt.strategy.ts
- [x] ~~Custom file interceptor~~ - Using NestJS FileInterceptor with inline config
- [x] ~~Multer configuration file~~ - Using inline config in controller

### Phase 6: Common Module

- [x] Create custom decorators
  - [x] src/common/decorators/current-user.decorator.ts
  - [x] src/common/decorators/public.decorator.ts
  - [x] ~~api-file.decorator~~ - Using @ApiConsumes/@ApiBody inline
- [x] ~~File validation pipe~~ - Validation done in FileService
- [x] Create exception filters
  - [x] src/common/filters/http-exception.filter.ts
- [x] Create response interceptor
  - [x] src/common/interceptors/response.interceptor.ts

### Phase 7: Configuration

- [x] Create typed configuration files
  - [x] src/config/app.config.ts
  - [x] src/config/jwt.config.ts
  - [x] src/config/storage.config.ts
  - [x] src/config/upload.config.ts
  - [x] src/config/env.validation.ts (Joi schema)
  - [x] src/config/index.ts (exports)
- [x] Wire up ConfigModule with typed configs
- [x] Set up environment validation with Joi

### Phase 8: Module Integration

- [x] Create feature modules
  - [x] src/files/files.module.ts
  - [x] src/auth/auth.module.ts
  - [x] src/users/users.module.ts
- [x] Update AppModule with all imports
- [x] Configure main.ts with:
  - [x] Swagger documentation at /api
  - [x] Global ValidationPipe
  - [x] Global exception filter
  - [x] Global response interceptor
  - [x] CORS configuration
  - [x] ~~Static file serving~~ - Files served via authenticated download endpoint

### Phase 9: API Integration Testing (Scripts)

> Quick validation of endpoints using shell scripts before formal testing.

- [x] Create `scripts/` directory
- [x] Create `seed-data.sh` for test data population
  - [x] Create test user accounts
  - [x] Upload sample files for testing
  - [x] Add cleanup/reset function
- [x] Create `test-api.sh` for endpoint testing
  - [x] Health check verification
  - [x] Auth endpoints (register, login)
  - [x] File upload with different file types
  - [x] File listing with pagination
  - [x] File download
  - [x] Thumbnail retrieval
  - [x] File deletion
  - [x] Error handling (404, 401, 413, validation errors)
  - [x] Test summary with pass/fail counters
- [x] Create user journey tests
  - [x] Journey: New User - Complete file workflow (Register → Login → Upload → List → Download → Delete)
  - [x] Journey: User - Image upload with thumbnail (Login → Upload image → Get thumbnail → Verify)
  - [x] ~~Journey: Storage quota~~ - Better suited for unit tests (would require uploading 100MB)
  - [x] Journey: Unauthorized access (Try to access/delete another user's files → 403)
- [x] Make scripts executable (`chmod +x`)

### Phase 10: Unit & E2E Testing

- [x] Create unit tests for services
  - [x] file.service.spec.ts (15 tests, 95.94% coverage)
  - [x] thumbnail.service.spec.ts (11 tests, 100% coverage)
  - [x] auth.service.spec.ts (9 tests, 100% coverage)
- [x] ~~Create unit tests for use-cases~~ - Use-cases consolidated into services (Phase 4)
- [x] Create unit tests for storage strategies
  - [x] local.storage.strategy.spec.ts (10 tests, 97.29% coverage)
  - [x] s3.storage.strategy.spec.ts (11 tests, 97.77% coverage)
- [x] Create E2E tests with Jest/Supertest
  - [x] auth.e2e-spec.ts (12 tests)
  - [x] files.e2e-spec.ts (17 tests)
- [x] Achieve 80%+ coverage on core logic (95%+ on services and strategies)

### Phase 11: Documentation

- [x] Swagger API documentation complete
- [x] PROGRESS.md updated (this file)
- [x] AI_CONTEXT.md created
- [x] README.md with setup instructions

---

## Endpoints

| Method | Endpoint | Description | Auth Required |
| ------ | -------- | ----------- | ------------- |
| POST | `/api/v1/auth/register` | Register new user | No |
| POST | `/api/v1/auth/login` | Login user | No |
| GET | `/api/v1/auth/profile` | Get current user profile | Yes |
| POST | `/api/v1/files/upload` | Upload file | Yes |
| GET | `/api/v1/files` | List my files (paginated) | Yes |
| GET | `/api/v1/files/:id` | Get file details | Yes |
| GET | `/api/v1/files/:id/download` | Download file | Yes |
| GET | `/api/v1/files/:id/thumbnail` | Get image thumbnail | Yes |
| DELETE | `/api/v1/files/:id` | Delete file | Yes |
| GET | `/api/v1/files/storage` | Get storage usage | Yes |

---

## Entities / Models

```typescript
// User
{
  id: string;           // UUID
  email: string;        // Unique
  password: string;     // Hashed with bcrypt
  storageUsed: number;  // Bytes used
  storageLimit: number; // Max bytes allowed (default: 100MB)
  createdAt: Date;
  updatedAt: Date;
}

// File
{
  id: string;           // UUID
  userId: string;       // FK to User
  originalName: string; // Original filename
  storagePath: string;  // Path in storage (local path or S3 key)
  storageType: string;  // 'local' | 's3'
  mimeType: string;     // MIME type (e.g., 'image/png')
  size: number;         // File size in bytes
  isImage: boolean;     // Whether file is an image
  thumbnailPath: string | null; // Thumbnail path (for images)
  uploadedAt: Date;
}
```

---

## Folder Structure

```
file-upload-api/
├── src/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── domain/
│   │   │   └── entities/
│   │   ├── application/
│   │   │   ├── dto/
│   │   │   └── services/
│   │   └── infrastructure/
│   │       ├── controllers/
│   │       ├── guards/
│   │       └── strategies/
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   └── repositories/
│   │   └── infrastructure/
│   │       └── persistence/
│   ├── files/
│   │   ├── files.module.ts
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   ├── repositories/
│   │   │   ├── strategies/
│   │   │   └── exceptions/
│   │   ├── application/
│   │   │   ├── dto/
│   │   │   ├── services/
│   │   │   ├── use-cases/
│   │   │   └── mappers/
│   │   └── infrastructure/
│   │       ├── controllers/
│   │       ├── persistence/
│   │       ├── storage/
│   │       ├── interceptors/
│   │       └── config/
│   ├── common/
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── interceptors/
│   │   └── pipes/
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   ├── storage.config.ts
│   │   └── upload.config.ts
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   └── schema.prisma
├── uploads/              # Local file storage
├── scripts/
│   ├── seed-data.sh
│   └── test-api.sh
├── test/
│   ├── auth.e2e-spec.ts
│   └── files.e2e-spec.ts
├── .env
├── .env.example
├── package.json
├── tsconfig.json
├── nest-cli.json
├── AI_CONTEXT.md
├── PROGRESS.md
└── README.md
```

---

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://admin:admin@localhost:5432/file_upload_db

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=900

# Storage
STORAGE_TYPE=local                    # 'local' or 's3'
UPLOAD_DIR=./uploads                  # Local storage directory
MAX_FILE_SIZE=10485760                # 10MB in bytes
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain

# S3 (optional, for S3 storage)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name

# Thumbnails
THUMBNAIL_WIDTH=200
THUMBNAIL_HEIGHT=200

# User Storage Quota
DEFAULT_STORAGE_LIMIT=104857600       # 100MB in bytes

# App
NODE_ENV=development
PORT=3000
```

---

## Design Patterns Applied

1. **Strategy Pattern:** Storage strategies (LocalStorage, S3Storage) implementing common interface. Switchable via environment variable.

2. **Repository Pattern:** Abstract data access through repository interfaces. Prisma implementation behind the interface.

3. **Factory Pattern:** StorageFactory creates appropriate storage strategy based on configuration.

4. **Adapter Pattern:** S3 client wrapped in adapter conforming to our storage interface.

5. **Facade Pattern:** FileService provides simplified interface to upload/download/delete operations, hiding storage complexity.

6. **Decorator Pattern:** Custom decorators for file validation, current user extraction.

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Start PostgreSQL (from monorepo root)
docker-compose up -d postgres

# Run migrations
pnpm exec prisma migrate dev

# Create uploads directory (for local storage)
mkdir -p uploads

# Start development server
pnpm run start:dev

# Access Swagger docs
open http://localhost:3000/api

# Seed test data (optional)
./scripts/seed-data.sh

# Run API integration tests
./scripts/test-api.sh
```

---

## Test Coverage (Achieved)

```
auth.service.ts           | 100% statements
file.service.ts           | 95.94% statements
thumbnail.service.ts      | 100% statements
local.storage.strategy.ts | 97.29% statements
s3.storage.strategy.ts    | 97.77% statements
```

**Unit Tests:** 56 tests (5 test suites)
**E2E Tests:** 29 tests (2 test suites)

---

## Design Decisions

1. **Dual Storage Strategy:** Implemented both local and S3 storage using Strategy pattern. This allows easy switching between development (local) and production (S3) environments via environment variable, and makes adding new storage providers straightforward.

2. **Sharp for Thumbnails:** Chosen for its performance, modern format support (WebP, AVIF), and efficient memory usage compared to alternatives.

3. **User-based File Ownership:** Every file belongs to a user. Users can only access their own files. This enables per-user storage quotas and privacy.

4. **Storage Path Abstraction:** Files are stored with UUID-based paths, not original filenames. This prevents path traversal attacks and filename collisions.

5. **Lazy Thumbnail Generation:** Thumbnails are generated on upload for images, stored alongside originals. This trades storage space for faster subsequent access.

---

## Security Considerations

- [x] Validate MIME types on upload (both extension and magic bytes)
- [x] Sanitize original filenames
- [x] Use UUID for stored file paths (prevent path traversal)
- [x] Enforce file size limits
- [x] Enforce storage quota per user
- [x] JWT authentication for all file endpoints
- [x] Users can only access their own files
- [x] Rate limiting on upload endpoint (@nestjs/throttler)
- [x] CORS configuration for file serving

---

## Known Issues / TODOs

- [ ] Optional: Add ClamAV integration for malware scanning
- [ ] Optional: Add CDN integration for file serving
- [ ] Optional: Add file sharing feature (shareable links)
- [ ] Optional: Add folder/organization support
- [ ] Optional: Add bulk upload support

---

**Started:** 2026-01-05
**Completed:** 2026-01-05

All phases complete. Project is fully functional with:
- Core API implementation (Phases 1-8)
- API Integration Testing scripts (Phase 9): 58 tests passing
- Unit & E2E Testing (Phase 10): 85 tests total (56 unit + 29 E2E)
- Documentation (Phase 11): Swagger, README, PROGRESS.md, AI_CONTEXT.md
