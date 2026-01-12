# ARCHITECTURE.md - Notification System Architecture Guide

---

## Project Architecture Overview

**Project:** Real-time Notification System
**Level:** Advanced
**Architecture Style:** Modular DDD + CQRS

---

## Layer Structure

### Advanced: 5-Layer DDD + CQRS

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│  (Controllers, Gateways, Pipes, Guards) │
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
│   Channel Adapters, ORM Entities)       │
├─────────────────────────────────────────┤
│           Shared/Common Layer           │
│  (Base Classes, Utilities, Exceptions)  │
└─────────────────────────────────────────┘
```

**Request Flow (Command - Create Notification):**
```
HTTP Request → Controller → CommandBus → CreateNotificationHandler
                                              ↓
                                    Notification.create()
                                              ↓
                                    Repository.save()
                                              ↓
                               NotificationCreatedEvent
                                              ↓
                         EventBus → NotificationCreatedHandler
                                              ↓
                         ChannelFactory → [EmailChannel, WebSocketChannel, ...]
```

**Request Flow (Query - Get Notifications):**
```
HTTP Request → Controller → QueryBus → GetNotificationsHandler → Repository → Database
                                              ↓
                                    NotificationMapper.toDto()
                                              ↓
                                    Response (NotificationResponseDto[])
```

**WebSocket Flow:**
```
WS Connection → Gateway → JwtGuard → subscribe event
                              ↓
                     Redis PubSub (for scaling)
                              ↓
              NotificationCreatedEvent → broadcast to user
