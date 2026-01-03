# Notes App Backend - Implementation Progress

**Project:** notes-app
**Level:** Beginner
**ORM:** Prisma
**Architecture:** 3-Layer (Controller → Service → Repository)

---

## Project Overview

**Description:** Backend for a notes application with user support. Users can create, read, update, and delete their personal notes with soft delete support and search functionality.

**Technical Requirements:**

- User - Notes relationship (1:N)
- Soft delete for notes
- Timestamps (createdAt, updatedAt)
- Search by title/content
- Authentication (JWT) for protected endpoints
- Only owners can access their notes

---

## Implementation Status

### Phase 1: Project Scaffolding

- [x] Create AI_CONTEXT.md (implementation guide)
- [x] Initialize NestJS project with CLI
- [x] Install core dependencies (@nestjs/common, @nestjs/core)
- [x] Install validation dependencies (class-validator, class-transformer)
- [x] Install documentation (@nestjs/swagger)
- [x] Install Prisma dependencies
- [x] Install authentication dependencies (@nestjs/jwt, @nestjs/passport, passport-jwt, bcrypt)
- [x] Create .env and .env.example files
- [x] Set up folder structure
- [x] Update README.md with project-specific info

### Phase 2: Database Setup (Prisma)

- [x] Initialize Prisma (`pnpm exec prisma init`)
- [x] Define User model in schema.prisma
- [x] Define Note model in schema.prisma (with soft delete field)
- [x] Configure User-Note relationship (1:N)
- [x] Run initial migration
- [x] Generate Prisma client
- [x] Create PrismaService and PrismaModule

### Phase 3: Auth Module

- [x] Create auth.module.ts
- [x] Create auth.controller.ts (register, login, profile endpoints)
- [x] Create auth.service.ts (registration, login logic)
- [x] Create JWT strategy and guards
- [x] Create DTOs (register.dto.ts, login.dto.ts, auth-response.dto.ts)
- [x] Create CurrentUser decorator

### Phase 4: Users Module

- [x] Create users.module.ts
- [x] Create users.service.ts
- [x] Create users.repository.ts
- [x] Create User entity type definition
- [x] Create user-response.dto.ts

### Phase 5: Notes Module - Domain Layer

- [x] Create notes.module.ts
- [x] Create Note entity type definition
- [x] Define fields: id, title, content, userId, createdAt, updatedAt, deletedAt

### Phase 6: Notes Module - Application Layer

- [x] Create DTOs with validation:
  - [x] create-note.dto.ts (title: required, content: optional)
  - [x] update-note.dto.ts (partial update)
  - [x] note-response.dto.ts
  - [x] find-notes.dto.ts (search query, pagination)
- [x] Create notes.service.ts with business logic:
  - [x] create(userId, dto) - Create note for user
  - [x] findAll(userId, query) - List user's notes with pagination
  - [x] findOne(userId, noteId) - Get single note (verify ownership)
  - [x] update(userId, noteId, dto) - Update note (verify ownership)
  - [x] remove(userId, noteId) - Soft delete (verify ownership)
  - [x] search(userId, query) - Search by title/content

### Phase 7: Notes Module - Infrastructure Layer

- [x] Create notes.repository.ts with Prisma operations
- [x] Create notes.controller.ts with Swagger docs:
  - [x] POST /notes - Create note (protected)
  - [x] GET /notes - List my notes (protected)
  - [x] GET /notes/search - Search notes (protected)
  - [x] GET /notes/:id - Get note (protected)
  - [x] PUT /notes/:id - Update note (protected)
  - [x] DELETE /notes/:id - Soft delete (protected)

### Phase 8: Common Module

- [x] Create custom decorators (CurrentUser)
- [x] Pagination handled within notes DTOs

### Phase 9: Configuration

- [x] Create config/database.config.ts
- [x] Create config/app.config.ts
- [x] Create config/jwt.config.ts
- [x] Wire up ConfigModule with config loader

### Phase 10: App Module Integration

- [x] Update AppModule with all imports
- [x] Configure main.ts with:
  - [x] Swagger documentation (title: Notes App API)
  - [x] Global ValidationPipe
  - [x] CORS configuration

### Phase 11: Testing

- [x] Create unit tests for notes.service.ts (100% coverage)
- [x] Create unit tests for auth.service.ts (100% coverage)
- [x] Achieve 80%+ coverage on core logic

