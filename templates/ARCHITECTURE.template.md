# ARCHITECTURE.md - Project Architecture Guide

**Copy this template to each project root and customize for the specific level.**

---

## Project Architecture Overview

**Project:** {{PROJECT_NAME}}
**Level:** {{LEVEL}} <!-- Beginner | Intermediate | Advanced | Expert -->
**Architecture Style:** {{ARCHITECTURE_STYLE}}
<!--
  Beginner: Modular 3-Layer
  Intermediate: Modular Clean Architecture
  Advanced: Modular DDD + CQRS
  Expert: Distributed DDD + Event Sourcing
-->

---

## Layer Structure

<!-- Choose ONE based on project level -->

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
│  (Repositories, Entities, ORM)          │
└─────────────────────────────────────────┘
```

**Request Flow:**
```
HTTP Request → Controller → Service → Repository → Database
```

### Intermediate: 4-Layer Clean Architecture

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│  (Controllers, Pipes, Guards)           │
├─────────────────────────────────────────┤
│           Application Layer             │
│  (Use Cases, DTOs, Mappers)             │
├─────────────────────────────────────────┤
│             Domain Layer                │
│  (Entities, Repository Interfaces)      │
├─────────────────────────────────────────┤
│         Infrastructure Layer            │
│  (Repositories, External Services)      │
└─────────────────────────────────────────┘
```

**Request Flow:**
```
HTTP Request → Controller → UseCase → Domain Entity → Repository → Database
```

### Advanced: 5-Layer DDD + CQRS

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│  (Controllers, Pipes, Guards)           │
├─────────────────────────────────────────┤
│           Application Layer             │
│  (Commands, Queries, Event Handlers,    │
│   DTOs, Mappers, Application Services)  │
├─────────────────────────────────────────┤
│             Domain Layer                │
│  (Aggregates, Value Objects, Domain     │
│   Events, Repository Interfaces)        │
├─────────────────────────────────────────┤
│         Infrastructure Layer            │
│  (Repositories, External Services,      │
│   Event Publishers, ORM Entities)       │
├─────────────────────────────────────────┤
│           Shared/Common Layer           │
│  (Base Classes, Utilities, Exceptions)  │
└─────────────────────────────────────────┘
```

**Request Flow (Command):**
```
HTTP Request → Controller → CommandBus → CommandHandler → Aggregate → Repository → Database
                                              ↓
                                        Domain Event → EventBus → Event Handlers