```

---

## Folder Structure

### Advanced Level Structure (DDD + CQRS)

```
src/
├── notifications/                      # Main notification module
│   ├── notifications.module.ts
│   ├── domain/
│   │   ├── aggregates/
│   │   │   └── notification.aggregate.ts
│   │   ├── value-objects/
│   │   │   ├── notification-id.vo.ts
│   │   │   ├── notification-type.vo.ts
│   │   │   └── notification-channel.vo.ts
│   │   ├── events/
│   │   │   ├── notification-created.event.ts
│   │   │   ├── notification-sent.event.ts
│   │   │   └── notification-read.event.ts
│   │   ├── repositories/
│   │   │   └── notification.repository.interface.ts
│   │   └── exceptions/
│   │       └── notification.exceptions.ts
│   ├── application/
│   │   ├── commands/
│   │   │   ├── create-notification.command.ts
│   │   │   ├── create-notification.handler.ts
│   │   │   ├── mark-as-read.command.ts
│   │   │   └── mark-as-read.handler.ts
│   │   ├── queries/
│   │   │   ├── get-notifications.query.ts
│   │   │   ├── get-notifications.handler.ts
│   │   │   ├── get-unread-count.query.ts
│   │   │   └── get-unread-count.handler.ts
│   │   ├── dto/
│   │   │   ├── create-notification.dto.ts
│   │   │   ├── notification-response.dto.ts
│   │   │   └── notification-filter.dto.ts
│   │   ├── event-handlers/
│   │   │   └── notification-created.handler.ts
│   │   └── mappers/
│   │       └── notification.mapper.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── notifications.controller.ts
│       ├── persistence/
│       │   ├── drizzle/
│       │   │   └── schema.ts
│       │   └── notification.repository.ts
│       └── gateways/
│           └── notifications.gateway.ts
│
├── preferences/                        # User preferences module
│   ├── preferences.module.ts
│   ├── domain/
│   │   ├── entities/
│   │   │   └── notification-preference.entity.ts
│   │   └── repositories/
│   │       └── preference.repository.interface.ts
│   ├── application/
│   │   ├── commands/
│   │   │   └── update-preferences.handler.ts
│   │   ├── queries/
│   │   │   └── get-preferences.handler.ts
│   │   └── dto/
│   │       └── preference-response.dto.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── preferences.controller.ts
│       └── persistence/
│           └── preference.repository.ts
│
├── channels/                           # Notification delivery channels
│   ├── channels.module.ts
│   ├── domain/
│   │   ├── channel.strategy.interface.ts
│   │   └── channel.factory.ts
│   └── infrastructure/
│       ├── base.channel.ts             # Template method
│       ├── email/
│       │   └── sendgrid.channel.ts
│       ├── websocket/
│       │   └── websocket.channel.ts
│       ├── sms/
│       │   └── twilio.channel.ts
│       └── push/
│           └── fcm.channel.ts
│
├── common/
│   ├── domain/
│   │   ├── aggregate-root.ts
│   │   ├── value-object.ts
│   │   └── domain-event.ts
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   ├── filters/
│   │   └── problem-details.filter.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── ws-jwt.guard.ts
│   ├── interceptors/
│   │   └── response.interceptor.ts
│   └── exceptions/
│       └── problem-details.factory.ts
│
├── config/
│   ├── database.config.ts
│   ├── redis.config.ts
│   ├── jwt.config.ts
│   └── channels.config.ts
│
├── drizzle/
│   └── schema.ts
│
├── app.module.ts
└── main.ts
```

---

## Design Patterns Required

### Beginner Level Patterns (Must Implement)

- [x] **Repository Pattern** - Abstract data access behind interfaces
- [x] **Factory Pattern** - Centralize object creation (Notification.create(), ChannelFactory)
- [x] **Singleton Pattern** - Single instance services (NestJS default)
- [x] **Decorator Pattern** - Cross-cutting concerns (@UseGuards, @CurrentUser)

### Intermediate Level Patterns (Must Implement)

- [x] **Strategy Pattern** - Interchangeable notification channels (Email, SMS, Push, WebSocket)
- [x] **Observer Pattern** - Domain events, WebSocket subscriptions
- [x] **Adapter Pattern** - External services (SendGrid, Twilio, FCM)
- [x] **Template Method** - Base channel with customizable delivery steps
- [x] **Facade Pattern** - NotificationService orchestrating multiple concerns

### Advanced Level Patterns (Must Implement)

- [x] **Mediator Pattern** - CQRS with CommandBus/QueryBus
- [x] **Domain Events** - Decouple notification creation from delivery
- [x] **Value Objects** - NotificationId, NotificationType, NotificationChannel
- [x] **Aggregate Root** - Notification with encapsulated business rules

---

## Layer Responsibilities

### Presentation Layer

**Purpose:** Handle HTTP requests, WebSocket events, validate input, format responses

**Contains:**
- Controllers (REST endpoints)
- Gateways (WebSocket)
- DTOs (request/response shapes - for validation only)
- Pipes (validation, transformation)
- Guards (authentication, authorization)
- Interceptors (logging, response formatting)

**Rules:**
- NO business logic
- NO direct database access
- Validate all input
- Use CommandBus/QueryBus for operations
- Transform responses to DTOs

### Application Layer

**Purpose:** Orchestrate use cases, coordinate domain objects, handle cross-cutting concerns

**Contains:**
- Commands + Handlers (write operations)
- Queries + Handlers (read operations)
- Application Services (orchestration if needed)
- DTOs (data transfer)
- Mappers (entity <-> DTO conversion)
- Event Handlers (react to domain events)

**Rules:**
- NO HTTP/infrastructure concerns
- Coordinate domain objects
- Publish/handle domain events
- Handle transactions
- Use repository interfaces (not implementations)

### Domain Layer

**Purpose:** Core business logic, domain rules, invariants

**Contains:**
- Aggregates (consistency boundaries)
- Entities (identity-based objects)
- Value Objects (immutable, equality by value)
- Domain Events (things that happened)
- Repository Interfaces (data access contracts)
- Domain Exceptions (business rule violations)

**Rules:**
- NO framework dependencies
- NO infrastructure concerns
- Enforce business invariants
- Rich domain model (behavior + data)
- Raise domain events for state changes

### Infrastructure Layer

**Purpose:** Technical implementations, external services

**Contains:**
- Repository Implementations (Drizzle)
- Drizzle Schema (database mappings)
- External Service Clients (SendGrid, Twilio, FCM)
- Channel Implementations
- Event Publishers (WebSocket, Redis)
- Configuration

**Rules:**
- Implement domain interfaces
- Handle technical concerns
- NO business logic
- Map between domain and persistence models

---

## CQRS Implementation

### Commands (Write Operations)

```typescript
// Command definition
export class CreateNotificationCommand {
  constructor(
    public readonly userId: string,
    public readonly type: NotificationType,
    public readonly title: string,
    public readonly message: string,
    public readonly data?: Record<string, any>,
  ) {}
}

