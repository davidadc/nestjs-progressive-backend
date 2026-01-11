# ARCHITECTURE.md - Notes App Backend

## Project Architecture Overview

**Project:** Notes App Backend
**Level:** Beginner
**Architecture Style:** Modular 3-Layer
**ORM:** Prisma 7 (with @prisma/adapter-pg)

---

## Layer Structure

### Beginner: 3-Layer Architecture

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│  (Controllers, DTOs, Pipes, Guards)     │
├─────────────────────────────────────────┤
│           Business Layer                │
│  (Services, Business Logic)             │
├─────────────────────────────────────────┤
│           Data Access Layer             │
│  (Repositories, Entities, Prisma)       │
└─────────────────────────────────────────┘
```

**Request Flow:**
```
HTTP Request → Guard → Controller → Service → Repository → Database
```

---

## Folder Structure

```
src/
├── auth/                           # Authentication module
│   ├── auth.module.ts
│   ├── auth.controller.ts          # Auth endpoints
│   ├── auth.service.ts             # Auth business logic
│   ├── auth.service.spec.ts        # Unit tests
│   ├── dto/
│   │   ├── register.dto.ts         # Registration input
│   │   ├── login.dto.ts            # Login input
│   │   └── auth-response.dto.ts    # Auth response
│   ├── guards/
│   │   └── jwt-auth.guard.ts       # Route protection
│   └── strategies/
│       └── jwt.strategy.ts         # JWT validation
├── users/                          # Users module
│   ├── users.module.ts
│   ├── users.service.ts            # User operations
│   ├── users.repository.ts         # User data access
│   ├── entities/
│   │   └── user.entity.ts          # User type
│   └── dto/
│       └── user-response.dto.ts    # Safe user output
├── notes/                          # Notes module
│   ├── notes.module.ts
│   ├── notes.controller.ts         # Notes endpoints
│   ├── notes.service.ts            # Notes business logic
│   ├── notes.service.spec.ts       # Unit tests
│   ├── notes.repository.ts         # Notes data access
│   ├── entities/
│   │   └── note.entity.ts          # Note type
│   └── dto/
│       ├── create-note.dto.ts      # Create input
│       ├── update-note.dto.ts      # Update input
│       ├── find-notes.dto.ts       # Query parameters
│       └── note-response.dto.ts    # Note output
├── common/                         # Shared utilities
│   ├── decorators/
│   │   └── current-user.decorator.ts  # Extract user from request
│   └── dto/
│       ├── pagination.dto.ts       # Base pagination
│       └── paginated-response.dto.ts  # Paginated wrapper
├── config/                         # Environment configuration
│   ├── app.config.ts
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── index.ts
├── prisma/                         # Database module
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── app.module.ts
└── main.ts

prisma/
└── schema.prisma                   # Database schema

test/
├── notes.e2e-spec.ts
├── auth.e2e-spec.ts
└── jest-e2e.json
```

---

## Design Patterns Required

### Beginner Level Patterns

- [x] **Repository Pattern** - `NotesRepository` and `UsersRepository` abstract Prisma
- [x] **Factory Pattern** - DTOs with constructors create safe response objects
- [x] **Singleton Pattern** - Services are singleton instances (NestJS default)
- [x] **Decorator Pattern** - `@CurrentUser()` extracts authenticated user, `@UseGuards()` protects routes
- [x] **Guard Pattern** - `JwtAuthGuard` protects note endpoints

---

## Layer Responsibilities

### Presentation Layer

**Purpose:** Handle HTTP requests, validate input, protect routes

**Contains:**
- `auth.controller.ts` - Auth endpoints (register, login, profile)
- `notes.controller.ts` - Notes CRUD endpoints
- DTOs in `*/dto/` - Request/response shapes
- `jwt-auth.guard.ts` - Route protection
- `current-user.decorator.ts` - User extraction

**Endpoints:**
```
# Auth
POST /auth/register     # Register new user
POST /auth/login        # Login, get token
GET  /auth/profile      # Current user (protected)

