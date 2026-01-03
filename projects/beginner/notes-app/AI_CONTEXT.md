# AI_CONTEXT.md - Context for Claude Code

## Project Information

**Name:** Notes App Backend
**Level:** Beginner
**Description:** Backend for a notes application with user support. Users can create, read, update, and delete their personal notes with soft delete support and search functionality.
**ORM:** Prisma
**Stack:** NestJS + TypeScript + PostgreSQL + Prisma

---

## Project Structure

### Beginner Level (Modular 3-Layer)

```
src/
├── auth/                          # Auth feature module
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── dto/
│   │   ├── register.dto.ts
│   │   └── login.dto.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   └── strategies/
│       └── jwt.strategy.ts
├── users/                         # Users feature module
│   ├── users.module.ts
│   ├── users.service.ts
│   ├── users.repository.ts
│   ├── entities/
│   │   └── user.entity.ts
│   └── dto/
│       └── user-response.dto.ts
├── notes/                         # Notes feature module
│   ├── notes.module.ts
│   ├── notes.controller.ts
│   ├── notes.service.ts
│   ├── notes.repository.ts
│   ├── entities/
│   │   └── note.entity.ts
│   └── dto/
│       ├── create-note.dto.ts
│       ├── update-note.dto.ts
│       ├── find-notes.dto.ts
│       └── note-response.dto.ts
├── common/                        # Shared utilities
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   └── dto/
│       ├── pagination.dto.ts
│       └── paginated-response.dto.ts
├── config/                        # App configuration
│   ├── database.config.ts
│   ├── app.config.ts
│   ├── jwt.config.ts
│   └── index.ts
├── prisma/                        # Prisma module
│   ├── prisma.service.ts
│   └── prisma.module.ts
├── app.module.ts
└── main.ts

test/
├── notes.service.spec.ts
├── auth.service.spec.ts
├── notes.e2e-spec.ts
├── auth.e2e-spec.ts
└── jest-e2e.json
```

---

## Architecture

### Beginner (3 layers)

```
Controller → Service → Repository → Database
```

**Patterns Used:**

- Repository Pattern
- Dependency Injection
- DTO Pattern
- Guard Pattern (JWT)

**Flow:**

```
HTTP Request
    ↓
Controller (validates request, Swagger docs)
    ↓
Service (business logic, ownership validation)
    ↓
Repository (Prisma operations)
    ↓
PostgreSQL Database
```

---

## Entities

### User Entity

```typescript
export class User {
  id: string;          // UUID
  email: string;       // Unique
  password: string;    // Hashed with bcrypt
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Note Entity

```typescript
export class Note {
  id: string;          // UUID
  title: string;       // Required, max 200 chars
  content: string;     // Optional, text
  userId: string;      // FK to User
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;    // Soft delete timestamp
}
```

### DTOs

**CreateNoteDto** (input)
- title: string (required, 1-200 chars)
- content?: string (optional)

**UpdateNoteDto** (input)
- title?: string (optional, 1-200 chars)
- content?: string (optional)

**NoteResponseDto** (output)
- id: string
- title: string
- content: string | null
- createdAt: Date
- updatedAt: Date

**FindNotesDto** (query)
- search?: string (search in title/content)
- page?: number (default: 1)
- limit?: number (default: 10)

---

## Security Requirements

### Authentication

- [x] JWT tokens (access token)
- [x] Password hashing (bcrypt)
- [ ] Rate limiting (optional for beginner)

### Authorization

- [x] Resource ownership validation (users can only access their own notes)

### Validation

- [x] DTOs with class-validator
- [x] Input sanitization

### Error Handling

- [x] Consistent error responses (NestJS standard format)
- [x] No stack traces in production

---

## Endpoints

### POST /auth/register

**Description:** Register a new user

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Success (201):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2026-01-03T10:00:00Z"
}
```

### POST /auth/login

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
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### GET /auth/profile

**Description:** Get current user profile (protected)

**Headers:** `Authorization: Bearer <token>`

**Success (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2026-01-03T10:00:00Z"
}
```

### POST /notes

**Description:** Create a new note (protected)

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "title": "My First Note",
  "content": "This is the content of my note."
}
```

**Success (201):**
```json
{
  "id": "uuid",
  "title": "My First Note",
  "content": "This is the content of my note.",
  "createdAt": "2026-01-03T10:00:00Z",
  "updatedAt": "2026-01-03T10:00:00Z"
}
```

### GET /notes

**Description:** List my notes with pagination (protected)