### Phase 12: Documentation

- [x] Swagger API documentation complete
- [x] PROGRESS.md updated (this file)
- [x] README.md finalized with full setup instructions
- [x] AI_CONTEXT.md created

---

## Endpoints

| Method | Endpoint         | Description                     | Auth Required |
| ------ | ---------------- | ------------------------------- | ------------- |
| POST   | `/auth/register` | Register new user               | No            |
| POST   | `/auth/login`    | Login and get JWT               | No            |
| GET    | `/auth/profile`  | Get current user profile        | Yes           |
| POST   | `/notes`         | Create a new note               | Yes           |
| GET    | `/notes`         | List my notes (with pagination) | Yes           |
| GET    | `/notes/search`  | Search notes by title/content   | Yes           |
| GET    | `/notes/:id`     | Get a specific note             | Yes           |
| PUT    | `/notes/:id`     | Update a note                   | Yes           |
| DELETE | `/notes/:id`     | Soft delete a note              | Yes           |

---

## Entities / Models

```typescript
// User
{
  id: string;          // UUID
  email: string;       // Unique
  password: string;    // Hashed with bcrypt
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Note
{
  id: string;          // UUID
  title: string;       // Required, max 200 chars
  content: string;     // Optional, text
  userId: string;      // FK to User
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;    // Soft delete timestamp
}
```

---

## Prisma Schema

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  notes     Note[]

  @@map("users")
}

model Note {
  id        String    @id @default(uuid())
  title     String    @db.VarChar(200)
  content   String?   @db.Text
  userId    String    @map("user_id")
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  @@index([userId])
  @@index([deletedAt])
  @@map("notes")
}
```

---

## Folder Structure

```
notes-app/
├── src/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.service.spec.ts
│   │   ├── dto/
│   │   │   ├── register.dto.ts
│   │   │   ├── login.dto.ts
│   │   │   └── auth-response.dto.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   └── strategies/
│   │       └── jwt.strategy.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   ├── users.repository.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   └── dto/
│   │       └── user-response.dto.ts
│   ├── notes/
│   │   ├── notes.module.ts
│   │   ├── notes.controller.ts
│   │   ├── notes.service.ts
│   │   ├── notes.service.spec.ts
│   │   ├── notes.repository.ts
│   │   ├── entities/
│   │   │   └── note.entity.ts
│   │   └── dto/
│   │       ├── create-note.dto.ts
│   │       ├── update-note.dto.ts
│   │       ├── find-notes.dto.ts
│   │       └── note-response.dto.ts
│   ├── common/
│   │   └── decorators/
│   │       └── current-user.decorator.ts
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── app.config.ts
│   │   ├── jwt.config.ts
│   │   └── index.ts
│   ├── prisma/
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── test/
│   └── jest-e2e.json
├── .env.example
├── .env
├── package.json
├── tsconfig.json
├── nest-cli.json
├── AI_CONTEXT.md
├── PROGRESS.md
└── README.md
```

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Start PostgreSQL (from monorepo root)
docker-compose up -d postgres

# Run migrations
pnpm exec prisma migrate dev

# Start development server
pnpm run start:dev

# Access Swagger docs
open http://localhost:3002/docs
```

**Note:** Port 3002 to avoid conflicts with user-auth-api (3000) and crud-api (3001).

---

## Test Coverage

```
notes.service.ts  | 100% statements | 100% functions
auth.service.ts   | 100% statements | 100% functions
```

---

## Design Decisions

1. **Soft Delete:** Using `deletedAt` timestamp instead of hard delete to allow note recovery and maintain data integrity.

2. **Search Implementation:** Using Prisma's `contains` with `mode: 'insensitive'` for case-insensitive search on title and content.

3. **Ownership Validation:** All note operations verify that the requesting user owns the note before proceeding.

4. **Port Assignment:** Using port 3002 to avoid conflicts with other beginner projects.

5. **Simplified Auth:** Using access token only (no refresh tokens) to keep the beginner project simple.

---

## Potential Improvements

- [ ] Add note categories/tags
- [ ] Add note sharing between users
- [ ] Add note archiving feature
- [ ] Add rich text content support
- [ ] Add E2E tests
- [ ] Add rate limiting

---

**Started:** 2026-01-03
**Completed:** 2026-01-03
**Next Steps:** Proceed to Blog REST API (4th beginner project)