```

**Request Flow (Query):**
```
HTTP Request → Controller → QueryBus → QueryHandler → Repository → Database
```

### Expert: Distributed + Event Sourcing

```
┌──────────────────────────────────────────────────────────────┐
│                       API Gateway                            │
├──────────────────────────────────────────────────────────────┤
│  Service A        │  Service B        │  Service C          │
│  ┌─────────────┐  │  ┌─────────────┐  │  ┌─────────────┐    │
│  │ Application │  │  │ Application │  │  │ Application │    │
│  │ Domain      │  │  │ Domain      │  │  │ Domain      │    │
│  │ Infra       │  │  │ Infra       │  │  │ Infra       │    │
│  └─────────────┘  │  └─────────────┘  │  └─────────────┘    │
├──────────────────────────────────────────────────────────────┤
│              Message Queue / Event Bus                       │
├──────────────────────────────────────────────────────────────┤
│              Event Store / Databases                         │
└──────────────────────────────────────────────────────────────┘
```

---

## Folder Structure

### {{LEVEL}} Level Structure

```
src/
├── {{module}}/                      # Feature module
│   ├── {{module}}.module.ts
{{#if BEGINNER}}
│   ├── {{module}}.controller.ts
│   ├── {{module}}.service.ts
│   ├── {{module}}.repository.ts
│   ├── entities/
│   │   └── {{entity}}.entity.ts
│   └── dto/
│       ├── create-{{entity}}.dto.ts
│       └── {{entity}}-response.dto.ts
{{/if}}
{{#if INTERMEDIATE}}
│   ├── domain/
│   │   ├── entities/
│   │   │   └── {{entity}}.entity.ts
│   │   ├── repositories/
│   │   │   └── {{entity}}.repository.interface.ts
│   │   └── exceptions/
│   │       └── {{entity}}.exceptions.ts
│   ├── application/
│   │   ├── dto/
│   │   │   ├── create-{{entity}}.dto.ts
│   │   │   └── {{entity}}-response.dto.ts
│   │   ├── services/
│   │   │   └── {{entity}}.service.ts
│   │   ├── use-cases/
│   │   │   └── create-{{entity}}.use-case.ts
│   │   └── mappers/
│   │       └── {{entity}}.mapper.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── {{module}}.controller.ts
│       └── persistence/
│           └── {{entity}}.repository.ts
{{/if}}
{{#if ADVANCED}}
│   ├── domain/
│   │   ├── aggregates/
│   │   │   └── {{entity}}.aggregate.ts
│   │   ├── value-objects/
│   │   │   ├── {{entity}}-id.vo.ts
│   │   │   └── {{property}}.vo.ts
│   │   ├── events/
│   │   │   ├── {{entity}}-created.event.ts
│   │   │   └── {{entity}}-updated.event.ts
│   │   ├── repositories/
│   │   │   └── {{entity}}.repository.interface.ts
│   │   └── exceptions/
│   │       └── {{entity}}.exceptions.ts
│   ├── application/
│   │   ├── commands/
│   │   │   ├── create-{{entity}}.command.ts
│   │   │   └── create-{{entity}}.handler.ts
│   │   ├── queries/
│   │   │   ├── get-{{entity}}.query.ts
│   │   │   └── get-{{entity}}.handler.ts
│   │   ├── dto/
│   │   │   └── {{entity}}-response.dto.ts
│   │   ├── mappers/
│   │   │   └── {{entity}}.mapper.ts
│   │   └── services/
│   │       └── {{entity}}.service.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── {{module}}.controller.ts
│       ├── persistence/
│       │   ├── {{entity}}.entity.ts
│       │   └── {{entity}}.repository.ts
│       └── event-handlers/
│           └── {{entity}}-created.handler.ts
{{/if}}
├── common/
│   ├── domain/                      # (Advanced+) Base DDD classes
│   │   ├── aggregate-root.ts
│   │   ├── value-object.ts
│   │   └── domain-event.ts
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   └── exceptions/
├── config/
├── app.module.ts
└── main.ts
```

---

## Design Patterns Required

<!-- Check patterns required for this level -->

### Beginner Level Patterns

- [ ] **Repository Pattern** - Abstract data access behind interfaces
- [ ] **Factory Pattern** - Centralize object creation logic
- [ ] **Singleton Pattern** - Single instance services (NestJS default)
- [ ] **Decorator Pattern** - Cross-cutting concerns (@UseGuards, @UsePipes)

### Intermediate Level Patterns (+ Beginner)

- [ ] **Strategy Pattern** - Interchangeable algorithms (payment providers, validators)
- [ ] **Observer Pattern** - Event-driven communication (EventEmitter)
- [ ] **Adapter Pattern** - Integrate external services
- [ ] **Builder Pattern** - Complex object construction
- [ ] **Facade Pattern** - Simplify complex subsystems
- [ ] **Chain of Responsibility** - Sequential request processing

### Advanced Level Patterns (+ Intermediate)

- [ ] **Mediator Pattern** - CommandBus/QueryBus for CQRS
- [ ] **State Pattern** - Object behavior changes based on state
- [ ] **Template Method** - Algorithm structure with customizable steps
- [ ] **Domain Events** - Decouple domain changes from side effects

### Expert Level Patterns (+ Advanced)

- [ ] **CQRS** - Separate read/write models
- [ ] **Event Sourcing** - Store state as events
- [ ] **Saga Pattern** - Distributed transaction management
- [ ] **Circuit Breaker** - Fault tolerance for external services

---

## Layer Responsibilities

### Presentation Layer

**Purpose:** Handle HTTP requests, validate input, format responses

**Contains:**
- Controllers (route handling)
- DTOs (request/response shapes)
- Pipes (validation, transformation)
- Guards (authentication, authorization)
- Interceptors (logging, response formatting)

**Rules:**
- NO business logic
- NO direct database access
- Validate all input
- Transform responses to DTOs

### Application Layer

**Purpose:** Orchestrate use cases, coordinate domain objects

**Contains:**
- Commands + Handlers (write operations)
- Queries + Handlers (read operations)
- Application Services (orchestration)
- DTOs (data transfer)
- Mappers (entity ↔ DTO conversion)
- Event Handlers (react to domain events)

**Rules:**
- NO HTTP/infrastructure concerns
- Coordinate domain objects
- Publish domain events
- Handle transactions

### Domain Layer

**Purpose:** Core business logic, domain rules, invariants

**Contains:**
- Aggregates (consistency boundaries)
- Entities (identity-based objects)
- Value Objects (immutable, equality by value)
- Domain Events (things that happened)
- Repository Interfaces (data access contracts)
- Domain Services (logic spanning entities)
- Domain Exceptions (business rule violations)

**Rules:**
- NO framework dependencies
- NO infrastructure concerns
- Enforce business invariants
- Rich domain model (behavior + data)

### Infrastructure Layer

**Purpose:** Technical implementations, external services

**Contains:**
- Repository Implementations (TypeORM, Prisma, etc.)
- ORM Entities (database mappings)
- External Service Clients (APIs, message queues)
- Event Publishers
- Configuration

**Rules:**
- Implement domain interfaces
- Handle technical concerns
- NO business logic

---

## CQRS Implementation (Advanced+)

### Commands (Write Operations)

```typescript
// Command definition
export class Create{{Entity}}Command {
  constructor(
    public readonly property1: string,
    public readonly property2: number,
  ) {}
}

// Command handler
@CommandHandler(Create{{Entity}}Command)
export class Create{{Entity}}Handler implements ICommandHandler<Create{{Entity}}Command> {
  constructor(
    @Inject({{ENTITY}}_REPOSITORY)
    private readonly repository: I{{Entity}}Repository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: Create{{Entity}}Command): Promise<{{Entity}}ResponseDto> {
    // 1. Create/load aggregate
    const aggregate = {{Entity}}.create(command);

    // 2. Persist
    await this.repository.save(aggregate);

    // 3. Publish domain events
    this.eventBus.publishAll(aggregate.getUncommittedEvents());

    // 4. Return DTO
    return {{Entity}}Mapper.toDto(aggregate);
  }
}
```

### Queries (Read Operations)

```typescript
// Query definition
export class Get{{Entity}}Query {
  constructor(public readonly id: string) {}
}

// Query handler
@QueryHandler(Get{{Entity}}Query)
export class Get{{Entity}}Handler implements IQueryHandler<Get{{Entity}}Query> {
  constructor(
    @Inject({{ENTITY}}_REPOSITORY)
    private readonly repository: I{{Entity}}Repository,
  ) {}

  async execute(query: Get{{Entity}}Query): Promise<{{Entity}}ResponseDto> {
    const entity = await this.repository.findById(query.id);
    if (!entity) {
      throw ProblemDetailsFactory.notFound('{{Entity}}', query.id);
    }
    return {{Entity}}Mapper.toDto(entity);
  }
}
```

---

## Domain Event Flow (Advanced+)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Aggregate  │────>│  Event Bus  │────>│   Handler   │
│  (creates)  │     │  (routes)   │     │  (reacts)   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       │                                       ▼
       │                              ┌─────────────────┐
       │                              │ Side Effects:   │
       │                              │ - Notifications │
       │                              │ - Cache update  │
       │                              │ - Analytics     │
       └──────────────────────────────│ - Projections   │
                                      └─────────────────┘
```

### Domain Event Example

```typescript
// Event definition
export class {{Entity}}CreatedEvent extends DomainEvent {
  constructor(
    public readonly {{entity}}Id: string,
    public readonly property1: string,
    public readonly occurredAt: Date = new Date(),
  ) {
    super();
  }
}

// Event handler (in another module)
@EventsHandler({{Entity}}CreatedEvent)
export class {{Entity}}CreatedNotificationHandler
  implements IEventHandler<{{Entity}}CreatedEvent> {

  constructor(private readonly notificationService: NotificationService) {}

  async handle(event: {{Entity}}CreatedEvent): Promise<void> {
    await this.notificationService.create({
      type: '{{entity}}_created',
      targetId: event.{{entity}}Id,
      // ...
    });
  }
}
```

---

## Value Objects (Advanced+)

### Implementation Pattern

```typescript
export abstract class ValueObject<T> {
  protected readonly props: T;

  protected constructor(props: T) {
    this.props = Object.freeze(props);
  }

  public equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) return false;
    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }
}

// Concrete value object
export class Email extends ValueObject<{ value: string }> {
  private constructor(props: { value: string }) {
    super(props);
  }

  public static create(email: string): Email {
    if (!this.isValid(email)) {
      throw new InvalidEmailException(email);
    }
    return new Email({ value: email.toLowerCase() });
  }

  private static isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  get value(): string {
    return this.props.value;
  }
}
```

---

## Aggregate Root (Advanced+)

### Implementation Pattern

```typescript
export abstract class AggregateRoot extends NestAggregateRoot {
  private _domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
    this.apply(event);
  }

  public getUncommittedEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }
}

// Concrete aggregate
export class {{Entity}} extends AggregateRoot {
  private _id: {{Entity}}Id;
  private _property: PropertyVO;

  private constructor() {
    super();
  }

  public static create(props: Create{{Entity}}Props): {{Entity}} {
    const entity = new {{Entity}}();
    entity._id = {{Entity}}Id.generate();
    entity._property = PropertyVO.create(props.property);

    entity.addDomainEvent(new {{Entity}}CreatedEvent(
      entity._id.value,
      entity._property.value,
    ));

    return entity;
  }

  // Business methods that enforce invariants
  public updateProperty(newValue: string): void {
    // Validate business rules
    if (!this.canUpdate()) {
      throw new {{Entity}}CannotBeUpdatedException();
    }

    this._property = PropertyVO.create(newValue);
    this.addDomainEvent(new {{Entity}}UpdatedEvent(this._id.value));
  }
}
```

---

## Mapper Pattern (All Levels)

```typescript
export class {{Entity}}Mapper {
  // Domain → DTO
  public static toDto(entity: {{Entity}}): {{Entity}}ResponseDto {
    return {
      id: entity.id.value,
      property: entity.property.value,
      createdAt: entity.createdAt,
    };
  }

  // ORM Entity → Domain (for repositories)
  public static toDomain(ormEntity: {{Entity}}Entity): {{Entity}} {
    return {{Entity}}.reconstitute({
      id: {{Entity}}Id.create(ormEntity.id),
      property: PropertyVO.create(ormEntity.property),
      createdAt: ormEntity.createdAt,
    });
  }

  // Domain → ORM Entity (for repositories)
  public static toPersistence(domain: {{Entity}}): Partial<{{Entity}}Entity> {
    return {
      id: domain.id.value,
      property: domain.property.value,
    };
  }
}
```

---

## Error Handling

### Beginner/Intermediate: Standard Exceptions

```typescript
throw new NotFoundException('User not found');
throw new BadRequestException('Invalid email format');
throw new UnauthorizedException('Invalid credentials');
```

### Advanced+: RFC 7807 Problem Details

```typescript
// Factory usage
throw ProblemDetailsFactory.notFound('User', userId);
throw ProblemDetailsFactory.conflict('Email already registered');
throw ProblemDetailsFactory.forbidden('Cannot delete other user posts');
throw ProblemDetailsFactory.validationError(validationErrors);

// Response format
{
  "type": "https://api.example.com/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "User with ID 'abc-123' not found.",
  "instance": "GET /api/v1/users/abc-123",
  "timestamp": "2026-01-11T12:00:00Z",
  "traceId": "req-xyz-789"
}
```

---

## Module Wiring (Advanced+)

```typescript
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([{{Entity}}Entity]),
  ],
  controllers: [{{Entity}}Controller],
  providers: [
    // Repository
    {
      provide: {{ENTITY}}_REPOSITORY,
      useClass: {{Entity}}Repository,
    },
    // Command Handlers
    Create{{Entity}}Handler,
    Update{{Entity}}Handler,
    Delete{{Entity}}Handler,
    // Query Handlers
    Get{{Entity}}Handler,
    List{{Entity}}Handler,
    // Event Handlers
    {{Entity}}CreatedNotificationHandler,
    // Application Services
    {{Entity}}Service,
  ],
  exports: [{{ENTITY}}_REPOSITORY],
})
export class {{Entity}}Module {}
```

---

## Architecture Checklist

### {{LEVEL}} Level Requirements

<!-- Customize based on level -->

#### Domain Layer
- [ ] Repository interfaces defined
- [ ] Domain exceptions created
{{#if INTERMEDIATE+}}
- [ ] Domain entities with behavior
{{/if}}
{{#if ADVANCED+}}
- [ ] Aggregate roots implemented
- [ ] Value objects for domain concepts
- [ ] Domain events defined
{{/if}}

#### Application Layer
{{#if BEGINNER}}
- [ ] Services with business logic
- [ ] DTOs for all endpoints
{{/if}}
{{#if INTERMEDIATE}}
- [ ] Use cases for operations
- [ ] DTOs for all endpoints
- [ ] Mappers for entity ↔ DTO
{{/if}}
{{#if ADVANCED+}}
- [ ] Commands for write operations
- [ ] Queries for read operations
- [ ] Event handlers for side effects
- [ ] Mappers for all conversions
- [ ] Application services for orchestration
{{/if}}

#### Infrastructure Layer
- [ ] Repository implementations
- [ ] Controllers with proper routing
{{#if ADVANCED+}}
- [ ] Domain event publishers
- [ ] ORM entities separate from domain
{{/if}}

#### Cross-Cutting
- [ ] Authentication/Authorization
- [ ] Validation (DTOs)
- [ ] Error handling ({{#if ADVANCED+}}RFC 7807{{else}}Standard{{/if}})
- [ ] Response formatting
- [ ] Logging

#### Testing
- [ ] Unit tests (80%+ coverage)
{{#if INTERMEDIATE+}}
- [ ] Integration tests
{{/if}}
{{#if ADVANCED+}}
- [ ] E2E tests
{{/if}}

---

## Quick Reference

**Where does code go?**

| Concern | Beginner | Intermediate | Advanced+ |
|---------|----------|--------------|-----------|
| HTTP handling | `controller.ts` | `infrastructure/controllers/` | `infrastructure/controllers/` |
| Business logic | `service.ts` | `application/use-cases/` | `domain/aggregates/` + `application/commands/` |
| Data contracts | `dto/` | `application/dto/` | `application/dto/` |
| Data access | `repository.ts` | `infrastructure/persistence/` | `infrastructure/persistence/` |
| Entities | `entities/` | `domain/entities/` | `domain/aggregates/` + `domain/value-objects/` |
| Events | N/A | EventEmitter | `domain/events/` + `application/event-handlers/` |

---

**Last updated:** {{DATE}}
