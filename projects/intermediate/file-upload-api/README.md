# File Upload API

API for file upload and management with dual storage support (local filesystem and AWS S3), image thumbnail generation, and user-based file ownership.

**Level:** Intermediate
**ORM:** Prisma

---

## Tech Stack

- **Framework:** NestJS 10+
- **Language:** TypeScript 5+
- **Database:** PostgreSQL 17+
- **ORM:** Prisma
- **File Handling:** Multer
- **Image Processing:** Sharp
- **Cloud Storage:** AWS S3 (optional)
- **Authentication:** JWT with Passport
- **Documentation:** Swagger/OpenAPI
- **Testing:** Jest + Supertest

---

## Features

- [x] JWT Authentication (register, login)
- [x] File upload with multipart/form-data
- [x] Dual storage strategy (Local + S3)
- [x] MIME type validation
- [x] File size limits
- [x] Image thumbnail generation (Sharp)
- [x] User-based file ownership
- [x] Per-user storage quotas
- [x] Paginated file listing
- [x] Secure file downloads
- [x] Swagger API documentation

---

## Prerequisites

- Node.js 20+
- Docker & Docker Compose (for PostgreSQL)
- pnpm (recommended) or npm/yarn
- AWS account (optional, for S3 storage)

---

## Getting Started

### 1. Start Docker Services

From the monorepo root:

```bash
docker-compose up -d
```

### 2. Install Dependencies

```bash
cd projects/intermediate/file-upload-api
pnpm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
```

### 4. Setup Database

```bash
pnpm exec prisma generate
pnpm exec prisma migrate dev
```

### 5. Create Upload Directory

```bash
mkdir -p uploads
```

### 6. Run Development Server

```bash
pnpm run start:dev
```

The API will be available at `http://localhost:3000`
Swagger docs at `http://localhost:3000/api`

---

## Available Scripts

| Command               | Description                       |
| --------------------- | --------------------------------- |
| `pnpm run start:dev`  | Start in development mode (watch) |
| `pnpm run start`      | Start in production mode          |
| `pnpm run build`      | Build for production              |
| `pnpm run test`       | Run unit tests                    |
| `pnpm run test:watch` | Run tests in watch mode           |
| `pnpm run test:cov`   | Run tests with coverage           |
| `pnpm run test:e2e`   | Run E2E tests                     |
| `pnpm run lint`       | Run ESLint                        |
| `pnpm run format`     | Format with Prettier              |

### Database Commands (Prisma)

| Command                           | Description            |
| --------------------------------- | ---------------------- |
| `pnpm exec prisma generate`       | Generate Prisma client |
| `pnpm exec prisma migrate dev`    | Run migrations (dev)   |
| `pnpm exec prisma migrate deploy` | Run migrations (prod)  |
| `pnpm exec prisma studio`         | Open Prisma Studio     |

---

## Project Structure

```
src/
├── auth/                 # Authentication module
│   ├── application/      # DTOs, services
│   └── infrastructure/   # Controllers, guards, strategies
├── users/                # Users module
│   ├── domain/           # Entities, repository interfaces
│   └── infrastructure/   # Repository implementations
├── files/                # Files module (main feature)
│   ├── domain/           # Entities, interfaces, strategies
│   ├── application/      # DTOs, services, use-cases, mappers
│   └── infrastructure/   # Controllers, storage, persistence
├── common/               # Shared utilities
│   ├── decorators/       # Custom decorators
│   ├── filters/          # Exception filters
│   ├── interceptors/     # Response interceptors
│   └── pipes/            # Validation pipes
├── config/               # Configuration files
├── prisma/               # Prisma module
├── app.module.ts
└── main.ts

prisma/
└── schema.prisma         # Database schema

uploads/                  # Local file storage (gitignored)
scripts/
├── seed-data.sh          # Database seeding
└── test-api.sh           # API integration tests
```

---

## API Endpoints

### Authentication

| Method | Endpoint              | Description         | Auth |
| ------ | --------------------- | ------------------- | ---- |
| POST   | `/api/v1/auth/register` | Register new user   | No   |
| POST   | `/api/v1/auth/login`    | Login user          | No   |
| GET    | `/api/v1/auth/profile`  | Get current profile | Yes  |

### Files

| Method | Endpoint                       | Description           | Auth |
| ------ | ------------------------------ | --------------------- | ---- |
| POST   | `/api/v1/files/upload`         | Upload file           | Yes  |
| GET    | `/api/v1/files`                | List user's files     | Yes  |
| GET    | `/api/v1/files/:id`            | Get file details      | Yes  |
| GET    | `/api/v1/files/:id/download`   | Download file         | Yes  |
| GET    | `/api/v1/files/:id/thumbnail`  | Get image thumbnail   | Yes  |
| DELETE | `/api/v1/files/:id`            | Delete file           | Yes  |
| GET    | `/api/v1/files/storage`        | Get storage usage     | Yes  |

### Example: Upload File

```bash
curl -X POST http://localhost:3000/api/v1/files/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/image.png"
```

### Example Response

```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "originalName": "image.png",
    "mimeType": "image/png",
    "size": 102400,
    "url": "/api/v1/files/550e8400-e29b-41d4-a716-446655440000/download",
    "thumbnailUrl": "/api/v1/files/550e8400-e29b-41d4-a716-446655440000/thumbnail",
    "uploadedAt": "2026-01-05T10:00:00Z"
  }
}
```

