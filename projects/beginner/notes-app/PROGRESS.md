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

- [ ] Create AI_CONTEXT.md (implementation guide)
- [ ] Initialize NestJS project with CLI
- [ ] Install core dependencies (@nestjs/common, @nestjs/core)
- [ ] Install validation dependencies (class-validator, class-transformer)
- [ ] Install documentation (@nestjs/swagger)
- [ ] Install Prisma dependencies
- [ ] Install authentication dependencies (@nestjs/jwt, @nestjs/passport, passport-jwt, bcrypt)
- [ ] Create .env and .env.example files
- [ ] Set up folder structure
- [ ] Update README.md with project-specific info

### Phase 2: Database Setup (Prisma)

- [ ] Initialize Prisma (`pnpm exec prisma init`)
- [ ] Define User model in schema.prisma
- [ ] Define Note model in schema.prisma (with soft delete field)
- [ ] Configure User-Note relationship (1:N)
- [ ] Run initial migration
- [ ] Generate Prisma client
- [ ] Create PrismaService and PrismaModule

### Phase 3: Auth Module (Reuse patterns from user-auth-api)

- [ ] Create auth.module.ts
- [ ] Create auth.controller.ts (register, login, profile endpoints)
- [ ] Create auth.service.ts (registration, login logic)
- [ ] Create JWT strategy and guards
- [ ] Create DTOs (register.dto.ts, login.dto.ts)
- [ ] Create CurrentUser decorator

### Phase 4: Users Module

- [ ] Create users.module.ts
- [ ] Create users.service.ts
- [ ] Create users.repository.ts
- [ ] Create User entity type definition
- [ ] Create user-response.dto.ts

### Phase 5: Notes Module - Domain Layer

- [ ] Create notes.module.ts
- [ ] Create Note entity type definition
- [ ] Define fields: id, title, content, userId, createdAt, updatedAt, deletedAt

### Phase 6: Notes Module - Application Layer

- [ ] Create DTOs with validation:
  - [ ] create-note.dto.ts (title: required, content: optional)
  - [ ] update-note.dto.ts (partial update)
  - [ ] note-response.dto.ts
  - [ ] find-notes.dto.ts (search query, pagination)
- [ ] Create notes.service.ts with business logic:
  - [ ] create(userId, dto) - Create note for user
  - [ ] findAll(userId, query) - List user's notes with search/pagination
  - [ ] findOne(userId, noteId) - Get single note (verify ownership)
  - [ ] update(userId, noteId, dto) - Update note (verify ownership)
  - [ ] remove(userId, noteId) - Soft delete (verify ownership)
  - [ ] search(userId, query) - Search by title/content

### Phase 7: Notes Module - Infrastructure Layer

- [ ] Create notes.repository.ts with Prisma operations
- [ ] Create notes.controller.ts with Swagger docs:
  - [ ] POST /notes - Create note (protected)
  - [ ] GET /notes - List my notes (protected)
  - [ ] GET /notes/search - Search notes (protected)
  - [ ] GET /notes/:id - Get note (protected)
  - [ ] PUT /notes/:id - Update note (protected)
  - [ ] DELETE /notes/:id - Soft delete (protected)

### Phase 8: Common Module

- [ ] Create pagination DTOs (reuse from crud-api pattern)
- [ ] Create custom decorators (CurrentUser)
- [ ] Create exception filters (if needed)

### Phase 9: Configuration

- [ ] Create config/database.config.ts
- [ ] Create config/app.config.ts
- [ ] Create config/jwt.config.ts
- [ ] Wire up ConfigModule with validation

### Phase 10: App Module Integration

- [ ] Update AppModule with all imports
- [ ] Configure main.ts with:
  - [ ] Swagger documentation (title: Notes App API)
  - [ ] Global ValidationPipe
  - [ ] CORS configuration

### Phase 11: Testing

- [ ] Create unit tests for notes.service.ts
- [ ] Create unit tests for notes.repository.ts
- [ ] Create unit tests for auth.service.ts
- [ ] Create E2E tests for notes endpoints
- [ ] Create E2E tests for auth endpoints
- [ ] Achieve 80%+ coverage on core logic

### Phase 12: Documentation

- [ ] Swagger API documentation complete
- [ ] PROGRESS.md updated (this file)
- [ ] README.md finalized with full setup instructions

---

## Endpoints

| Method | Endpoint         | Description                  | Auth Required |
| ------ | ---------------- | ---------------------------- | ------------- |
| POST   | `/auth/register` | Register new user            | No            |
| POST   | `/auth/login`    | Login and get JWT            | No            |
| GET    | `/auth/profile`  | Get current user profile     | Yes           |
| POST   | `/notes`         | Create a new note            | Yes           |
| GET    | `/notes`         | List my notes (with pagination) | Yes        |
| GET    | `/notes/search`  | Search notes by title/content | Yes          |
| GET    | `/notes/:id`     | Get a specific note          | Yes           |
| PUT    | `/notes/:id`     | Update a note                | Yes           |
| DELETE | `/notes/:id`     | Soft delete a note           | Yes           |

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

## Prisma Schema (Planned)

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  notes     Note[]
}

model Note {
  id        String    @id @default(uuid())
  title     String    @db.VarChar(200)
  content   String?   @db.Text
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  @@index([userId])
  @@index([deletedAt])
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
│   │   ├── dto/
│   │   │   ├── register.dto.ts
│   │   │   └── login.dto.ts
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
│   │   ├── notes.repository.ts
│   │   ├── entities/
│   │   │   └── note.entity.ts
│   │   └── dto/
│   │       ├── create-note.dto.ts
│   │       ├── update-note.dto.ts
│   │       ├── find-notes.dto.ts
│   │       └── note-response.dto.ts
│   ├── common/
│   │   ├── decorators/
│   │   │   └── current-user.decorator.ts
│   │   └── dto/
│   │       ├── pagination.dto.ts
│   │       └── paginated-response.dto.ts
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
│   └── schema.prisma
├── test/
│   ├── notes.e2e-spec.ts
│   ├── auth.e2e-spec.ts
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

## Quick Start (After Implementation)

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

## Dependencies (Planned)

```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/swagger": "^7.0.0",
    "@prisma/client": "^5.0.0",
    "bcrypt": "^5.1.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/bcrypt": "^5.0.0",
    "@types/passport-jwt": "^4.0.0",
    "prisma": "^5.0.0",
    "jest": "^29.0.0",
    "supertest": "^6.0.0"
  }
}
```

---

## Design Decisions

1. **Soft Delete:** Using `deletedAt` timestamp instead of hard delete to allow note recovery and maintain data integrity.

2. **Search Implementation:** Using Prisma's `contains` with `mode: 'insensitive'` for case-insensitive search on title and content.

3. **Ownership Validation:** All note operations verify that the requesting user owns the note before proceeding.

4. **Port Assignment:** Using port 3002 to avoid conflicts with other beginner projects.

5. **Reusing Auth Patterns:** Following the same authentication patterns from user-auth-api for consistency.

---

## Known Issues / TODOs

- [ ] Consider adding note categories/tags in future enhancement
- [ ] Consider adding note sharing between users
- [ ] Consider adding note archiving feature
- [ ] Consider adding rich text content support

---

**Started:** 2026-01-03
**Completed:** In Progress
**Next Steps:** After completion, proceed to Blog REST API (4th beginner project)
