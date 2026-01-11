# ARCHITECTURE.md - File Upload API

## Project Architecture Overview

**Project:** File Upload API
**Level:** Intermediate
**Architecture Style:** Modular Clean Architecture (4-Layer)
**ORM:** Prisma
**Storage:** Local filesystem / AWS S3 (pluggable)

---

## Layer Structure

### Intermediate: 4-Layer Clean Architecture

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│  (Controllers, Pipes, Interceptors)     │
├─────────────────────────────────────────┤
│           Application Layer             │
│  (Use Cases, DTOs, Mappers, Services)   │
├─────────────────────────────────────────┤
│             Domain Layer                │
│  (Entities, Repository Interfaces,      │
│   Storage Strategy Interface)           │
├─────────────────────────────────────────┤
│         Infrastructure Layer            │
│  (Repositories, Storage Strategies)     │
└─────────────────────────────────────────┘
```

**Request Flow:**
```
HTTP Request (multipart) → Controller → UseCase → Storage Strategy → Repository → Database
```

---

## Folder Structure

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
│
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
│
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
│
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
│
├── config/
│   ├── app.config.ts
│   ├── database.config.ts
│   ├── jwt.config.ts
│   ├── storage.config.ts
│   └── upload.config.ts
│
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
│
├── app.module.ts
└── main.ts
```

---

## Design Patterns Required

### Intermediate Level Patterns

- [x] **Strategy Pattern** - Pluggable storage backends (Local vs S3)
- [x] **Repository Pattern** - Abstract Prisma behind interfaces
- [x] **Factory Pattern** - StorageFactory creates appropriate strategy
- [x] **Adapter Pattern** - S3 client wrapper
- [x] **Facade Pattern** - FileService simplifies file operations
- [x] **Decorator Pattern** - Custom validators, @ApiFile()
- [x] **Use Case Pattern** - Upload, Download, Delete operations

---

## Strategy Pattern (Storage)

### Storage Strategy Interface

```typescript
// domain/strategies/storage.strategy.interface.ts
export const STORAGE_STRATEGY = Symbol('STORAGE_STRATEGY');

export interface IStorageStrategy {
  /**
   * Save file to storage
   * @returns Storage path/key
   */
  save(file: Express.Multer.File, filename: string): Promise<string>;

  /**
   * Get file as buffer
   */
  get(path: string): Promise<Buffer>;

  /**
   * Get file as readable stream
   */
  getStream(path: string): NodeJS.ReadableStream;

  /**
   * Delete file from storage
   */
  delete(path: string): Promise<void>;

  /**
   * Get public or signed URL
   */
  getUrl(path: string): Promise<string>;
}
```

### Local Storage Strategy

```typescript
// infrastructure/storage/local.storage.strategy.ts
@Injectable()
export class LocalStorageStrategy implements IStorageStrategy {
  constructor(
    @Inject('UPLOAD_DIR') private readonly uploadDir: string,
  ) {}

  async save(file: Express.Multer.File, filename: string): Promise<string> {
    const filePath = path.join(this.uploadDir, filename);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, file.buffer);
    return filename;
  }

  async get(storagePath: string): Promise<Buffer> {
    const filePath = path.join(this.uploadDir, storagePath);
    return fs.promises.readFile(filePath);
  }

  getStream(storagePath: string): NodeJS.ReadableStream {
    const filePath = path.join(this.uploadDir, storagePath);
    return fs.createReadStream(filePath);
  }

  async delete(storagePath: string): Promise<void> {
    const filePath = path.join(this.uploadDir, storagePath);
    await fs.promises.unlink(filePath);
  }

  async getUrl(storagePath: string): Promise<string> {
    return `/api/v1/files/${storagePath}/download`;
  }
}
```

### S3 Storage Strategy

```typescript
// infrastructure/storage/s3.storage.strategy.ts
@Injectable()
export class S3StorageStrategy implements IStorageStrategy {
  constructor(
    private readonly s3Client: S3Client,
    @Inject('S3_BUCKET') private readonly bucket: string,
  ) {}

  async save(file: Express.Multer.File, filename: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: filename,
      Body: file.buffer,
      ContentType: file.mimetype,
    });
    await this.s3Client.send(command);
    return filename;
  }

  async get(storagePath: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: storagePath,
    });
    const response = await this.s3Client.send(command);
    return Buffer.from(await response.Body.transformToByteArray());
  }

  getStream(storagePath: string): NodeJS.ReadableStream {
    // Return S3 readable stream
  }

  async delete(storagePath: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: storagePath,
    });
    await this.s3Client.send(command);
  }

  async getUrl(storagePath: string): Promise<string> {
    // Generate presigned URL (valid for 1 hour)
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: storagePath,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }
}
```

### Storage Factory

```typescript
// infrastructure/storage/storage.factory.ts
@Injectable()
export class StorageFactory {
  constructor(
    private readonly configService: ConfigService,
    private readonly localStrategy: LocalStorageStrategy,
    private readonly s3Strategy: S3StorageStrategy,
  ) {}

  create(): IStorageStrategy {
    const storageType = this.configService.get('STORAGE_TYPE');

    switch (storageType) {
      case 's3':
        return this.s3Strategy;
      case 'local':
      default:
        return this.localStrategy;
    }
  }
}
```

