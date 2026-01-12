# ARCHITECTURE.md - Admin Dashboard API Architecture Guide

## Project Architecture Overview

**Project:** Admin Dashboard API
**Level:** Advanced
**Architecture Style:** Modular DDD + CQRS (5-Layer)

---

## Layer Structure

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

**Request Flow (Command - Write Operations):**
```
HTTP Request → Controller → CommandBus → CommandHandler → Aggregate → Repository → Database
                                              ↓
                                        Domain Event → EventBus → Event Handlers (Audit)
```

**Request Flow (Query - Read Operations):**
```
HTTP Request → Controller → QueryBus → QueryHandler → Repository → Database
```

---

## Folder Structure

### Advanced Level Structure

```
src/
├── auth/                            # Auth feature module
│   ├── auth.module.ts
│   ├── domain/
│   │   ├── value-objects/
│   │   │   └── role.vo.ts
│   │   └── exceptions/
│   │       └── auth.exceptions.ts
│   ├── application/
│   │   ├── commands/
│   │   │   ├── login.command.ts
│   │   │   └── login.handler.ts
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   └── auth-response.dto.ts
│   │   └── services/
│   │       └── auth.service.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── auth.controller.ts
│       ├── guards/
│       │   ├── jwt-auth.guard.ts
│       │   └── roles.guard.ts
│       └── strategies/
│           └── jwt.strategy.ts
│
├── users/                           # Users feature module with DDD
│   ├── users.module.ts
│   ├── domain/
│   │   ├── aggregates/
│   │   │   └── user.aggregate.ts
│   │   ├── value-objects/
│   │   │   ├── user-id.vo.ts
│   │   │   ├── email.vo.ts
│   │   │   └── role.vo.ts
│   │   ├── events/
│   │   │   ├── user-created.event.ts
│   │   │   ├── user-role-changed.event.ts
│   │   │   └── user-deactivated.event.ts
│   │   ├── repositories/
│   │   │   └── user.repository.interface.ts
│   │   └── exceptions/
│   │       └── user.exceptions.ts
│   ├── application/
│   │   ├── commands/
│   │   │   ├── create-user.command.ts
│   │   │   ├── create-user.handler.ts
│   │   │   ├── change-user-role.command.ts
│   │   │   ├── change-user-role.handler.ts
│   │   │   ├── deactivate-user.command.ts
│   │   │   └── deactivate-user.handler.ts
│   │   ├── queries/
│   │   │   ├── get-user.query.ts
│   │   │   ├── get-user.handler.ts
│   │   │   ├── list-users.query.ts
│   │   │   └── list-users.handler.ts
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   ├── update-user-role.dto.ts
│   │   │   └── user-response.dto.ts
│   │   ├── mappers/
│   │   │   └── user.mapper.ts
│   │   └── event-handlers/
│   │       └── user-events.handler.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── admin-users.controller.ts
│       └── persistence/
│           ├── user.entity.ts
│           └── user.repository.ts
│
├── content/                         # Content feature module with DDD
│   ├── content.module.ts
│   ├── domain/
│   │   ├── aggregates/
│   │   │   └── content.aggregate.ts
│   │   ├── value-objects/
│   │   │   ├── content-id.vo.ts
│   │   │   └── content-status.vo.ts
│   │   ├── events/
│   │   │   ├── content-approved.event.ts
│   │   │   └── content-rejected.event.ts
│   │   ├── repositories/
│   │   │   └── content.repository.interface.ts
│   │   └── exceptions/
│   │       └── content.exceptions.ts
│   ├── application/
│   │   ├── commands/
│   │   │   ├── approve-content.command.ts
│   │   │   ├── approve-content.handler.ts
│   │   │   ├── reject-content.command.ts
│   │   │   └── reject-content.handler.ts
│   │   ├── queries/
│   │   │   ├── get-content.query.ts
│   │   │   ├── get-content.handler.ts
│   │   │   ├── list-pending-content.query.ts
│   │   │   └── list-pending-content.handler.ts
│   │   ├── dto/
│   │   │   ├── moderate-content.dto.ts
│   │   │   └── content-response.dto.ts
│   │   ├── mappers/
│   │   │   └── content.mapper.ts
│   │   └── event-handlers/
│   │       └── content-events.handler.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── admin-content.controller.ts
│       └── persistence/
│           ├── content.entity.ts
│           └── content.repository.ts
│
├── audit/                           # Audit logging module
│   ├── audit.module.ts
│   ├── domain/
│   │   ├── entities/
│   │   │   └── audit-log.entity.ts
│   │   ├── value-objects/
│   │   │   └── audit-action.vo.ts
│   │   └── repositories/
│   │       └── audit-log.repository.interface.ts
│   ├── application/
│   │   ├── commands/
│   │   │   ├── create-audit-log.command.ts
│   │   │   └── create-audit-log.handler.ts
│   │   ├── queries/
│   │   │   ├── list-audit-logs.query.ts
│   │   │   └── list-audit-logs.handler.ts
│   │   ├── dto/
│   │   │   └── audit-log-response.dto.ts
│   │   ├── mappers/
│   │   │   └── audit-log.mapper.ts
│   │   └── services/
│   │       └── audit.service.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── admin-audit.controller.ts
│       ├── persistence/
│       │   ├── audit-log.entity.ts
│       │   └── audit-log.repository.ts
│       └── interceptors/
│           └── audit.interceptor.ts
│
├── dashboard/                       # Dashboard & analytics module
│   ├── dashboard.module.ts
│   ├── application/
│   │   ├── queries/
│   │   │   ├── get-dashboard-stats.query.ts
│   │   │   ├── get-dashboard-stats.handler.ts
│   │   │   ├── get-reports.query.ts
│   │   │   └── get-reports.handler.ts
│   │   ├── dto/
│   │   │   ├── dashboard-stats.dto.ts
│   │   │   └── report-response.dto.ts
│   │   └── services/
│   │       └── analytics.service.ts
│   └── infrastructure/
│       └── controllers/
│           └── admin-dashboard.controller.ts
│
├── common/
│   ├── domain/                      # Base DDD classes
│   │   ├── aggregate-root.ts
│   │   ├── value-object.ts
│   │   └── domain-event.ts
│   ├── decorators/
│   │   ├── roles.decorator.ts
│   │   └── current-user.decorator.ts
│   ├── filters/
│   │   └── problem-details.filter.ts
│   ├── guards/
│   ├── interceptors/
│   │   └── response.interceptor.ts
│   ├── pipes/
│   └── exceptions/
│       ├── problem-details.exception.ts
│       └── problem-details.factory.ts
│
├── config/
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── app.config.ts
│
├── app.module.ts
└── main.ts
```

