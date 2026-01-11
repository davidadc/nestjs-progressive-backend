# ARCHITECTURE.md - Chat App Backend

## Project Architecture Overview

**Project:** Chat App Backend
**Level:** Intermediate
**Architecture Style:** Modular Clean Architecture (4-Layer)
**ORM:** Drizzle
**Real-time:** Socket.io + Redis

---

## Layer Structure

### Intermediate: 4-Layer Clean Architecture

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│  (Controllers, Gateways, Guards)        │
├─────────────────────────────────────────┤
│           Application Layer             │
│  (Use Cases, DTOs, Mappers, Services)   │
├─────────────────────────────────────────┤
│             Domain Layer                │
│  (Entities, Repository Interfaces)      │
├─────────────────────────────────────────┤
│         Infrastructure Layer            │
│  (Repositories, Redis, Config)          │
└─────────────────────────────────────────┘
```

**Request Flow (HTTP):**
```
HTTP Request → Controller → UseCase/Service → Domain → Repository → Database
```

**Request Flow (WebSocket):**
```
WebSocket Event → Gateway → Service → Repository/Redis → Broadcast
```

---

## Folder Structure

```
src/
├── users/                         # User module
│   ├── users.module.ts
│   ├── domain/
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   └── repositories/
│   │       └── user.repository.interface.ts
│   ├── application/
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   └── user-response.dto.ts
│   │   ├── services/
│   │   │   └── user.service.ts
│   │   └── use-cases/
│   │       └── get-user-status.use-case.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── users.controller.ts
│       └── persistence/
│           └── user.repository.ts
│
├── conversations/                 # Conversation module
│   ├── conversations.module.ts
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── conversation.entity.ts
│   │   │   └── conversation-participant.entity.ts
│   │   └── repositories/
│   │       └── conversation.repository.interface.ts
│   ├── application/
│   │   ├── dto/
│   │   │   ├── create-conversation.dto.ts
│   │   │   ├── add-participant.dto.ts
│   │   │   └── conversation-response.dto.ts
│   │   ├── services/
│   │   │   └── conversation.service.ts
│   │   └── use-cases/
│   │       ├── create-conversation.use-case.ts
│   │       └── add-participant.use-case.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── conversations.controller.ts
│       └── persistence/
│           └── conversation.repository.ts
│
├── messages/                      # Message module
│   ├── messages.module.ts
│   ├── domain/
│   │   ├── entities/
│   │   │   └── message.entity.ts
│   │   └── repositories/
│   │       └── message.repository.interface.ts
│   ├── application/
│   │   ├── dto/
│   │   │   ├── send-message.dto.ts
│   │   │   └── message-response.dto.ts
│   │   ├── services/
│   │   │   └── message.service.ts
│   │   └── use-cases/
│   │       ├── send-message.use-case.ts
│   │       └── get-message-history.use-case.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── messages.controller.ts
│       └── persistence/
│           └── message.repository.ts
│
├── chat/                          # WebSocket Gateway module
│   ├── chat.module.ts
│   ├── application/
│   │   ├── dto/
│   │   │   ├── ws-message.dto.ts
│   │   │   └── typing-indicator.dto.ts
│   │   └── services/
│   │       └── presence.service.ts
│   └── infrastructure/
│       └── gateways/
│           └── chat.gateway.ts
│
├── auth/                          # Authentication module
│   ├── auth.module.ts
│   ├── application/
│   │   ├── dto/
│   │   └── services/
│   │       └── auth.service.ts
│   └── infrastructure/
│       ├── controllers/
│       │   └── auth.controller.ts
│       ├── guards/
│       │   ├── jwt-auth.guard.ts
│       │   └── ws-auth.guard.ts
│       └── strategies/
│           └── jwt.strategy.ts
│
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── ws-current-user.decorator.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   └── interceptors/
│       └── response-transform.interceptor.ts
│
├── config/
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── redis.config.ts
│
├── database/
│   ├── drizzle.module.ts
│   ├── schema/
│   │   ├── users.ts
│   │   ├── conversations.ts
│   │   ├── conversation-participants.ts
│   │   └── messages.ts
│   └── migrations/
│
├── app.module.ts
└── main.ts
```

---

## Design Patterns Required

### Intermediate Level Patterns

- [x] **Repository Pattern** - Abstract Drizzle behind interfaces
- [x] **Factory Pattern** - Create complex objects (Conversation.create())
- [x] **Strategy Pattern** - Message handling strategies (text, file, system)
- [x] **Observer Pattern** - Real-time events (typing, presence, messages)
- [x] **Adapter Pattern** - Socket.io integration with NestJS
- [x] **Builder Pattern** - Complex DTO construction
- [x] **Facade Pattern** - PresenceService simplifies Redis operations

---

## Layer Responsibilities

### Presentation Layer

**Purpose:** Handle HTTP requests and WebSocket events

**Contains:**
- REST Controllers
- WebSocket Gateways
- Guards (HTTP + WebSocket)

**Rules:**
- NO business logic
- Validate input
- Route to appropriate services

### Application Layer

**Purpose:** Business logic and orchestration

**Contains:**
- Services
- Use Cases
- DTOs
- Mappers

**Rules:**
- NO infrastructure concerns
- Coordinate domain objects
- Emit events for real-time updates

### Domain Layer

**Purpose:** Core business rules

**Contains:**
- Entities
- Repository Interfaces

**Rules:**
- NO framework dependencies
- Pure TypeScript classes

### Infrastructure Layer

**Purpose:** Technical implementations

**Contains:**
- Drizzle repositories
- Redis operations
- WebSocket gateway implementation

---

## WebSocket Architecture

### Connection Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client                                   │
│  const socket = io('/chat', { auth: { token: 'jwt...' } })     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      WsAuthGuard                                 │
│  - Validates JWT token                                          │
│  - Attaches user to socket                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ChatGateway                                 │
│  - handleConnection(): Add to presence, join rooms             │
│  - handleDisconnect(): Remove from presence                     │
│  - @SubscribeMessage() handlers                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PresenceService (Redis)                        │
│  - Track online users                                           │
│  - Store typing indicators                                      │
│  - Manage socket rooms                                          │
└─────────────────────────────────────────────────────────────────┘
```