**Headers:** `Authorization: Bearer <token>`

**Query params:** `?page=1&limit=10`

**Success (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "My First Note",
      "content": "This is the content...",
      "createdAt": "2026-01-03T10:00:00Z",
      "updatedAt": "2026-01-03T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### GET /notes/search

**Description:** Search notes by title/content (protected)

**Headers:** `Authorization: Bearer <token>`

**Query params:** `?q=search+term&page=1&limit=10`

**Success (200):** Same format as GET /notes

### GET /notes/:id

**Description:** Get a specific note (protected)

**Headers:** `Authorization: Bearer <token>`

**Success (200):**
```json
{
  "id": "uuid",
  "title": "My First Note",
  "content": "This is the content of my note.",
  "createdAt": "2026-01-03T10:00:00Z",
  "updatedAt": "2026-01-03T10:00:00Z"
}
```

**Error (404):**
```json
{
  "statusCode": 404,
  "message": "Note not found",
  "error": "Not Found"
}
```

### PUT /notes/:id

**Description:** Update a note (protected)

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "title": "Updated Title",
  "content": "Updated content."
}
```

**Success (200):** Returns updated note

### DELETE /notes/:id

**Description:** Soft delete a note (protected)

**Headers:** `Authorization: Bearer <token>`

**Success (204):** No content

---

## Testing Strategy

### Unit Tests (80% minimum coverage)

```typescript
describe('NotesService', () => {
  describe('create', () => {
    it('should create a note for the user');
    it('should set timestamps automatically');
  });

  describe('findAll', () => {
    it('should return only user notes');
    it('should paginate results');
    it('should exclude soft-deleted notes');
  });

  describe('findOne', () => {
    it('should return note if user owns it');
    it('should throw NotFoundException if note does not exist');
    it('should throw ForbiddenException if user does not own note');
  });

  describe('update', () => {
    it('should update note fields');
    it('should update updatedAt timestamp');
    it('should validate ownership');
  });

  describe('remove', () => {
    it('should soft delete note');
    it('should set deletedAt timestamp');
    it('should validate ownership');
  });

  describe('search', () => {
    it('should search by title');
    it('should search by content');
    it('should be case-insensitive');
  });
});
```

### E2E Tests

```typescript
describe('Notes Endpoints', () => {
  describe('POST /notes', () => {
    it('should create note when authenticated');
    it('should fail when not authenticated');
    it('should validate input');
  });

  describe('GET /notes', () => {
    it('should return user notes');
    it('should paginate correctly');
  });

  describe('GET /notes/:id', () => {
    it('should return note');
    it('should return 404 for non-existent note');
    it('should return 403 for other user note');
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
  "@nestjs/config": "^3.0.0",
  "@nestjs/swagger": "^7.0.0",
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.1"
}
```

### ORM (Prisma)

```json
{
  "@prisma/client": "^5.0.0"
}
// Dev: "prisma": "^5.0.0"
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

---

## Configuration (.env)

```bash
# Database
DATABASE_URL="postgresql://admin:admin@localhost:5432/notes_app_db?schema=public"

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=3600

# App
NODE_ENV=development
PORT=3002
```

---

## Code Conventions

### Naming

- Controllers: `*.controller.ts`
- Services: `*.service.ts`
- Repositories: `*.repository.ts`
- DTOs: `*.dto.ts`
- Entities: `*.entity.ts`

### Style

- Strict TypeScript
- Prettier + ESLint
- 2 spaces indentation

---

## Quick Reference

**Where does X go?**

- Business logic → `src/notes/notes.service.ts`
- DTOs → `src/notes/dto/`
- Database access → `src/notes/notes.repository.ts`
- Endpoints → `src/notes/notes.controller.ts`
- Entities → `src/notes/entities/`

**Prisma Commands:**

```bash
pnpm exec prisma generate          # Generate client
pnpm exec prisma migrate dev       # Run migrations
pnpm exec prisma studio            # Open Prisma Studio
```

---

## Learning Goals

Upon completing this project:

- [x] Understand NestJS modular architecture
- [x] Implement CRUD operations with Prisma
- [x] Implement soft delete pattern
- [x] Build search functionality
- [x] Implement JWT authentication
- [x] Write unit and E2E tests

---

## Next Steps

After completion:

1. Add note categories/tags
2. Add note sharing between users
3. Add rich text content support

Then proceed to: **Blog REST API** (4th beginner project)

---

**Last updated:** 2026-01-03