# Notes (all protected)
GET    /notes           # List my notes (paginated)
GET    /notes/search    # Search my notes
GET    /notes/:id       # Get single note
POST   /notes           # Create note
PUT    /notes/:id       # Update note
DELETE /notes/:id       # Soft delete note
```

**Rules:**
- NO business logic
- NO direct database access
- All note endpoints require authentication
- Validate all input with class-validator

### Business Layer

**Purpose:** Implement business logic, enforce ownership

**Contains:**
- `auth.service.ts` - Registration, login, token generation
- `users.service.ts` - User operations
- `notes.service.ts` - Note CRUD with ownership validation

**Responsibilities:**
- Password hashing (bcrypt)
- JWT token generation
- **Ownership validation** - Users can only access their own notes
- Soft delete implementation
- Search across title and content

**Rules:**
- NO HTTP/infrastructure concerns
- Enforce resource ownership
- Throw appropriate exceptions (NotFoundException, ForbiddenException)

### Data Access Layer

**Purpose:** Abstract database operations

**Contains:**
- `users.repository.ts` - User Prisma operations
- `notes.repository.ts` - Note Prisma operations with soft delete filtering
- `prisma.service.ts` - Database connection

**Responsibilities:**
- CRUD operations
- Pagination with skip/take
- Search filtering (title OR content)
- Exclude soft-deleted notes by default
- Set deletedAt for soft delete

**Rules:**
- NO business logic
- Handle Prisma-specific operations
- Filter out deletedAt != null by default

---

## Entity Definitions

### User Entity

```typescript
export type User = {
  id: string;           // UUID
  email: string;        // Unique
  password: string;     // bcrypt hashed
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Note Entity

```typescript
export type Note = {
  id: string;           // UUID
  title: string;        // Required, max 200 chars
  content: string | null;
  userId: string;       // FK to User (owner)
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;  // Soft delete timestamp
}
```

---

## Ownership & Authorization Pattern

### Resource Ownership Flow

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Request   │──────│  JWT Guard  │──────│  Controller │
│  + Token    │      │  Validates  │      │  Extracts   │
└─────────────┘      └─────────────┘      │  @CurrentUser│
                                          └──────┬──────┘
                                                 │
                                                 ▼
                     ┌─────────────────────────────────────┐
                     │              Service                 │
                     │  1. Fetch note from DB               │
                     │  2. Check note.userId === user.id    │
                     │  3. Throw ForbiddenException if not  │
                     └─────────────────────────────────────┘
```

### Implementation Example

```typescript
async findOne(id: string, userId: string): Promise<NoteResponseDto> {
  const note = await this.notesRepository.findById(id);

  if (!note) {
    throw new NotFoundException('Note not found');
  }

  if (note.userId !== userId) {
    throw new ForbiddenException('Cannot access other user\'s note');
  }

  return NoteResponseDto.fromEntity(note);
}
```

---

## Soft Delete Pattern

### How It Works

```
DELETE /notes/:id
    │
    ▼
┌─────────────────────────────────┐
│  Set deletedAt = new Date()    │
│  (Record stays in database)    │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│  All queries filter:           │
│  WHERE deletedAt IS NULL       │
└─────────────────────────────────┘
```

### Repository Implementation

```typescript
async findAll(userId: string, query: FindNotesDto) {
  return this.prisma.note.findMany({
    where: {
      userId,
      deletedAt: null,  // Exclude soft-deleted
    },
    // ...pagination
  });
}

async softDelete(id: string): Promise<void> {
  await this.prisma.note.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
```

---

## Search Pattern

### Search Query

```
GET /notes/search?q=meeting&page=1&limit=10
```

### Implementation

```typescript
async search(userId: string, searchTerm: string): Promise<Note[]> {
  return this.prisma.note.findMany({
    where: {
      userId,
      deletedAt: null,
      OR: [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { content: { contains: searchTerm, mode: 'insensitive' } },
      ],
    },
  });
}
```

---

## Error Handling

### Standard NestJS Exceptions

```typescript
// Note not found
throw new NotFoundException('Note not found');

// Trying to access another user's note
throw new ForbiddenException('Cannot access other user\'s note');

// Invalid credentials
throw new UnauthorizedException('Invalid credentials');

// Email already registered
throw new ConflictException('Email already registered');
```

---

## Module Wiring

```typescript
@Module({
  imports: [
    PrismaModule,
    AuthModule,  // Provides JwtAuthGuard
  ],
  controllers: [NotesController],
  providers: [NotesService, NotesRepository],
})
export class NotesModule {}
```

---

## Architecture Checklist

### Beginner Level Requirements

#### Presentation Layer
- [x] Auth controller (register, login, profile)
- [x] Notes controller (CRUD + search)
- [x] DTOs for all endpoints
- [x] Input validation (class-validator)
- [x] JWT guard for protected routes
- [x] @CurrentUser decorator
- [x] Swagger documentation

#### Business Layer
- [x] Auth service (registration, login)
- [x] Notes service with ownership validation
- [x] Soft delete implementation
- [x] Search functionality

#### Data Access Layer
- [x] Users repository (Prisma)
- [x] Notes repository (Prisma)
- [x] Soft delete filtering
- [x] Pagination

#### Cross-Cutting
- [x] JWT Authentication
- [x] Resource ownership validation
- [x] Validation (DTOs)
- [x] Error handling (Standard NestJS)
- [x] Configuration (ConfigModule)

#### Testing
- [x] Service unit tests
- [x] Auth service tests
- [x] E2E tests

---

## Quick Reference

**Where does code go?**

| Concern | Location |
|---------|----------|
| Auth endpoints | `src/auth/auth.controller.ts` |
| Auth logic | `src/auth/auth.service.ts` |
| Note endpoints | `src/notes/notes.controller.ts` |
| Note logic | `src/notes/notes.service.ts` |
| Note data access | `src/notes/notes.repository.ts` |
| User data access | `src/users/users.repository.ts` |
| JWT validation | `src/auth/strategies/jwt.strategy.ts` |
| Current user decorator | `src/common/decorators/current-user.decorator.ts` |
| Database schema | `prisma/schema.prisma` |

---

## Security Measures

| Measure | Implementation |
|---------|---------------|
| Password Storage | bcrypt hashing |
| Access Token | JWT with expiration |
| Route Protection | JwtAuthGuard |
| Resource Ownership | userId check in service layer |
| Input Validation | class-validator whitelist |
| Soft Delete | Preserve data, filter in queries |

---

**Last updated:** 2026-01-11