### Chat Gateway Implementation

```typescript
@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly presenceService: PresenceService,
    private readonly messageService: MessageService,
  ) {}

  async handleConnection(client: Socket) {
    const user = client.data.user; // Set by WsAuthGuard
    await this.presenceService.setOnline(user.id, client.id);

    // Join user's conversation rooms
    const conversations = await this.conversationService.findByUserId(user.id);
    conversations.forEach(conv => client.join(`conversation:${conv.id}`));

    // Broadcast online status
    this.server.emit('user:online', { userId: user.id, status: 'online' });
  }

  async handleDisconnect(client: Socket) {
    const user = client.data.user;
    await this.presenceService.setOffline(user.id);
    this.server.emit('user:offline', { userId: user.id });
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const user = client.data.user;
    const message = await this.messageService.create(dto.conversationId, user.id, dto.content);

    // Broadcast to conversation room
    this.server.to(`conversation:${dto.conversationId}`).emit('message:received', message);

    return { success: true, data: message };
  }

  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: TypingIndicatorDto,
  ) {
    const user = client.data.user;
    await this.presenceService.setTyping(dto.conversationId, user.id, true);

    client.to(`conversation:${dto.conversationId}`).emit('typing:update', {
      conversationId: dto.conversationId,
      userId: user.id,
      isTyping: true,
    });
  }
}
```

---

## WebSocket Events Reference

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `conversation:join` | `{ conversationId }` | Join conversation room |
| `conversation:leave` | `{ conversationId }` | Leave conversation room |
| `message:send` | `{ conversationId, content }` | Send a message |
| `typing:start` | `{ conversationId }` | User started typing |
| `typing:stop` | `{ conversationId }` | User stopped typing |
| `presence:update` | `{ status }` | Update presence status |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `message:received` | `{ id, sender, content, ... }` | New message |
| `typing:update` | `{ conversationId, userId, isTyping }` | Typing indicator |
| `user:online` | `{ userId, status }` | User came online |
| `user:offline` | `{ userId }` | User went offline |
| `participant:added` | `{ conversationId, user }` | New participant |
| `error` | `{ message, code }` | Error notification |

---

## Presence Service (Redis)

### Implementation