---

## Layer Responsibilities

### Presentation Layer

**Purpose:** Handle HTTP requests, file uploads

**Contains:**
- Controllers
- File upload interceptors (Multer)
- File validation pipes
- Guards

**Rules:**
- NO business logic
- Handle multipart/form-data
- Validate file size, type

### Application Layer

**Purpose:** Business logic and orchestration

**Contains:**
- **Use Cases** - Upload, Download, Delete, GetThumbnail
- **Services** - FileService (facade), ThumbnailService
- **DTOs** - Request/response shapes
- **Mappers** - Entity ↔ DTO

**Rules:**
- NO infrastructure concerns
- Coordinate storage + repository
- Handle quota validation

### Domain Layer

**Purpose:** Core business rules

**Contains:**
- **Entities** - File, User
- **Repository Interfaces** - IFileRepository
- **Strategy Interfaces** - IStorageStrategy
- **Exceptions** - StorageQuotaExceededException, etc.

**Rules:**
- NO framework dependencies
- Business validation

### Infrastructure Layer

**Purpose:** Technical implementations

**Contains:**
- Storage strategies (Local, S3)
- Prisma repository
- Multer configuration
- Storage factory

---

## Upload Flow

### Sequence Diagram

```
┌────────┐     ┌────────────┐     ┌─────────────┐     ┌─────────────┐     ┌────────────┐
│ Client │     │ Controller │     │ UploadUseCase│     │StorageStrategy│   │ Repository │
└───┬────┘     └─────┬──────┘     └──────┬──────┘     └──────┬──────┘     └─────┬──────┘
    │                │                    │                   │                  │
    │  POST /upload  │                    │                   │                  │
    │  (multipart)   │                    │                   │                  │
    │───────────────>│                    │                   │                  │
    │                │                    │                   │                  │
    │                │ execute(file,user) │                   │                  │
    │                │───────────────────>│                   │                  │
    │                │                    │                   │                  │
    │                │                    │ check quota       │                  │
    │                │                    │──────────────────>│                  │
    │                │                    │                   │                  │
    │                │                    │ save(file)        │                  │
    │                │                    │──────────────────>│                  │
    │                │                    │                   │──────────────────│
    │                │                    │                   │    stored        │
    │                │                    │<──────────────────│                  │
    │                │                    │                   │                  │
    │                │                    │ generateThumbnail │                  │
    │                │                    │ (if image)        │                  │
    │                │                    │                   │                  │
    │                │                    │ save(metadata)    │                  │
    │                │                    │─────────────────────────────────────>│
    │                │                    │                   │                  │
    │                │   FileResponseDto  │                   │                  │
    │                │<───────────────────│                   │                  │
    │                │                    │                   │                  │
    │   201 Created  │                    │                   │                  │
    │<───────────────│                    │                   │                  │
```

---

## Thumbnail Service

### Image Processing with Sharp

```typescript
// application/services/thumbnail.service.ts
@Injectable()
export class ThumbnailService {
  constructor(
    @Inject(STORAGE_STRATEGY)
    private readonly storageStrategy: IStorageStrategy,
    private readonly configService: ConfigService,
  ) {}

  async generateThumbnail(file: Express.Multer.File): Promise<string | null> {
    if (!this.isImage(file.mimetype)) {
      return null;
    }

    const width = this.configService.get('THUMBNAIL_WIDTH', 200);
    const height = this.configService.get('THUMBNAIL_HEIGHT', 200);

    const thumbnailBuffer = await sharp(file.buffer)
      .resize(width, height, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();

    const thumbnailFilename = `thumbnails/${uuid()}.webp`;

    await this.storageStrategy.save(
      { ...file, buffer: thumbnailBuffer, mimetype: 'image/webp' },
      thumbnailFilename,
    );

    return thumbnailFilename;
  }

  private isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }
}
```

---

## File Validation

### File Validation Pipe

```typescript
// common/pipes/file-validation.pipe.ts
@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(private readonly configService: ConfigService) {}

  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Validate size
    const maxSize = this.configService.get('MAX_FILE_SIZE', 10 * 1024 * 1024);
    if (file.size > maxSize) {
      throw new PayloadTooLargeException(
        `File size exceeds maximum limit of ${maxSize / 1024 / 1024}MB`,
      );
    }

    // Validate MIME type
    const allowedTypes = this.configService.get('ALLOWED_MIME_TYPES', '').split(',');
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} is not allowed`);
    }

    return file;
  }
}
```

### Magic Bytes Validation

```typescript
// Validate file content matches claimed MIME type
async validateMagicBytes(buffer: Buffer, mimeType: string): Promise<boolean> {
  const fileType = await fileTypeFromBuffer(buffer);
  if (!fileType) return false;
  return fileType.mime === mimeType;
}
```

---

## Storage Quota

### User Entity with Quota

```typescript
// domain/entities/user.entity.ts
export class User {
  id: string;
  email: string;
  password: string;
  storageUsed: number;     // Bytes currently used
  storageLimit: number;    // Max bytes allowed (default 100MB)
  createdAt: Date;
  updatedAt: Date;

