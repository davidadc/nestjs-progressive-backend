# Simple CRUD API - Implementation Progress

**Project:** crud-api
**Level:** Beginner
**ORM:** Prisma
**Architecture:** 3-Layer (Controller -> Service -> Repository)

---

## Project Overview

**Description:** Generic CRUD API for managing items (books, movies, products, etc). Demonstrates complete CRUD operations with validation, pagination, and filtering.

**Technical Requirements:**

- Complete CRUD operations (Create, Read, Update, Delete)
- Input validation with class-validator
- Basic pagination (page, limit)
- Simple filters (search, sort, order)
- Prisma for database access
- Swagger documentation

---

## Implementation Status

### Phase 1: Project Scaffolding

- [x] Initialize NestJS project with CLI (`nest new crud-api`)
- [x] Install core dependencies (@nestjs/config)
- [x] Install validation dependencies (class-validator, class-transformer)
- [x] Install documentation (@nestjs/swagger)
- [x] Install Prisma dependencies (prisma, @prisma/client, @prisma/adapter-pg, pg)
- [x] Create .env and .env.example files
- [x] Configure tsconfig.json paths

### Phase 2: Prisma Setup

- [x] Initialize Prisma (`pnpm exec prisma init`)
- [x] Define Item model with fields:
  - id (UUID, primary key)
  - name (string, required)
  - description (string, optional)
  - price (decimal, optional)
  - quantity (integer, default 0)
  - category (string, optional)
  - isActive (boolean, default true)
  - createdAt (datetime)
  - updatedAt (datetime)
- [x] Configure datasource for PostgreSQL
- [x] Run initial migration (`pnpm exec prisma migrate dev --name init`)
- [x] Generate Prisma client

### Phase 3: Prisma Module

- [x] Create PrismaService with proper lifecycle hooks
- [x] Create PrismaModule as global module
- [x] Configure connection with @prisma/adapter-pg

### Phase 4: Items Module - Domain Layer

- [x] Create Item entity type definition (src/items/entities/item.entity.ts)
- [x] Create IItemsRepository interface (src/items/items.repository.interface.ts)

### Phase 5: Items Module - Application Layer

- [x] Create CreateItemDto with validation:
  - name: @IsString(), @IsNotEmpty(), @MinLength(2), @MaxLength(100)
  - description: @IsOptional(), @IsString(), @MaxLength(500)
  - price: @IsOptional(), @IsNumber(), @Min(0)
  - quantity: @IsOptional(), @IsInt(), @Min(0)
  - category: @IsOptional(), @IsString()
- [x] Create UpdateItemDto (PartialType of CreateItemDto)
- [x] Create ItemResponseDto (excludes internal fields if any)
- [x] Create PaginationDto:
  - page: @IsOptional(), @IsInt(), @Min(1), default 1
  - limit: @IsOptional(), @IsInt(), @Min(1), @Max(100), default 10
- [x] Create FindItemsDto (extends PaginationDto):
  - search: @IsOptional(), @IsString()
  - category: @IsOptional(), @IsString()
  - sort: @IsOptional(), @IsIn(['name', 'price', 'createdAt'])
  - order: @IsOptional(), @IsIn(['asc', 'desc'])
  - isActive: @IsOptional(), @Transform to boolean
- [x] Create PaginatedResponseDto<T> for consistent pagination responses
- [x] Create ItemsService with business logic:
  - create(dto: CreateItemDto): Promise<Item>
  - findAll(query: FindItemsDto): Promise<PaginatedResponse<Item>>
  - findOne(id: string): Promise<Item>
  - update(id: string, dto: UpdateItemDto): Promise<Item>
  - remove(id: string): Promise<void>

### Phase 6: Items Module - Infrastructure Layer

- [x] Create ItemsRepository implementing IItemsRepository:
  - Uses PrismaService for database operations
  - Implements pagination logic (skip, take)
  - Implements search (contains on name/description)
  - Implements filtering (category, isActive)
  - Implements sorting (orderBy)
- [x] Create ItemsController with Swagger documentation:
  - @Get() findAll(@Query() query: FindItemsDto)
  - @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string)
  - @Post() create(@Body() dto: CreateItemDto)
  - @Put(':id') update(@Param('id') id, @Body() dto: UpdateItemDto)
  - @Patch(':id') partialUpdate(@Param('id') id, @Body() dto: UpdateItemDto)
  - @Delete(':id') remove(@Param('id') id: string)
- [x] Create ItemsModule wiring all components

### Phase 7: Common Module

- [x] Create common/dto/pagination.dto.ts (reusable)
- [x] Create common/dto/paginated-response.dto.ts
- [x] Create common/pipes/ (if needed)

### Phase 8: Configuration

- [x] Create config/app.config.ts
- [x] Create config/database.config.ts
- [x] Wire up ConfigModule with validation

### Phase 9: App Module Integration

- [x] Update AppModule with all imports:
  - ConfigModule (global)
  - PrismaModule (global)
  - ItemsModule
- [x] Configure main.ts:
  - [x] Swagger documentation at /docs
  - [x] Global ValidationPipe with transform: true
  - [x] Enable CORS

### Phase 10: Testing

- [x] Create ItemsService unit tests:
  - Test create() success
  - Test create() validation
  - Test findAll() with pagination
  - Test findAll() with search
  - Test findAll() with filters
  - Test findOne() success
  - Test findOne() not found
  - Test update() success
  - Test update() not found
  - Test remove() success
  - Test remove() not found
- [x] Create ItemsRepository unit tests
- [x] Create E2E tests for all endpoints
- [x] Achieve 80%+ coverage on core logic