```typescript
@Injectable()
export class PresenceService {
  constructor(private readonly redis: Redis) {}

  async setOnline(userId: string, socketId: string): Promise<void> {
    await this.redis.hset('presence:online', userId, JSON.stringify({
      socketId,
      status: 'online',
      lastSeen: new Date().toISOString(),
    }));
  }

  async setOffline(userId: string): Promise<void> {
    await this.redis.hdel('presence:online', userId);
  }

  async getOnlineUsers(): Promise<UserPresence[]> {
    const data = await this.redis.hgetall('presence:online');
    return Object.entries(data).map(([userId, json]) => ({
      userId,
      ...JSON.parse(json),
    }));
  }

  async setTyping(conversationId: string, userId: string, isTyping: boolean): Promise<void> {
    const key = `typing:${conversationId}`;
    if (isTyping) {
      await this.redis.sadd(key, userId);
      await this.redis.expire(key, 10); // Auto-expire after 10 seconds
    } else {
      await this.redis.srem(key, userId);
    }
  }

  async getTypingUsers(conversationId: string): Promise<string[]> {
    return this.redis.smembers(`typing:${conversationId}`);
  }
}
```

---

## Drizzle ORM Schema

### Schema Definitions

```typescript
// database/schema/users.ts
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  avatar: varchar('avatar', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// database/schema/conversations.ts
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }),
  isGroup: boolean('is_group').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// database/schema/messages.ts
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').references(() => conversations.id).notNull(),
  senderId: uuid('sender_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### Repository Implementation

```typescript
@Injectable()
export class MessageRepository implements IMessageRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findByConversationId(
    conversationId: string,
    options: { limit: number; before?: Date },
  ): Promise<Message[]> {
    const query = this.db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(options.limit);

    if (options.before) {
      query.where(lt(messages.createdAt, options.before));
    }

    const rows = await query;
    return rows.map(MessageMapper.toDomain);
  }

  async create(message: Message): Promise<Message> {
    const [row] = await this.db
      .insert(messages)
      .values(MessageMapper.toPersistence(message))
      .returning();
    return MessageMapper.toDomain(row);
  }
}
```

---

## Observer Pattern (Real-time Events)

### Event Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Service   │────>│   Gateway   │────>│   Clients   │
│  (creates)  │     │ (broadcasts)│     │  (receive)  │
└─────────────┘     └─────────────┘     └─────────────┘
       │
       │ Emits event
       ▼
┌─────────────────────────────────────────────────────┐
│              Socket.io Server                        │
│  - server.to('room').emit('event', data)            │
│  - Real-time delivery to all room participants      │
└─────────────────────────────────────────────────────┘
```

---

## WebSocket Authentication

### WsAuthGuard

```typescript
@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient();
    const token = client.handshake.auth.token;

    if (!token) {
      throw new WsException('Missing authentication token');
    }

    try {
      const payload = this.jwtService.verify(token);
      client.data.user = payload; // Attach user to socket
      return true;
    } catch {
      throw new WsException('Invalid token');
    }
  }
}
```

---

## Architecture Checklist

### Intermediate Level Requirements

#### Domain Layer
- [x] Domain entities
- [x] Repository interfaces

#### Application Layer
- [x] Use cases (CreateConversation, SendMessage)
- [x] Services (PresenceService, MessageService)
- [x] DTOs for HTTP and WebSocket
- [x] Mappers

#### Infrastructure Layer
- [x] Drizzle repositories
- [x] WebSocket gateway
- [x] Redis integration
- [x] HTTP + WS guards

#### Cross-Cutting
- [x] JWT Authentication (HTTP + WebSocket)
- [x] Validation
- [x] Response envelope format
- [x] Error handling

#### Testing
- [x] Unit tests (80%+ coverage)
- [x] E2E tests (HTTP + WebSocket)

---

## Quick Reference

**Where does code go?**

| Concern | Location |
|---------|----------|
| REST endpoints | `src/{module}/infrastructure/controllers/` |
| WebSocket handlers | `src/chat/infrastructure/gateways/` |
| Business logic | `src/{module}/application/services/` or `use-cases/` |
| DTOs | `src/{module}/application/dto/` |
| Domain entities | `src/{module}/domain/entities/` |
| Repository interfaces | `src/{module}/domain/repositories/` |
| Drizzle repositories | `src/{module}/infrastructure/persistence/` |
| Drizzle schema | `src/database/schema/` |
| Presence/Redis | `src/chat/application/services/presence.service.ts` |

---

## Drizzle Commands

```bash
# Generate migrations from schema changes
pnpm exec drizzle-kit generate

# Apply migrations
pnpm exec drizzle-kit migrate

# Open Drizzle Studio
pnpm exec drizzle-kit studio
```

---

**Last updated:** 2026-01-11
