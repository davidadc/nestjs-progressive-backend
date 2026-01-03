# AI_CONTEXT.md - Context for Claude Code

---

## Project Information

**Name:** Simple CRUD API
**Level:** Beginner
**Description:** Generic CRUD API for managing items (books, movies, products, etc). Demonstrates complete CRUD operations with validation, pagination, and filtering.
**ORM:** Prisma
**Stack:** NestJS + TypeScript + PostgreSQL + Prisma

---

## Project Structure

### Beginner Level (Modular 3-Layer)

```
src/
├── items/                     # Items feature module
│   ├── items.module.ts
│   ├── items.controller.ts
│   ├── items.service.ts
│   ├── items.repository.ts
│   ├── items.repository.interface.ts
│   ├── entities/
│   │   └── item.entity.ts
│   └── dto/
│       ├── create-item.dto.ts
│       ├── update-item.dto.ts
│       ├── find-items.dto.ts
│       └── item-response.dto.ts
├── common/                    # Shared utilities
│   └── dto/
│       ├── pagination.dto.ts
│       └── paginated-response.dto.ts
├── config/                    # App configuration
│   ├── app.config.ts
│   ├── database.config.ts
│   └── index.ts
├── prisma/                    # Database module
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── app.module.ts
└── main.ts

test/
├── items.e2e-spec.ts
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
- DTO Pattern
- Dependency Injection

**Flow:**
```
HTTP Request
    ↓
Controller (validates request, transforms DTOs)
    ↓
Service (business logic, throws NotFoundException)
    ↓
Repository (Prisma operations, pagination, filtering)
    ↓
Database (PostgreSQL)
```

---

## Entities

### Item Entity

```typescript
export type Item = {
  id: string;          // UUID, auto-generated
  name: string;        // Required, 2-100 chars
  description: string | null;
  price: Decimal | null;
  quantity: number;    // Default 0
  category: string | null;
  isActive: boolean;   // Default true
  createdAt: Date;
  updatedAt: Date;
}
```

### DTOs

**CreateItemDto** (input)
- name: string (@IsNotEmpty, @MinLength(2), @MaxLength(100))
- description?: string (@IsOptional, @MaxLength(500))
- price?: number (@IsOptional, @IsNumber, @Min(0))
- quantity?: number (@IsOptional, @IsInt, @Min(0))
- category?: string (@IsOptional)

**UpdateItemDto** (extends PartialType of CreateItemDto)

**FindItemsDto** (extends PaginationDto)
- search?: string (filters name/description)
- category?: string
- sort?: 'name' | 'price' | 'createdAt'
- order?: 'asc' | 'desc'
- isActive?: boolean

**ItemResponseDto** (output)
- All Item fields with price converted to number

---

## Endpoints

### GET /items
**Description:** List items with pagination, search, and filters

**Query Parameters:**
- page (default: 1)
- limit (default: 10, max: 100)
- search (filters name OR description)
- category
- sort (name, price, createdAt)
- order (asc, desc)
- isActive (boolean)

**Response (200):**
```json
{
  "data": [Item[]],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

### GET /items/:id
**Description:** Get single item by UUID

**Response (200):** ItemResponseDto
**Error (404):** Item not found

### POST /items
**Description:** Create new item

**Request:** CreateItemDto
**Response (201):** ItemResponseDto
**Error (400):** Validation failed

### PUT /items/:id
**Description:** Full update of item

**Request:** UpdateItemDto
**Response (200):** ItemResponseDto
**Error (404):** Item not found

### PATCH /items/:id
**Description:** Partial update of item

**Request:** UpdateItemDto
**Response (200):** ItemResponseDto
**Error (404):** Item not found

### DELETE /items/:id
**Description:** Delete item

**Response (204):** No content
**Error (404):** Item not found

---

## Testing Strategy

### Unit Tests (80%+ coverage)

```typescript
describe('ItemsService', () => {
  describe('create', () => {
    it('should create an item successfully');
  });
  describe('findAll', () => {
    it('should return paginated items');
    it('should apply search filter');
    it('should apply category filter');
  });
  describe('findOne', () => {
    it('should return an item by id');
    it('should throw NotFoundException when not found');
  });
  describe('update', () => {
    it('should update an item successfully');
    it('should throw NotFoundException when not found');
  });
  describe('remove', () => {
    it('should delete an item successfully');
    it('should throw NotFoundException when not found');
  });
});
```

### E2E Tests

```typescript
describe('Items (e2e)', () => {
  describe('POST /items', () => {
    it('should create a new item');
    it('should fail validation for missing name');
  });
  describe('GET /items', () => {
    it('should return paginated items');
    it('should filter by search term');
    it('should filter by category');
  });
  // ... more tests
});
```

---

## Dependencies

### Core
```json
{
  "@nestjs/common": "^11.0.0",
  "@nestjs/core": "^11.0.0",
  "@nestjs/config": "^4.0.0",
  "@nestjs/swagger": "^11.0.0",
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.1"
}
```

### ORM-Specific (Prisma)
```json
{
  "@prisma/client": "^7.0.0",
  "@prisma/adapter-pg": "^7.0.0",
  "pg": "^8.11.0"
}
// Dev: "prisma": "^7.0.0"
```

---

## Configuration (.env)

```bash
# Database
DATABASE_URL="postgresql://admin:admin@localhost:5432/crud_api_db?schema=public"

# Application
PORT=3001
NODE_ENV=development
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

*Beginner (Modular 3-Layer):*
- Business logic → `src/items/items.service.ts`
- DTOs → `src/items/dto/`
- Database access → `src/items/items.repository.ts`
- Endpoints → `src/items/items.controller.ts`
- Entities → `src/items/entities/`

**ORM Commands:**

```bash
pnpm exec prisma generate
pnpm exec prisma migrate dev --name migration_name
pnpm exec prisma studio
```

---

## Learning Goals

Upon completing this project:
- [x] Understand CRUD operations with NestJS
- [x] Implement input validation with class-validator
- [x] Use Prisma ORM for database operations
- [x] Implement pagination and filtering
- [x] Write unit and E2E tests
- [x] Document API with Swagger

---

## Next Steps

After completion:
1. Add soft delete with deletedAt timestamp
2. Add tags/labels for more flexible categorization
3. Consider bulk operations (create many, delete many)

Then proceed to: **Notes App** (3rd beginner project)

---

**Last updated:** 2026-01-03
**To use:** Copy to project root, then run `claude code`
