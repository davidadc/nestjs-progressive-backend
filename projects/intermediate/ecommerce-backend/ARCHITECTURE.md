# ARCHITECTURE.md - E-commerce Backend

## Project Architecture Overview

**Project:** E-commerce Backend
**Level:** Intermediate
**Architecture Style:** Modular Clean Architecture (4-Layer)
**ORM:** TypeORM

---

## Layer Structure

### Intermediate: 4-Layer Clean Architecture

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│  (Controllers, Pipes, Guards)           │
├─────────────────────────────────────────┤
│           Application Layer             │
│  (Use Cases, DTOs, Mappers, Services)   │
├─────────────────────────────────────────┤
│             Domain Layer                │
│  (Entities, Repository Interfaces)      │
├─────────────────────────────────────────┤
│         Infrastructure Layer            │
│  (Repositories, ORM Entities, Config)   │
└─────────────────────────────────────────┘
```

**Request Flow:**
```
HTTP Request → Controller → UseCase/Service → Domain Entity → Repository → Database
```

---

## Folder Structure

```
src/
├── auth/                              # Authentication module
│   ├── auth.module.ts
│   ├── domain/
│   │   ├── entities/
│   │   │   └── user.entity.ts         # Domain User
│   │   └── repositories/
│   │       └── user.repository.interface.ts
│   ├── application/
│   │   ├── dto/
│   │   │   ├── register.dto.ts
│   │   │   ├── login.dto.ts
│   │   │   └── user-response.dto.ts
│   │   ├── services/
│   │   │   └── auth.service.ts
│   │   └── mappers/
│   │       └── user.mapper.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── auth.controller.ts
│       ├── persistence/
│       │   ├── user.orm-entity.ts     # TypeORM entity
│       │   └── user.repository.ts
│       ├── guards/
│       │   ├── jwt-auth.guard.ts
│       │   └── roles.guard.ts
│       └── strategies/
│           └── jwt.strategy.ts
│
├── products/                          # Products module
│   ├── products.module.ts
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── product.entity.ts
│   │   │   └── category.entity.ts
│   │   └── repositories/
│   │       ├── product.repository.interface.ts
│   │       └── category.repository.interface.ts
│   ├── application/
│   │   ├── dto/
│   │   ├── services/
│   │   │   ├── products.service.ts
│   │   │   └── categories.service.ts
│   │   └── mappers/
│   │       ├── product.mapper.ts
│   │       └── category.mapper.ts
│   └── infrastructure/
│       ├── controllers/
│       │   ├── products.controller.ts
│       │   └── categories.controller.ts
│       └── persistence/
│           ├── product.orm-entity.ts
│           ├── category.orm-entity.ts
│           ├── product.repository.ts
│           └── category.repository.ts
│
├── cart/                              # Shopping cart module
│   ├── cart.module.ts
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── cart.entity.ts
│   │   │   └── cart-item.entity.ts
│   │   └── repositories/
│   │       └── cart.repository.interface.ts
│   ├── application/
│   │   ├── dto/
│   │   ├── services/
│   │   │   └── cart.service.ts
│   │   └── mappers/
│   │       └── cart.mapper.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── cart.controller.ts
│       └── persistence/
│           ├── cart.orm-entity.ts
│           ├── cart-item.orm-entity.ts
│           └── cart.repository.ts
│
├── orders/                            # Orders module
│   ├── orders.module.ts
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── order.entity.ts
│   │   │   └── order-item.entity.ts
│   │   └── repositories/
│   │       └── order.repository.interface.ts
│   ├── application/
│   │   ├── dto/
│   │   ├── services/
│   │   │   └── orders.service.ts
│   │   ├── use-cases/
│   │   │   └── create-order.use-case.ts
│   │   └── mappers/
│   │       └── order.mapper.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── orders.controller.ts
│       └── persistence/
│           ├── order.orm-entity.ts
│           ├── order-item.orm-entity.ts
│           └── order.repository.ts
│
├── reviews/                           # Reviews module
│   ├── reviews.module.ts
│   ├── domain/
│   ├── application/
│   └── infrastructure/
│
├── common/                            # Shared utilities
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   ├── roles.decorator.ts
│   │   └── public.decorator.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── interceptors/
│   │   └── response.interceptor.ts
│   └── dto/
│       └── pagination.dto.ts
│
├── config/                            # Configuration
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── app.config.ts
│
├── app.module.ts
└── main.ts
```

---

## Design Patterns Required

### Intermediate Level Patterns

- [x] **Repository Pattern** - Abstract data access behind interfaces (IProductRepository, IOrderRepository)
- [x] **Factory Pattern** - Entity creation with validation (Order.create(), CartItem.create())
- [x] **Singleton Pattern** - Configuration services (NestJS default)
- [x] **Decorator Pattern** - @CurrentUser(), @Roles(), @Public() decorators
- [x] **Builder Pattern** - Complex DTO construction (OrderResponseDto with nested items)
- [x] **Facade Pattern** - CartService simplifies cart operations across repositories
- [x] **Mapper Pattern** - Entity ↔ DTO transformations (ProductMapper, OrderMapper)

---

## Layer Responsibilities

### Presentation Layer (Infrastructure/Controllers)

**Purpose:** Handle HTTP requests, validate input, format responses

**Contains:**
- Controllers with route handlers
- Guards (JWT, Roles)
- Interceptors (response formatting)
- Pipes (validation)

**Rules:**
- NO business logic
- NO direct database access
- Validate input with class-validator
- Apply response envelope format

### Application Layer

**Purpose:** Orchestrate use cases, coordinate domain objects

**Contains:**
- **Services** - CRUD operations, business orchestration
- **Use Cases** - Complex business operations (CreateOrderUseCase)
- **DTOs** - Request/response shapes
- **Mappers** - Entity ↔ DTO conversions

**Rules:**
- NO HTTP concerns
- NO direct ORM access
- Coordinate domain entities
- Handle transactions
- Call repository interfaces

### Domain Layer

**Purpose:** Core business logic, domain rules

**Contains:**
- **Entities** - Business objects with behavior
- **Repository Interfaces** - Data access contracts

**Rules:**
- NO framework dependencies
- NO infrastructure concerns
- Pure TypeScript classes
- Business validation logic

### Infrastructure Layer

**Purpose:** Technical implementations

**Contains:**
- **Persistence** - TypeORM entities and repository implementations
- **Guards** - Authentication/authorization
- **Strategies** - Passport JWT strategy
- **Config** - Environment configuration

**Rules:**
- Implement domain interfaces
- Handle TypeORM specifics
- NO business logic

---

## Domain vs ORM Entities

### Separation Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                        Domain Layer                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Product (domain/entities/product.entity.ts)            │    │
│  │  - Pure TypeScript class                                │    │
│  │  - Business methods and validation                      │    │
│  │  - No decorators                                        │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              ↑
                         ProductMapper
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  ProductOrmEntity (persistence/product.orm-entity.ts)   │    │
│  │  - TypeORM decorators (@Entity, @Column)                │    │
│  │  - Database mapping only                                │    │
│  │  - No business logic                                    │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Domain Entity Example

```typescript
// domain/entities/product.entity.ts
export class Product {
  constructor(
    public readonly id: string,
    public name: string,
    public description: string,
    public price: number,
    public stock: number,
    public categoryId: string,
    public isActive: boolean,
  ) {}