---

## Design Patterns Required

### Beginner Level Patterns (Must Implement)

- [x] **Repository Pattern** - Abstract data access behind interfaces
- [x] **Factory Pattern** - Centralize object creation logic (DTOs, entities)
- [x] **Singleton Pattern** - Single instance services (NestJS default)
- [x] **Decorator Pattern** - Cross-cutting concerns (@UseGuards, @Roles)

### Intermediate Level Patterns (Must Implement)

- [x] **Strategy Pattern** - Report generation (JSON, CSV formats)
- [x] **Observer Pattern** - Domain events for audit logging
- [x] **Adapter Pattern** - External service integration
- [ ] **Builder Pattern** - Complex object construction (optional)
- [ ] **Facade Pattern** - Simplify complex subsystems (optional)
- [ ] **Chain of Responsibility** - Request processing (optional)

### Advanced Level Patterns (Must Implement)

- [x] **Mediator Pattern** - CommandBus/QueryBus for CQRS
- [x] **State Pattern** - Content moderation status transitions
- [ ] **Template Method** - Algorithm structure (optional)
- [x] **Domain Events** - Decouple domain changes from side effects
- [x] **Value Objects** - Immutable domain concepts
- [x] **Aggregate Roots** - Consistency boundaries

---

## Layer Responsibilities

### Presentation Layer

**Purpose:** Handle HTTP requests, validate input, format responses

**Contains:**
- Controllers (route handling)
- DTOs (request/response shapes - validation happens here via pipes)
- Pipes (validation, transformation)
- Guards (authentication, authorization)
- Interceptors (logging, response formatting)

