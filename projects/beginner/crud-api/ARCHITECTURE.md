# ARCHITECTURE.md - Simple CRUD API

## Project Architecture Overview

**Project:** Simple CRUD API
**Level:** Beginner
**Architecture Style:** Modular 3-Layer
**ORM:** Prisma 7 (with @prisma/adapter-pg)

---

## Layer Structure

### Beginner: 3-Layer Architecture

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│  (Controllers, DTOs, Pipes)             │
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
HTTP Request → Controller → Service → Repository → Database
```

---

## Folder Structure

```
src/
├── items/                          # Items feature module
│   ├── items.module.ts
│   ├── items.controller.ts         # CRUD endpoints
│   ├── items.service.ts            # Business logic
│   ├── items.service.spec.ts       # Service unit tests
│   ├── items.repository.ts         # Prisma data access
│   ├── items.repository.spec.ts    # Repository unit tests
│   ├── items.repository.interface.ts  # Repository contract
│   ├── entities/
│   │   └── item.entity.ts          # Item type definition
│   └── dto/
│       ├── create-item.dto.ts      # Create input
│       ├── update-item.dto.ts      # Update input
│       ├── find-items.dto.ts       # Query parameters
│       └── item-response.dto.ts    # Item output
├── common/                         # Shared utilities
│   └── dto/
│       ├── pagination.dto.ts       # Base pagination params
│       └── paginated-response.dto.ts  # Paginated response wrapper
├── config/                         # Environment configuration
│   ├── app.config.ts               # App settings
│   ├── database.config.ts          # Database settings
│   └── index.ts
├── prisma/                         # Database module
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── app.module.ts
└── main.ts

prisma/
└── schema.prisma                   # Database schema