  decreaseStock(quantity: number): void {
    if (quantity > this.stock) {
      throw new InsufficientStockException(this.id, quantity, this.stock);
    }
    this.stock -= quantity;
  }

  isInStock(): boolean {
    return this.stock > 0;
  }
}
```

### ORM Entity Example

```typescript
// infrastructure/persistence/product.orm-entity.ts
@Entity('products')
export class ProductOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ default: 0 })
  stock: number;

  @ManyToOne(() => CategoryOrmEntity)
  @JoinColumn({ name: 'categoryId' })
  category: CategoryOrmEntity;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
```

---

## Use Case Pattern

### When to Use

Use cases encapsulate complex business operations that:
- Span multiple repositories
- Require transactions
- Have significant business logic

### CreateOrderUseCase Example

```typescript
@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(CART_REPOSITORY)
    private readonly cartRepository: ICartRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(userId: string, dto: CreateOrderDto): Promise<OrderResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      // 1. Get user's cart
      const cart = await this.cartRepository.findByUserId(userId);
      if (!cart || cart.items.length === 0) {
        throw new EmptyCartException();
      }

      // 2. Validate stock and calculate total
      let total = 0;
      for (const item of cart.items) {
        const product = await this.productRepository.findById(item.productId);
        product.decreaseStock(item.quantity);
        await this.productRepository.save(product, manager);
        total += product.price * item.quantity;
      }

      // 3. Create order
      const order = Order.create(userId, cart.items, total, dto.shippingAddress);
      await this.orderRepository.save(order, manager);

      // 4. Clear cart
      await this.cartRepository.clear(cart.id, manager);

      return OrderMapper.toDto(order);
    });
  }
}
```

---

## Mapper Pattern

### Implementation

```typescript
// application/mappers/product.mapper.ts
export class ProductMapper {
  // Domain → DTO (for API responses)
  static toDto(product: Product): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      isActive: product.isActive,
    };
  }

  // ORM Entity → Domain (in repository)
  static toDomain(orm: ProductOrmEntity): Product {
    return new Product(
      orm.id,
      orm.name,
      orm.description,
      Number(orm.price),
      orm.stock,
      orm.categoryId,
      orm.isActive,
    );
  }

  // Domain → ORM Entity (in repository for persistence)
  static toOrm(domain: Product): Partial<ProductOrmEntity> {
    return {
      id: domain.id,
      name: domain.name,
      description: domain.description,
      price: domain.price,
      stock: domain.stock,
      categoryId: domain.categoryId,
      isActive: domain.isActive,
    };
  }
}
```

---

## Repository Pattern

### Interface Definition

```typescript
// domain/repositories/product.repository.interface.ts
export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findAll(filter: ProductFilter): Promise<PaginatedResult<Product>>;
  save(product: Product, manager?: EntityManager): Promise<Product>;
  delete(id: string): Promise<void>;
}
```

### Implementation

```typescript
// infrastructure/persistence/product.repository.ts
@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly repo: Repository<ProductOrmEntity>,
  ) {}

  async findById(id: string): Promise<Product | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? ProductMapper.toDomain(orm) : null;
  }

  async save(product: Product, manager?: EntityManager): Promise<Product> {
    const repo = manager?.getRepository(ProductOrmEntity) ?? this.repo;
    const orm = repo.create(ProductMapper.toOrm(product));
    const saved = await repo.save(orm);
    return ProductMapper.toDomain(saved);
  }
}
```

### Module Wiring

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([ProductOrmEntity])],
  providers: [
    ProductsService,
    {
      provide: PRODUCT_REPOSITORY,
      useClass: ProductRepository,
    },
  ],
})
export class ProductsModule {}
```