**Rules:**
- NO business logic
- NO direct database access
- Validate all input with class-validator
- Transform responses to DTOs
- Apply authentication/authorization guards

### Application Layer

**Purpose:** Orchestrate use cases, coordinate domain objects

**Contains:**
- Commands + Handlers (write operations)
- Queries + Handlers (read operations)
- Application Services (orchestration, cross-cutting)
- DTOs (data transfer)
- Mappers (entity ↔ DTO conversion)
- Event Handlers (react to domain events)

**Rules:**
- NO HTTP/infrastructure concerns
- Coordinate domain objects
- Publish domain events
- Handle transactions
- Map between domain and presentation

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
- NO framework dependencies (except base classes)
- NO infrastructure concerns
- Enforce business invariants
- Rich domain model (behavior + data)
- Pure TypeScript (no NestJS decorators)

### Infrastructure Layer

**Purpose:** Technical implementations, external services

**Contains:**
- Repository Implementations (TypeORM)
- ORM Entities (database mappings)
- External Service Clients (APIs, message queues)
- Event Publishers
- Configuration

**Rules:**
- Implement domain interfaces
- Handle technical concerns
- NO business logic
- Depend on domain, not the other way around

---

## CQRS Implementation

### Commands (Write Operations)

```typescript
// Command definition
export class ChangeUserRoleCommand {
  constructor(
    public readonly userId: string,
    public readonly newRole: string,
    public readonly performedBy: string,
  ) {}
}

// Command handler
@CommandHandler(ChangeUserRoleCommand)
export class ChangeUserRoleHandler implements ICommandHandler<ChangeUserRoleCommand> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ChangeUserRoleCommand): Promise<UserResponseDto> {
    // 1. Load aggregate
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw ProblemDetailsFactory.notFound('User', command.userId);
    }

    // 2. Execute domain logic (validates invariants)
    user.changeRole(Role.create(command.newRole), command.performedBy);

    // 3. Persist
    await this.userRepository.save(user);

    // 4. Publish domain events
    this.eventBus.publishAll(user.getUncommittedEvents());

    // 5. Return DTO
    return UserMapper.toDto(user);
  }
}
```

### Queries (Read Operations)

```typescript
// Query definition
export class ListUsersQuery {
  constructor(
    public readonly page: number,
    public readonly limit: number,
    public readonly roleFilter?: string,
    public readonly statusFilter?: string,
    public readonly search?: string,
  ) {}
}

// Query handler
@QueryHandler(ListUsersQuery)
export class ListUsersHandler implements IQueryHandler<ListUsersQuery> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(query: ListUsersQuery): Promise<PaginatedResult<UserResponseDto>> {
    const { users, total } = await this.userRepository.findPaginated({
      page: query.page,
      limit: query.limit,
      role: query.roleFilter,
      status: query.statusFilter,
      search: query.search,
    });

    return {
      data: users.map(UserMapper.toDto),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    };
  }
}
```

---

## Domain Event Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Aggregate  │────>│  Event Bus  │────>│   Handler   │
│  (creates)  │     │  (routes)   │     │  (reacts)   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       │                                       ▼
       │                              ┌─────────────────┐
       │                              │ Side Effects:   │
       │                              │ - Audit logging │
       │                              │ - Notifications │
       │                              │ - Analytics     │
       └──────────────────────────────│ - Projections   │
                                      └─────────────────┘
```

### Domain Event Example

```typescript
// Event definition
export class UserRoleChangedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly previousRole: string,
    public readonly newRole: string,
    public readonly changedBy: string,
    public readonly occurredAt: Date = new Date(),
  ) {
    super();
  }
}

// Event handler (audit logging)
@EventsHandler(UserRoleChangedEvent)
export class UserRoleChangedAuditHandler implements IEventHandler<UserRoleChangedEvent> {
  constructor(private readonly auditService: AuditService) {}