test/
├── items.e2e-spec.ts               # E2E tests
└── jest-e2e.json
```

---

## Design Patterns Required

### Beginner Level Patterns

- [x] **Repository Pattern** - `ItemsRepository` abstracts Prisma, implements `IItemsRepository` interface
- [x] **Factory Pattern** - `ItemResponseDto.fromEntity()` creates response objects
- [x] **Singleton Pattern** - Services are singleton instances (NestJS default)
- [x] **Decorator Pattern** - Validation decorators on DTOs (@IsNotEmpty, @Min, etc.)

---

## Layer Responsibilities

### Presentation Layer

**Purpose:** Handle HTTP requests, validate input, format responses

**Contains:**
- `items.controller.ts` - CRUD endpoints (GET, POST, PUT, PATCH, DELETE)
- DTOs in `items/dto/` - Request/response shapes
- `common/dto/` - Shared pagination DTOs

**Endpoints:**
```
GET    /items          # List with pagination, search, filters
GET    /items/:id      # Get single item
POST   /items          # Create item
PUT    /items/:id      # Full update
PATCH  /items/:id      # Partial update
DELETE /items/:id      # Delete item
```

**Rules:**
- NO business logic
- NO direct database access
- Validate all input with class-validator
- Transform responses to DTOs

### Business Layer

**Purpose:** Implement business logic and coordinate data access

**Contains:**
- `items.service.ts` - CRUD operations, validation, error handling

**Responsibilities:**
- Validate item existence before update/delete
- Throw NotFoundException for missing items
- Coordinate with repository layer
- Handle business rules (if any)

**Rules:**
- NO HTTP/infrastructure concerns
- Delegate data access to repository
- Throw appropriate NestJS exceptions

### Data Access Layer

**Purpose:** Abstract database operations behind clean interfaces

**Contains:**
- `items.repository.interface.ts` - Repository contract
- `items.repository.ts` - Prisma implementation
- `prisma.service.ts` - Database connection

**Responsibilities:**
- CRUD operations with Prisma
- Pagination logic (skip, take)
- Search filtering (name, description)
- Sorting (name, price, createdAt)
- Category filtering

**Rules:**
- NO business logic
- Handle Prisma-specific operations
- Return domain entities

---

## Entity Definition

### Item Entity

```typescript
export type Item = {
  id: string;           // UUID, auto-generated
  name: string;         // Required, 2-100 chars
  description: string | null;
  price: Decimal | null;
  quantity: number;     // Default 0
  category: string | null;
  isActive: boolean;    // Default true
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Pagination Pattern

### Request (FindItemsDto)

```typescript
export class FindItemsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;        // Filters name OR description

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsIn(['name', 'price', 'createdAt'])
  sort?: 'name' | 'price' | 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @IsOptional()
  @Transform(/* string to boolean */)
  isActive?: boolean;
}
```

### Response (PaginatedResponse)

```typescript
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

---

## Mapper Pattern

### ItemResponseDto

```typescript
export class ItemResponseDto {
  id: string;
  name: string;
  description: string | null;
  price: number | null;    // Decimal converted to number
  quantity: number;
  category: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(item: Item): ItemResponseDto {
    return {
      ...item,
      price: item.price ? item.price.toNumber() : null,
    };
  }
}
```

---

## Error Handling

### Standard NestJS Exceptions

```typescript
// Item not found
throw new NotFoundException(`Item with id ${id} not found`);

// Validation errors (automatic via ValidationPipe)
// Returns 400 Bad Request with validation messages
```

---

## Repository Interface

### IItemsRepository

```typescript
export interface IItemsRepository {
  create(data: CreateItemDto): Promise<Item>;
  findAll(query: FindItemsDto): Promise<{ items: Item[]; total: number }>;
  findById(id: string): Promise<Item | null>;
  update(id: string, data: UpdateItemDto): Promise<Item>;
  delete(id: string): Promise<void>;
}
```

This interface enables:
- Easy mocking in unit tests
- Potential swap to different ORM
- Clear contract between layers

---

## Module Wiring

```typescript
@Module({
  imports: [PrismaModule],
  controllers: [ItemsController],
  providers: [
    ItemsService,
    {
      provide: 'IItemsRepository',
      useClass: ItemsRepository,
    },
  ],
})
export class ItemsModule {}
```

---

## Architecture Checklist

### Beginner Level Requirements

#### Presentation Layer
- [x] Controller with CRUD endpoints
- [x] DTOs for all operations
- [x] Input validation (class-validator)
- [x] Swagger documentation
- [x] Pagination query parameters

#### Business Layer
- [x] Service with business logic
- [x] NotFoundException handling
- [x] Delegation to repository

#### Data Access Layer
- [x] Repository interface definition
- [x] Repository implementation (Prisma)
- [x] Pagination logic
- [x] Search and filtering
- [x] Sorting

#### Cross-Cutting
- [x] Validation (DTOs + ValidationPipe)
- [x] Error handling (Standard NestJS)
- [x] Configuration (ConfigModule)
- [x] Swagger documentation

#### Testing
- [x] Service unit tests
- [x] Repository unit tests
- [x] E2E tests

---

## Quick Reference

**Where does code go?**

| Concern | Location |
|---------|----------|
| CRUD endpoints | `src/items/items.controller.ts` |
| Business logic | `src/items/items.service.ts` |
| Data access | `src/items/items.repository.ts` |
| Repository contract | `src/items/items.repository.interface.ts` |
| Request DTOs | `src/items/dto/create-item.dto.ts`, etc. |
| Response DTOs | `src/items/dto/item-response.dto.ts` |
| Entity definition | `src/items/entities/item.entity.ts` |
| Pagination DTOs | `src/common/dto/` |
| Database schema | `prisma/schema.prisma` |

---

## Query Examples

### Search + Filter + Paginate

```
GET /items?search=laptop&category=electronics&sort=price&order=desc&page=1&limit=20
```

### Filter by Active Status

```
GET /items?isActive=true&limit=50
```

---

**Last updated:** 2026-01-11