---

## Environment Variables

| Variable | Description | Default |
| -------- | ----------- | ------- |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRATION` | Token expiration (seconds) | `900` |
| `STORAGE_TYPE` | Storage backend (`local` or `s3`) | `local` |
| `UPLOAD_DIR` | Local upload directory | `./uploads` |
| `MAX_FILE_SIZE` | Max file size in bytes | `10485760` (10MB) |
| `ALLOWED_MIME_TYPES` | Comma-separated MIME types | `image/jpeg,image/png,...` |
| `AWS_REGION` | AWS region (for S3) | - |
| `AWS_ACCESS_KEY_ID` | AWS access key (for S3) | - |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key (for S3) | - |
| `AWS_S3_BUCKET` | S3 bucket name | - |
| `THUMBNAIL_WIDTH` | Thumbnail width | `200` |
| `THUMBNAIL_HEIGHT` | Thumbnail height | `200` |
| `DEFAULT_STORAGE_LIMIT` | User storage quota (bytes) | `104857600` (100MB) |
| `PORT` | Application port | `3000` |

---

## Storage Configuration

### Local Storage (Development)

Set `STORAGE_TYPE=local` in `.env`. Files are stored in the `uploads/` directory.

### S3 Storage (Production)

Set `STORAGE_TYPE=s3` and configure AWS credentials in `.env`.

The Strategy pattern allows switching between storage backends without code changes.

---

## Testing

### Run Unit Tests

```bash
pnpm run test
```

### Run with Coverage

```bash
pnpm run test:cov
```

Coverage target: **80% minimum**

### Run E2E Tests

```bash
pnpm run test:e2e
```

### Run API Integration Tests

```bash
./scripts/test-api.sh
```

---

## Documentation

- **[AI_CONTEXT.md](./AI_CONTEXT.md)** - Context for Claude Code
- **[PROGRESS.md](./PROGRESS.md)** - Implementation progress tracker
- **[Swagger UI](http://localhost:3000/api)** - API documentation (when running)

### Monorepo Documentation

- **[GUIDE.md](../../../docs/GUIDE.md)** - Complete project guide
- **[ARCHITECTURE.md](../../../docs/ARCHITECTURE.md)** - Architecture patterns
- **[API_CONVENTIONS.md](../../../docs/API_CONVENTIONS.md)** - REST conventions

---

## Development Checklist

- [ ] Environment configured
- [ ] Database migrations run
- [ ] All endpoints implemented
- [ ] Storage strategies implemented (Local + S3)
- [ ] Thumbnail generation working
- [ ] Input validation added
- [ ] Error handling implemented
- [ ] Unit tests written (80%+ coverage)
- [ ] E2E tests written
- [ ] Swagger documentation added

---

## Security Features

- JWT authentication required for all file operations
- Users can only access their own files
- MIME type validation (extension + magic bytes)
- File size limits enforced
- Storage quotas per user
- UUID-based file paths (prevents path traversal)
- Sanitized filenames

---

## Troubleshooting

### Database Connection Failed

```bash
# Check if Docker is running
docker ps

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process or use different port
PORT=3001 pnpm run start:dev
```

### Upload Directory Permission Issues

```bash
# Ensure upload directory exists and is writable
mkdir -p uploads
chmod 755 uploads
```

### Sharp Installation Issues

```bash
# Rebuild native modules
pnpm rebuild sharp
```

### S3 Connection Issues

```bash
# Verify AWS credentials
aws sts get-caller-identity

# Check bucket permissions
aws s3 ls s3://your-bucket-name
```

---

## Potential Improvements

Future enhancements that could be added to this project:

### File Management

- Folder/directory organization for files
- File versioning (keep history of uploads)
- Batch upload (multiple files at once)
- Resumable uploads for large files (chunked upload)
- File sharing with expiring links
- Public/private file visibility toggle
- File tags and metadata

### Image Processing

- Multiple thumbnail sizes (small, medium, large)
- Image cropping and resizing on upload
- Image format conversion (PNG → WebP, etc.)
- EXIF data extraction and storage
- Image compression optimization
- Blur hash generation for placeholders
- Face detection for profile photos

### Storage & Performance

- CDN integration for file serving
- Multi-cloud storage support (GCS, Azure Blob)
- Storage tiering (hot/cold storage)
- Background jobs for thumbnail generation (Bull/Redis)
- Lazy thumbnail generation on first request
- File deduplication (content hashing)
- Presigned URLs for direct S3 uploads

### Security & Compliance

- Malware scanning (ClamAV integration)
- Content moderation for images
- Encryption at rest
- Access logs and audit trail
- GDPR compliance (data export/deletion)
- IP-based access restrictions
- Signed download URLs with expiration

### User Experience

- Upload progress tracking (WebSocket/SSE)
- Drag-and-drop upload support (frontend)
- Image gallery view endpoint
- Bulk operations (delete multiple files)
- File search by name, type, date
- Storage usage alerts/notifications
- Trash/recycle bin with restore

### Integration & API

- Webhook notifications on upload/delete
- API rate limiting per endpoint
- File upload via URL (fetch from remote)
- ZIP archive generation for bulk downloads
- Video thumbnail extraction
- PDF preview generation
- Office document preview

---

## License

MIT

---

**Last updated:** 2026-01-05