---

## Response Envelope Format

### Intermediate Level Response Standard

```typescript
// Success Response
{
  "success": true,
  "statusCode": 200,
  "data": { ... },
  "pagination": {           // Optional, for lists
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}

// Error Response
{
  "success": false,
  "statusCode": 400,
  "error": {
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "must be a valid email" }
    ]
  }
}
```

### Response Interceptor

```typescript
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        statusCode: context.switchToHttp().getResponse().statusCode,
        data,
      })),
    );
  }
}
```

---

## Error Handling

### Exception Filter

```typescript
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.message
      : 'Internal server error';

    response.status(status).json({
      success: false,
      statusCode: status,
      error: { message },
    });
  }
}
```

---

## Architecture Checklist

### Intermediate Level Requirements

#### Domain Layer
- [x] Domain entities with behavior
- [x] Repository interfaces defined
- [x] Domain exceptions created

#### Application Layer
- [x] Use cases for complex operations
- [x] Services for CRUD operations
- [x] DTOs for all endpoints
- [x] Mappers for entity ↔ DTO conversions

#### Infrastructure Layer
- [x] Repository implementations (TypeORM)
- [x] ORM entities separate from domain
- [x] Controllers with proper routing
- [x] Guards for authentication/authorization

#### Cross-Cutting
- [x] JWT Authentication
- [x] Role-based authorization (customer/admin)
- [x] Validation (DTOs with class-validator)
- [x] Response envelope format
- [x] Exception filter
- [x] Swagger documentation

#### Testing
- [x] Unit tests (80%+ coverage)
- [x] E2E tests
- [x] Mocked dependencies

---

## Quick Reference

**Where does code go?**

| Concern | Location |
|---------|----------|
| HTTP handling | `src/{module}/infrastructure/controllers/` |
| Business logic | `src/{module}/application/services/` or `use-cases/` |
| Data contracts | `src/{module}/application/dto/` |
| Entity ↔ DTO | `src/{module}/application/mappers/` |
| Domain entities | `src/{module}/domain/entities/` |
| Repository interfaces | `src/{module}/domain/repositories/` |
| Repository implementations | `src/{module}/infrastructure/persistence/` |
| ORM entities | `src/{module}/infrastructure/persistence/*.orm-entity.ts` |

---

## TypeORM Commands

```bash
# Generate migration from entity changes
pnpm run typeorm migration:generate -- --name MigrationName

# Run pending migrations
pnpm run typeorm migration:run

# Revert last migration
pnpm run typeorm migration:revert
```

---

**Last updated:** 2026-01-11