### Phase 11: Documentation

- [x] Swagger API documentation complete
- [x] PROGRESS.md updated (this file)
- [x] AI_CONTEXT.md created
- [x] README.md for project

---

## Endpoints

| Method | Endpoint     | Description                                 | Auth Required |
| ------ | ------------ | ------------------------------------------- | ------------- |
| GET    | `/items`     | List items with pagination, search, filters | No            |
| GET    | `/items/:id` | Get single item by ID                       | No            |
| POST   | `/items`     | Create new item                             | No            |
| PUT    | `/items/:id` | Full update of item                         | No            |
| PATCH  | `/items/:id` | Partial update of item                      | No            |
| DELETE | `/items/:id` | Delete item                                 | No            |

---

## Request/Response Examples

### List Items

```http
GET /items?page=1&limit=10&search=book&category=fiction&sort=price&order=asc
```

**Response 200:**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "The Great Book",
      "description": "A wonderful fiction book",
      "price": 29.99,
      "quantity": 100,
      "category": "fiction",
      "isActive": true,
      "createdAt": "2026-01-03T10:00:00Z",
      "updatedAt": "2026-01-03T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

### Create Item

```http
POST /items
Content-Type: application/json

{
  "name": "New Item",
  "description": "Item description",
  "price": 19.99,
  "quantity": 50,
  "category": "electronics"
}
```

**Response 201:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "New Item",
  "description": "Item description",
  "price": 19.99,
  "quantity": 50,
  "category": "electronics",
  "isActive": true,
  "createdAt": "2026-01-03T10:00:00Z",
  "updatedAt": "2026-01-03T10:00:00Z"
}
```

### Error Response (400)

```json
{
  "statusCode": 400,
  "message": ["name must be longer than or equal to 2 characters"],
  "error": "Bad Request"
}
```

### Error Response (404)

```json
{
  "statusCode": 404,
  "message": "Item with ID '123' not found",
  "error": "Not Found"
}
```

---

## Entity / Model

```typescript
// Item
{
  id: string;          // UUID, auto-generated
  name: string;        // Required, 2-100 chars
  description?: string; // Optional, max 500 chars
  price?: number;      // Optional, >= 0
  quantity: number;    // Default 0, >= 0
  category?: string;   // Optional, for filtering
  isActive: boolean;   // Default true
  createdAt: Date;     // Auto-generated
  updatedAt: Date;     // Auto-updated
}
```

**Prisma Schema:**

```prisma
model Item {
  id          String   @id @default(uuid())
  name        String
  description String?
  price       Decimal? @db.Decimal(10, 2)
  quantity    Int      @default(0)
  category    String?
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("items")
}
```

---

## Folder Structure

```
crud-api/
├── src/
│   ├── items/
│   │   ├── items.module.ts
│   │   ├── items.controller.ts
│   │   ├── items.service.ts
│   │   ├── items.service.spec.ts
│   │   ├── items.repository.ts
│   │   ├── items.repository.interface.ts
│   │   ├── dto/
│   │   │   ├── create-item.dto.ts
│   │   │   ├── update-item.dto.ts
│   │   │   ├── find-items.dto.ts
│   │   │   └── item-response.dto.ts
│   │   └── entities/
│   │       └── item.entity.ts
│   ├── common/
│   │   └── dto/
│   │       ├── pagination.dto.ts
│   │       └── paginated-response.dto.ts
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   └── index.ts
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   └── schema.prisma
├── test/
│   ├── items.e2e-spec.ts
│   └── jest-e2e.json
├── .env
├── .env.example
├── package.json
├── tsconfig.json
├── nest-cli.json
├── AI_CONTEXT.md
├── README.md
└── PROGRESS.md (this file)
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
open http://localhost:3000/docs
```

---

## Design Decisions

1. **Generic Item Entity:** Using a flexible Item model that can represent books, products, movies, etc. The `category` field allows grouping without requiring separate tables.

2. **Soft Active Flag:** Using `isActive` boolean instead of hard delete. This allows filtering out "deleted" items while preserving data.

3. **Repository Pattern:** Even at beginner level, we use a repository interface to abstract database access. This makes testing easier and follows good practices.

4. **Pagination Response Format:** Following the API_CONVENTIONS.md format with `data` array and `pagination` object for consistent API responses.

5. **Price as Decimal:** Using Prisma's Decimal type with precision (10,2) for accurate monetary values.

---

## Dependencies

```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/swagger": "^7.0.0",
    "@prisma/adapter-pg": "^6.0.0",
    "@prisma/client": "^6.0.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "pg": "^8.11.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "jest": "^29.5.0",
    "prisma": "^6.0.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0"
  }
}
```

---

## Test Coverage Target

```
items.service.ts      | 80%+ statements | 80%+ functions
items.repository.ts   | 80%+ statements | 80%+ functions
```

---

## Patterns Used (Beginner Level)

| Pattern                  | Usage                                             |
| ------------------------ | ------------------------------------------------- |
| **Repository**           | ItemsRepository abstracts Prisma operations       |
| **DTO**                  | Separate DTOs for create, update, response, query |
| **Dependency Injection** | NestJS built-in DI for all services               |
| **Decorator**            | @ApiTags, @ApiOperation for Swagger               |

---

## Known Issues / TODOs

- [ ] Consider adding soft delete with deletedAt timestamp
- [ ] Consider adding tags/labels for more flexible categorization
- [ ] Consider bulk operations (create many, delete many)

---

**Started:** 2026-01-03
**Completed:** 2026-01-03
**Next Steps:** After completion, proceed to Notes App (3rd beginner project)