  async handle(event: UserRoleChangedEvent): Promise<void> {
    await this.auditService.log({
      action: 'user.role_changed',
      entityType: 'User',
      entityId: event.userId,
      performedBy: event.changedBy,
      previousValue: { role: event.previousRole },
      newValue: { role: event.newRole },
      timestamp: event.occurredAt,
    });
  }
}
```

---

## Value Objects

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

// Concrete value object: Role
export class Role extends ValueObject<{ value: RoleType }> {
  private static readonly HIERARCHY: Record<RoleType, number> = {
    super_admin: 4,
    admin: 3,
    manager: 2,
    support: 1,
  };

  private constructor(props: { value: RoleType }) {
    super(props);
  }

  public static create(role: string): Role {
    if (!this.isValid(role)) {
      throw new InvalidRoleException(role);
    }
    return new Role({ value: role as RoleType });
  }

  private static isValid(role: string): boolean {
    return ['super_admin', 'admin', 'manager', 'support'].includes(role);
  }

  public canManage(other: Role): boolean {
    return Role.HIERARCHY[this.value] > Role.HIERARCHY[other.value];
  }

  get value(): RoleType {
    return this.props.value;
  }
}
```

---

## Aggregate Root

### Implementation Pattern

```typescript
export abstract class AggregateRoot {
  private _domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  public getUncommittedEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }
}

// User Aggregate
export class User extends AggregateRoot {
  private _id: UserId;
  private _email: Email;
  private _name: string;
  private _role: Role;
  private _status: UserStatus;

  private constructor() {
    super();
  }

  public static create(props: CreateUserProps): User {
    const user = new User();
    user._id = UserId.generate();
    user._email = Email.create(props.email);
    user._name = props.name;
    user._role = Role.create(props.role);
    user._status = UserStatus.Active;

    user.addDomainEvent(new UserCreatedEvent(
      user._id.value,
      user._email.value,
      user._role.value,
    ));

    return user;
  }

  public changeRole(newRole: Role, changedBy: string): void {
    // Business rule: cannot demote super_admin
    if (this._role.value === 'super_admin') {
      throw new CannotModifySuperAdminException();
    }

    const previousRole = this._role.value;
    this._role = newRole;

    this.addDomainEvent(new UserRoleChangedEvent(
      this._id.value,
      previousRole,
      newRole.value,
      changedBy,
    ));
  }

  public deactivate(deactivatedBy: string): void {
    if (this._role.value === 'super_admin') {
      throw new CannotDeactivateSuperAdminException();
    }

    this._status = UserStatus.Inactive;

    this.addDomainEvent(new UserDeactivatedEvent(
      this._id.value,
      deactivatedBy,
    ));
  }

  // Getters
  get id(): UserId { return this._id; }
  get email(): Email { return this._email; }
  get role(): Role { return this._role; }
  get status(): UserStatus { return this._status; }
}
```

---

## State Pattern for Content Moderation

```typescript
// Content Status with allowed transitions
export class ContentStatus extends ValueObject<{ value: ContentStatusType }> {
  private static readonly TRANSITIONS: Record<ContentStatusType, ContentStatusType[]> = {
    pending: ['approved', 'rejected'],
    approved: [], // Cannot transition from approved
    rejected: ['pending'], // Can be resubmitted
  };

  public canTransitionTo(newStatus: ContentStatusType): boolean {
    return ContentStatus.TRANSITIONS[this.value].includes(newStatus);
  }
}

// Content Aggregate with state transitions
export class Content extends AggregateRoot {
  private _status: ContentStatus;

  public approve(moderatorId: string): void {
    if (!this._status.canTransitionTo('approved')) {
      throw new InvalidContentStateTransitionException(this._status.value, 'approved');
    }

    this._status = ContentStatus.create('approved');
    this._moderatedBy = moderatorId;
    this._moderatedAt = new Date();

    this.addDomainEvent(new ContentApprovedEvent(this._id.value, moderatorId));
  }

  public reject(moderatorId: string, reason: string): void {
    if (!this._status.canTransitionTo('rejected')) {
      throw new InvalidContentStateTransitionException(this._status.value, 'rejected');
    }

    this._status = ContentStatus.create('rejected');
    this._moderatedBy = moderatorId;
    this._moderatedAt = new Date();
    this._rejectionReason = reason;

    this.addDomainEvent(new ContentRejectedEvent(this._id.value, moderatorId, reason));
  }
}
```

---

## Mapper Pattern