// Command handler
@CommandHandler(CreateNotificationCommand)
export class CreateNotificationHandler
  implements ICommandHandler<CreateNotificationCommand> {

  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly repository: INotificationRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateNotificationCommand): Promise<NotificationResponseDto> {
    // 1. Create aggregate (domain logic)
    const notification = Notification.create({
      userId: command.userId,
      type: NotificationType.create(command.type),
      title: command.title,
      message: command.message,
      data: command.data,
    });

    // 2. Persist
    await this.repository.save(notification);

    // 3. Publish domain events
    this.eventBus.publishAll(notification.getUncommittedEvents());

    // 4. Return DTO
    return NotificationMapper.toDto(notification);
  }
}
```

### Queries (Read Operations)

```typescript
// Query definition
export class GetNotificationsQuery {
  constructor(
    public readonly userId: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly read?: boolean,
    public readonly type?: string,
  ) {}
}

// Query handler
@QueryHandler(GetNotificationsQuery)
export class GetNotificationsHandler
  implements IQueryHandler<GetNotificationsQuery> {

  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly repository: INotificationRepository,
  ) {}

  async execute(query: GetNotificationsQuery): Promise<PaginatedResult<NotificationResponseDto>> {
    const { notifications, total } = await this.repository.findByUserId(
      query.userId,
      {
        page: query.page,
        limit: query.limit,
        read: query.read,
        type: query.type,
      },
    );

    return {
      data: notifications.map(NotificationMapper.toDto),
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
┌─────────────────┐     ┌─────────────┐     ┌─────────────────────┐
│   Notification  │────>│  Event Bus  │────>│ NotificationCreated │
│   Aggregate     │     │  (routes)   │     │      Handler        │
│  (creates event)│     └─────────────┘     └─────────────────────┘
└─────────────────┘                                   │
                                                      ▼
                                        ┌─────────────────────────┐
                                        │    Channel Factory      │
                                        │  (Strategy Pattern)     │
                                        └─────────────────────────┘
                                                      │
                      ┌───────────────┬───────────────┼───────────────┐
                      ▼               ▼               ▼               ▼
               ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
               │  Email    │   │ WebSocket │   │   Push    │   │   SMS     │
               │  Channel  │   │  Channel  │   │  Channel  │   │  Channel  │
               └───────────┘   └───────────┘   └───────────┘   └───────────┘
                      │               │               │               │
                      ▼               ▼               ▼               ▼
               [SendGrid]      [Socket.io]       [FCM]         [Twilio]
```

### Domain Event Example

```typescript
// Event definition
export class NotificationCreatedEvent extends DomainEvent {
  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
    public readonly type: string,
    public readonly title: string,
    public readonly message: string,
    public readonly data?: Record<string, any>,
  ) {
    super();
  }
}

// Event handler (triggers delivery)
@EventsHandler(NotificationCreatedEvent)
export class NotificationCreatedHandler
  implements IEventHandler<NotificationCreatedEvent> {

  constructor(
    private readonly channelFactory: ChannelFactory,
    private readonly preferenceRepository: IPreferenceRepository,
  ) {}

  async handle(event: NotificationCreatedEvent): Promise<void> {
    // 1. Get user preferences
    const preferences = await this.preferenceRepository.findByUserId(event.userId);

    // 2. Determine channels based on notification type and preferences
    const channels = this.channelFactory.getChannelsForType(
      event.type,
      preferences,
    );

    // 3. Send via each channel (Strategy Pattern)
    await Promise.allSettled(
      channels.map(channel => channel.send(event)),
    );
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

// NotificationType Value Object
export class NotificationType extends ValueObject<{ value: string }> {
  private static readonly VALID_TYPES = [
    'order_completed',
    'new_comment',
    'new_follower',
    'liked_post',
    'mention',
  ] as const;

  private constructor(props: { value: string }) {
    super(props);
  }

  public static create(type: string): NotificationType {
    if (!this.VALID_TYPES.includes(type as any)) {
      throw new InvalidNotificationTypeException(type);
    }
    return new NotificationType({ value: type });
  }

  get value(): string {
    return this.props.value;
  }

  public isHighPriority(): boolean {
    return ['order_completed', 'mention'].includes(this.value);
  }
}
```

---

## Aggregate Root

### Notification Aggregate

```typescript
export class Notification extends AggregateRoot {
  private _id: NotificationId;
  private _userId: string;
  private _type: NotificationType;
  private _title: string;
  private _message: string;
  private _data: Record<string, any>;
  private _read: boolean;
  private _readAt: Date | null;
  private _createdAt: Date;

  private constructor() {
    super();
  }

  public static create(props: CreateNotificationProps): Notification {
    const notification = new Notification();
    notification._id = NotificationId.generate();
    notification._userId = props.userId;
    notification._type = props.type;
    notification._title = props.title;
    notification._message = props.message;
    notification._data = props.data || {};
    notification._read = false;
    notification._readAt = null;
    notification._createdAt = new Date();

    notification.addDomainEvent(new NotificationCreatedEvent(
      notification._id.value,
      notification._userId,
      notification._type.value,
      notification._title,
      notification._message,
      notification._data,
    ));

    return notification;
  }

  public static reconstitute(props: ReconstitutedNotificationProps): Notification {
    const notification = new Notification();
    notification._id = props.id;
    notification._userId = props.userId;
    notification._type = props.type;
    notification._title = props.title;
    notification._message = props.message;
    notification._data = props.data;
    notification._read = props.read;
    notification._readAt = props.readAt;
    notification._createdAt = props.createdAt;
    return notification;
  }

  public markAsRead(): void {
    if (this._read) {
      return; // Already read, no-op
    }

    this._read = true;
    this._readAt = new Date();

    this.addDomainEvent(new NotificationReadEvent(
      this._id.value,
      this._userId,
      this._readAt,
    ));
  }

  // Getters
  get id(): NotificationId { return this._id; }
  get userId(): string { return this._userId; }
  get type(): NotificationType { return this._type; }
  get title(): string { return this._title; }
  get message(): string { return this._message; }
  get data(): Record<string, any> { return this._data; }
  get read(): boolean { return this._read; }
  get readAt(): Date | null { return this._readAt; }
  get createdAt(): Date { return this._createdAt; }
}
```

---

## Strategy Pattern for Channels

### Channel Interface

```typescript
export interface INotificationChannel {
  readonly name: string;
  canSend(preferences: NotificationPreference, type: string): boolean;
  send(notification: NotificationCreatedEvent): Promise<void>;
}
```

### Base Channel (Template Method)

```typescript
export abstract class BaseChannel implements INotificationChannel {
  abstract readonly name: string;

  canSend(preferences: NotificationPreference, type: string): boolean {
    // Check global preference
    if (!preferences[this.name]) {
      return false;
    }
    // Check per-type preference
    const typePrefs = preferences.perTypePrefs?.[type];
    return typePrefs?.[this.name] !== false;
  }

  async send(notification: NotificationCreatedEvent): Promise<void> {
    // Template method
    const payload = this.formatPayload(notification);
    await this.deliver(payload);
    await this.logDelivery(notification.notificationId);
  }

  protected abstract formatPayload(notification: NotificationCreatedEvent): any;
  protected abstract deliver(payload: any): Promise<void>;

  protected async logDelivery(notificationId: string): Promise<void> {
    // Default logging implementation
  }
}
```

### Email Channel (SendGrid Adapter)

```typescript
@Injectable()
export class EmailChannel extends BaseChannel {
  readonly name = 'email';

  constructor(
    private readonly sendgrid: SendGridClient,
    private readonly userRepository: IUserRepository,
  ) {
    super();
  }

  protected formatPayload(notification: NotificationCreatedEvent): MailData {
    return {
      to: '', // Set in deliver
      from: 'noreply@example.com',
      subject: notification.title,
      html: this.renderTemplate(notification),
    };
  }

  protected async deliver(payload: MailData): Promise<void> {
    const user = await this.userRepository.findById(payload.userId);
    payload.to = user.email;
    await this.sendgrid.send(payload);
  }

  private renderTemplate(notification: NotificationCreatedEvent): string {
    // Render email template
    return `<h1>${notification.title}</h1><p>${notification.message}</p>`;
  }
}
```

---

## Mapper Pattern

```typescript
export class NotificationMapper {
  // Domain → DTO
  public static toDto(entity: Notification): NotificationResponseDto {
    return {
      id: entity.id.value,
      userId: entity.userId,
      type: entity.type.value,
      title: entity.title,
      message: entity.message,
      data: entity.data,
      read: entity.read,
      readAt: entity.readAt?.toISOString() ?? null,
      createdAt: entity.createdAt.toISOString(),
    };
  }

  // Drizzle Row → Domain
  public static toDomain(row: NotificationRow): Notification {
    return Notification.reconstitute({
      id: NotificationId.create(row.id),
      userId: row.userId,
      type: NotificationType.create(row.type),
      title: row.title,
      message: row.message,
      data: row.data,
      read: row.read,
      readAt: row.readAt,
      createdAt: row.createdAt,
    });
  }

  // Domain → Drizzle Insert
  public static toPersistence(entity: Notification): NotificationInsert {
    return {
      id: entity.id.value,
      userId: entity.userId,
      type: entity.type.value,
      title: entity.title,
      message: entity.message,
      data: entity.data,
      read: entity.read,
      readAt: entity.readAt,
      createdAt: entity.createdAt,
    };
  }
}
```

---

## Error Handling (RFC 7807)

### Problem Details Factory

```typescript
export class ProblemDetailsFactory {
  private static readonly BASE_URL = 'https://api.example.com/errors';

  static notFound(resource: string, id: string): ProblemDetails {
    return {
      type: `${this.BASE_URL}/not-found`,
      title: 'Not Found',
      status: 404,
      detail: `${resource} with ID '${id}' not found.`,
      timestamp: new Date().toISOString(),
    };
  }

  static forbidden(reason: string): ProblemDetails {
    return {
      type: `${this.BASE_URL}/forbidden`,
      title: 'Forbidden',
      status: 403,
      detail: reason,
      timestamp: new Date().toISOString(),
    };
  }

  static validationError(errors: ValidationError[]): ProblemDetails {
    return {
      type: `${this.BASE_URL}/validation-failed`,
      title: 'Validation Failed',
      status: 422,
      detail: 'The request contains invalid data.',
      timestamp: new Date().toISOString(),
      extensions: {
        errors: errors.map(e => ({
          field: e.property,
          constraints: e.constraints,
        })),
      },
    };
  }
}
```

### Response Format

```json
{
  "type": "https://api.example.com/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Notification with ID 'abc-123' not found.",
  "instance": "PATCH /api/v1/notifications/abc-123/read",
  "timestamp": "2026-01-11T12:00:00Z",
  "traceId": "req-xyz-789"
}
```

---

## Module Wiring

```typescript
@Module({
  imports: [
    CqrsModule,
    PreferencesModule,
    ChannelsModule,
    DrizzleModule,
  ],
  controllers: [NotificationsController],
  providers: [
    // Repository
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: NotificationRepository,
    },
    // Command Handlers
    CreateNotificationHandler,
    MarkAsReadHandler,
    MarkAllAsReadHandler,
    // Query Handlers
    GetNotificationsHandler,
    GetUnreadCountHandler,
    // Event Handlers
    NotificationCreatedHandler,
    // Gateway
    NotificationsGateway,
  ],
  exports: [NOTIFICATION_REPOSITORY],
})
export class NotificationsModule {}
```

---

## Architecture Checklist

### Advanced Level Requirements

#### Domain Layer
- [ ] Notification aggregate root implemented
- [ ] Value objects (NotificationId, NotificationType, NotificationChannel)
- [ ] Domain events (Created, Sent, Read)
- [ ] Repository interface defined
- [ ] Domain exceptions created

#### Application Layer
- [ ] Commands for write operations (Create, MarkAsRead, MarkAllAsRead)
- [ ] Queries for read operations (GetNotifications, GetUnreadCount)
- [ ] Event handlers for side effects (delivery)
- [ ] DTOs for all endpoints
- [ ] Mappers for domain <-> DTO <-> persistence

#### Infrastructure Layer
- [ ] Repository implementation (Drizzle)
- [ ] Controllers with CQRS
- [ ] WebSocket Gateway
- [ ] Channel implementations (Strategy Pattern)
- [ ] External service adapters

#### Cross-Cutting
- [ ] JWT Authentication
- [ ] WebSocket Authentication
- [ ] Validation (DTOs)
- [ ] Error handling (RFC 7807)
- [ ] Response formatting
- [ ] Request ID tracking

#### Testing
- [ ] Unit tests (80%+ coverage)
- [ ] E2E tests
- [ ] WebSocket tests

---

## Quick Reference

**Where does code go?**

| Concern | Location |
|---------|----------|
| HTTP handling | `infrastructure/controllers/` |
| WebSocket handling | `infrastructure/gateways/` |
| Business logic | `domain/aggregates/` |
| Commands/Queries | `application/commands/`, `application/queries/` |
| Data contracts | `application/dto/` |
| Data access | `infrastructure/persistence/` |
| Domain entities | `domain/aggregates/`, `domain/value-objects/` |
| Events | `domain/events/`, `application/event-handlers/` |
| External services | `channels/infrastructure/` |
| Error responses | `common/exceptions/` |

---

**Last updated:** 2026-01-11