  canUpload(fileSize: number): boolean {
    return this.storageUsed + fileSize <= this.storageLimit;
  }

  addStorageUsed(fileSize: number): void {
    this.storageUsed += fileSize;
  }

  removeStorageUsed(fileSize: number): void {
    this.storageUsed = Math.max(0, this.storageUsed - fileSize);
  }
}
```

### Quota Check in Use Case

```typescript
// application/use-cases/upload-file.use-case.ts
async execute(file: Express.Multer.File, userId: string): Promise<FileResponseDto> {
  const user = await this.userRepository.findById(userId);

  // Check quota
  if (!user.canUpload(file.size)) {
    throw new StorageQuotaExceededException(user.storageLimit, user.storageUsed);
  }

  // ... upload logic

  // Update user storage
  user.addStorageUsed(file.size);
  await this.userRepository.save(user);

  return FileMapper.toDto(savedFile);
}
```

---

## Domain Exceptions

```typescript
// domain/exceptions/file.exceptions.ts
export class StorageQuotaExceededException extends HttpException {
  constructor(limit: number, used: number) {
    super(
      {
        message: 'Storage quota exceeded',
        limit: `${(limit / 1024 / 1024).toFixed(2)}MB`,
        used: `${(used / 1024 / 1024).toFixed(2)}MB`,
      },
      HttpStatus.PAYLOAD_TOO_LARGE,
    );
  }
}

export class FileNotFoundException extends HttpException {
  constructor(fileId: string) {
    super(`File with id '${fileId}' not found`, HttpStatus.NOT_FOUND);
  }
}

export class FileAccessDeniedException extends HttpException {
  constructor(fileId: string) {
    super(`Access denied to file '${fileId}'`, HttpStatus.FORBIDDEN);
  }
}
```

---

## Module Wiring

```typescript
// files/files.module.ts
@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [FilesController],
  providers: [
    // Services
    FileService,
    ThumbnailService,

    // Use Cases
    UploadFileUseCase,
    DownloadFileUseCase,
    DeleteFileUseCase,
    GetThumbnailUseCase,

    // Repository
    {
      provide: FILE_REPOSITORY,
      useClass: FileRepository,
    },

    // Storage strategies
    LocalStorageStrategy,
    S3StorageStrategy,
    StorageFactory,
    {
      provide: STORAGE_STRATEGY,
      useFactory: (factory: StorageFactory) => factory.create(),
      inject: [StorageFactory],
    },
  ],
})
export class FilesModule {}
```

---

## Architecture Checklist

### Intermediate Level Requirements

#### Domain Layer
- [x] Domain entities (File, User)
- [x] Repository interfaces
- [x] Storage strategy interface
- [x] Domain exceptions

#### Application Layer
- [x] Use cases (Upload, Download, Delete, GetThumbnail)
- [x] Services (FileService, ThumbnailService)
- [x] DTOs for all endpoints
- [x] Mappers

#### Infrastructure Layer
- [x] Prisma repository implementation
- [x] Local storage strategy
- [x] S3 storage strategy
- [x] Storage factory
- [x] Multer configuration

#### Cross-Cutting
- [x] JWT Authentication
- [x] File validation (size, type, magic bytes)
- [x] Storage quota enforcement
- [x] Response envelope format
- [x] Error handling

#### Testing
- [x] Unit tests (80%+ coverage)
- [x] E2E tests for upload/download
- [x] Mocked storage strategies

---

## Quick Reference

**Where does code go?**

| Concern | Location |
|---------|----------|
| HTTP handling | `src/files/infrastructure/controllers/` |
| Business logic | `src/files/application/services/` or `use-cases/` |
| DTOs | `src/files/application/dto/` |
| Mappers | `src/files/application/mappers/` |
| Domain entities | `src/files/domain/entities/` |
| Storage interface | `src/files/domain/strategies/` |
| Repository interface | `src/files/domain/repositories/` |
| Storage implementations | `src/files/infrastructure/storage/` |
| Repository implementation | `src/files/infrastructure/persistence/` |

---

## Environment Configuration

```bash
# Storage
STORAGE_TYPE=local              # 'local' or 's3'
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760          # 10MB in bytes
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,image/webp,application/pdf

# S3 (when STORAGE_TYPE=s3)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name

# Thumbnails
THUMBNAIL_WIDTH=200
THUMBNAIL_HEIGHT=200

# User Quota
DEFAULT_STORAGE_LIMIT=104857600  # 100MB in bytes
```

---

## Prisma Commands

```bash
# Generate Prisma client
pnpm exec prisma generate

# Create and apply migration
pnpm exec prisma migrate dev --name migration_name

# Open Prisma Studio
pnpm exec prisma studio
```

---

**Last updated:** 2026-01-11