```typescript
export class UserMapper {
  // Domain → DTO
  public static toDto(user: User): UserResponseDto {
    return {
      id: user.id.value,
      email: user.email.value,
      name: user.name,
      role: user.role.value,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }

  // ORM Entity → Domain
  public static toDomain(entity: UserEntity): User {
    return User.reconstitute({
      id: UserId.create(entity.id),
      email: Email.create(entity.email),
      name: entity.name,
      role: Role.create(entity.role),
      status: entity.status as UserStatus,
      lastLoginAt: entity.lastLoginAt,
      createdAt: entity.createdAt,
    });
  }

  // Domain → ORM Entity
  public static toPersistence(user: User): Partial<UserEntity> {
    return {
      id: user.id.value,
      email: user.email.value,
      name: user.name,
      role: user.role.value,
      status: user.status,
    };
  }
}
```

---

## Error Handling (RFC 7807)

### Problem Details Implementation

```typescript
// Factory usage
throw ProblemDetailsFactory.notFound('User', userId);
throw ProblemDetailsFactory.forbidden('Cannot modify super_admin user');
throw ProblemDetailsFactory.conflict('Email already registered');
throw ProblemDetailsFactory.validationError(validationErrors);

// Response format
{
  "type": "https://api.example.com/errors/forbidden",
  "title": "Forbidden",
  "status": 403,
  "detail": "Cannot modify role of a super_admin user",
  "instance": "PATCH /api/v1/admin/users/abc-123/role",
  "timestamp": "2026-01-12T12:00:00Z",
  "traceId": "req-xyz-789"
}
```

---

## Module Wiring

```typescript
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([UserEntity]),
    AuditModule, // For audit logging
  ],
  controllers: [AdminUsersController],
  providers: [
    // Repository
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    // Command Handlers
    CreateUserHandler,
    ChangeUserRoleHandler,
    DeactivateUserHandler,
    // Query Handlers
    GetUserHandler,
    ListUsersHandler,
    // Event Handlers
    UserCreatedAuditHandler,
    UserRoleChangedAuditHandler,
    UserDeactivatedAuditHandler,
  ],
  exports: [USER_REPOSITORY],
})
export class UsersModule {}
```

---

## Architecture Checklist

### Advanced Level Requirements

#### Domain Layer
- [ ] Aggregate roots implemented (User, Content)
- [ ] Value objects for domain concepts (UserId, Email, Role, ContentStatus)
- [ ] Domain events defined (UserCreated, UserRoleChanged, ContentApproved, etc.)
- [ ] Repository interfaces defined
- [ ] Domain exceptions created

#### Application Layer
- [ ] Commands for write operations (CreateUser, ChangeUserRole, ApproveContent, etc.)
- [ ] Queries for read operations (GetUser, ListUsers, ListPendingContent, etc.)
- [ ] Event handlers for audit logging
- [ ] Mappers for all conversions (Domain ↔ DTO ↔ ORM Entity)
- [ ] Application services for cross-cutting concerns

#### Infrastructure Layer
- [ ] Repository implementations with TypeORM
- [ ] Controllers with proper routing
- [ ] ORM entities separate from domain aggregates
- [ ] Guards for authentication/authorization

#### Cross-Cutting
- [ ] Authentication (JWT)
- [ ] Authorization (RBAC with role hierarchy)
- [ ] Validation (DTOs with class-validator)
- [ ] Error handling (RFC 7807 Problem Details)
- [ ] Response formatting (envelope with success, data, pagination)
- [ ] Audit logging (automatic via domain events)

#### Testing
- [ ] Unit tests for aggregates (80%+ coverage)
- [ ] Unit tests for command handlers
- [ ] Unit tests for query handlers
- [ ] Integration tests for repositories
- [ ] E2E tests for all endpoints

---

## Quick Reference

**Where does code go? (Advanced Level)**

| Concern | Location |
|---------|----------|
| HTTP handling | `infrastructure/controllers/` |
| Business logic | `domain/aggregates/` + `application/commands/` |
| Data contracts | `application/dto/` |
| Data access | `infrastructure/persistence/` |
| Entities | `domain/aggregates/` + `domain/value-objects/` |
| Events | `domain/events/` + `application/event-handlers/` |
| Base classes | `common/domain/` |
| Error handling | `common/exceptions/` + `common/filters/` |

---

**Last updated:** 2026-01-12
