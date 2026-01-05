# AI_CONTEXT.md - Context for Claude Code

## Project Information

**Name:** Chat App Backend
**Level:** Intermediate
**Description:** Real-time chat application with WebSocket support, conversation management, and user presence tracking
**ORM:** Drizzle
**Stack:** NestJS + TypeScript + PostgreSQL + Drizzle + Socket.io + Redis

---

## Project Structure

### Intermediate Level (Modular + Clean Architecture)

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
├── auth/                          # Authentication module
│   ├── auth.module.ts
│   ├── application/
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   └── register.dto.ts
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
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   └── ws-current-user.decorator.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── interceptors/
│   │   └── response-transform.interceptor.ts
│   └── pipes/
│       └── validation.pipe.ts
├── config/
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── redis.config.ts
├── database/
│   ├── drizzle.module.ts
│   ├── schema/
│   │   ├── users.ts
│   │   ├── conversations.ts
│   │   ├── conversation-participants.ts
│   │   └── messages.ts
│   └── migrations/
├── app.module.ts
└── main.ts

test/
├── users.service.spec.ts
├── conversation.service.spec.ts
├── message.service.spec.ts
├── chat.gateway.spec.ts
└── app.e2e-spec.ts
```

---

## Architecture

### Intermediate (4 layers)

```
Controller/Gateway → UseCase/Service → Domain → Repository
```

**Patterns Used:**

- Repository Pattern - Abstract data access
- Factory Pattern - Create complex objects
- Strategy Pattern - Different message handling strategies
- Observer Pattern - Event-driven notifications (typing, presence)
- Adapter Pattern - Socket.io integration
- Builder Pattern - Complex DTO construction
- Facade Pattern - Simplified WebSocket interface

**Flow (HTTP):**

```
HTTP Request
    ↓
Controller (validates request)
    ↓
UseCase / Service (business logic)
    ↓
Repository (data access via Drizzle)
    ↓
PostgreSQL Database
```

**Flow (WebSocket):**

```
WebSocket Connection
    ↓
Chat Gateway (validates & routes events)
    ↓
Presence Service / Message Service
    ↓
Repository + Redis (for presence/typing)
    ↓
Broadcast to participants
```

---

## Entities

### User Entity

```typescript
export class User {
  id: string;
  email: string;
  name: string;
  password: string; // hashed
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Conversation Entity

```typescript
export class Conversation {
  id: string;
  name?: string; // optional for group chats
  isGroup: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### ConversationParticipant Entity

```typescript
export class ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  joinedAt: Date;
  leftAt?: Date;
}
```

### Message Entity

```typescript
export class Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### DTOs

**SendMessageDto** (input)

- conversationId: string (required, UUID)
- content: string (required, min 1, max 2000)

**MessageResponseDto** (output)

- id: string
- conversationId: string
- sender: UserResponseDto
- content: string
- createdAt: Date

**CreateConversationDto** (input)

- participantIds: string[] (required, min 1)
- name?: string (optional, for groups)

---

## Security Requirements

### Authentication

- [x] JWT tokens for HTTP and WebSocket
- [x] Password hashing (bcrypt)
- [x] Rate limiting on auth endpoints

### Authorization

- [x] Only conversation participants can read/send messages
- [x] Validate user membership before any conversation operation
- [x] WebSocket authentication via token

### Validation

- [x] DTOs with class-validator
- [x] Input sanitization for message content

### Error Handling

- [x] Consistent error responses (Intermediate format)
- [x] No stack traces in production
- [x] WebSocket error events

---

## Endpoints

### REST API (Base: `/api/v1`)

### POST /api/v1/auth/register

**Description:** Register a new user

**Request:**

```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securePassword123"
}
```

**Success (201):**

```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### POST /api/v1/auth/login

**Description:** Authenticate and receive JWT token

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Success (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "accessToken": "jwt.token.here",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

### GET /api/v1/conversations

**Description:** List user's conversations

**Headers:** `Authorization: Bearer <token>`

**Success (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "id": "conv-uuid",
      "name": null,
      "isGroup": false,
      "participants": [
        { "id": "user-1", "name": "John" },
        { "id": "user-2", "name": "Jane" }
      ],
      "lastMessage": {
        "content": "Hello!",
        "createdAt": "2026-01-05T10:00:00Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5
  }
}
```

### POST /api/v1/conversations

**Description:** Create a new conversation

**Request:**

```json
{
  "participantIds": ["user-uuid-2"],
  "name": "Optional Group Name"
}
```

**Success (201):**

```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": "conv-uuid",
    "name": null,
    "isGroup": false,
    "participants": [...]
  }
}
```

### GET /api/v1/conversations/:id

**Description:** Get conversation details

**Success (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "conv-uuid",
    "name": null,
    "isGroup": false,
    "participants": [...],
    "createdAt": "2026-01-05T10:00:00Z"
  }
}
```

### GET /api/v1/conversations/:id/messages

**Description:** Get paginated message history

**Query Params:** `page=1&limit=50&before=timestamp`

**Success (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "id": "msg-uuid",
      "sender": { "id": "user-1", "name": "John" },
      "content": "Hello!",
      "createdAt": "2026-01-05T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "hasMore": true
  }
}
```

### POST /api/v1/conversations/:id/messages

**Description:** Send a message (HTTP fallback, prefer WebSocket)

**Request:**

```json
{
  "content": "Hello!"
}
```

**Success (201):**

```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": "msg-uuid",
    "conversationId": "conv-uuid",
    "sender": { "id": "user-1", "name": "John" },
    "content": "Hello!",
    "createdAt": "2026-01-05T10:00:00Z"
  }
}
```

### POST /api/v1/conversations/:id/participants

**Description:** Add participant to conversation

**Request:**

```json
{
  "userId": "user-uuid-3"
}
```

### GET /api/v1/users/online

**Description:** Get list of online users

**Success (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    { "id": "user-1", "name": "John", "status": "online" },
    { "id": "user-2", "name": "Jane", "status": "away" }
  ]
}
```

---

## WebSocket Events

### Connection

```typescript
// Connect with auth token
const socket = io('http://localhost:3000/chat', {
  auth: { token: 'jwt.token.here' },
});
```

### Client → Server Events

| Event                | Payload                                          | Description            |
| -------------------- | ------------------------------------------------ | ---------------------- |
| `conversation:join`  | `{ conversationId: string }`                     | Join conversation room |
| `conversation:leave` | `{ conversationId: string }`                     | Leave conversation     |
| `message:send`       | `{ conversationId: string, content: string }`    | Send a message         |
| `typing:start`       | `{ conversationId: string }`                     | User started typing    |
| `typing:stop`        | `{ conversationId: string }`                     | User stopped typing    |
| `presence:update`    | `{ status: 'online' \| 'away' \| 'busy' }`       | Update presence status |

### Server → Client Events

| Event               | Payload                                            | Description             |
| ------------------- | -------------------------------------------------- | ----------------------- |
| `message:received`  | `{ id, conversationId, sender, content, ... }`     | New message received    |
| `typing:update`     | `{ conversationId, userId, isTyping }`             | Typing indicator update |
| `user:online`       | `{ userId, name, status }`                         | User came online        |
| `user:offline`      | `{ userId }`                                       | User went offline       |
| `participant:added` | `{ conversationId, user }`                         | New participant added   |
| `error`             | `{ message: string, code: string }`                | Error notification      |

---

## Testing Strategy

### Unit Tests (80% minimum coverage)

```typescript
describe('MessageService', () => {
  describe('sendMessage', () => {
    it('should create and return a new message');
    it('should throw error when user is not participant');
    it('should throw error when conversation not found');
  });
});

describe('ConversationService', () => {
  describe('createConversation', () => {
    it('should create conversation with participants');
    it('should return existing conversation for same participants');
  });
});

describe('PresenceService', () => {
  describe('updateStatus', () => {
    it('should update user status in Redis');
    it('should broadcast status change to connected users');
  });
});
```

### E2E Tests

```typescript
describe('Chat App E2E', () => {
  describe('POST /api/v1/conversations', () => {
    it('should create a new conversation');
    it('should fail without authentication');
  });

  describe('WebSocket', () => {
    it('should connect with valid token');
    it('should reject connection without token');
    it('should broadcast messages to participants');
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
  "@nestjs/platform-express": "^10.0.0",
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.1"
}
```

### WebSocket

```json
{
  "@nestjs/websockets": "^10.0.0",
  "@nestjs/platform-socket.io": "^10.0.0",
  "socket.io": "^4.7.0"
}
```

### Authentication

```json
{
  "@nestjs/jwt": "^10.0.0",
  "@nestjs/passport": "^10.0.0",
  "passport": "^0.7.0",
  "passport-jwt": "^4.0.0",
  "bcrypt": "^5.1.0"
}
```

### Database (Drizzle)

```json
{
  "drizzle-orm": "^0.29.0",
  "postgres": "^3.4.0"
}
// Dev dependencies
{
  "drizzle-kit": "^0.20.0"
}
```

### Redis

```json
{
  "ioredis": "^5.0.0"
}
```

### Documentation

```json
{
  "@nestjs/swagger": "^7.0.0"
}
```

---

## Configuration (.env)

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=admin
DATABASE_PASSWORD=admin
DATABASE_NAME=chat_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=3600

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# App
NODE_ENV=development
PORT=3000
```

---

## Code Conventions

### Naming

- Controllers: `*.controller.ts`
- Services: `*.service.ts`
- Repositories: `*.repository.ts`
- DTOs: `*.dto.ts`
- Entities: `*.entity.ts`
- Use Cases: `*.use-case.ts`
- Gateways: `*.gateway.ts`

### Style

- Strict TypeScript
- Prettier + ESLint
- 2 spaces indentation

---

## Workflow with Claude Code

### 1. Setup

```
"Create the folder and file structure for Chat App with Intermediate architecture using Drizzle ORM"
```

### 2. Domain Layer

```
"Implement User, Conversation, and Message entities and their repository interfaces"
```

### 3. Application Layer

```
"Implement DTOs, MessageService, ConversationService, and PresenceService"
```

### 4. Infrastructure Layer

```
"Implement Chat Gateway with WebSocket events and REST controllers"
```

### 5. Testing

```
"Create unit tests for services and e2e tests for the chat functionality"
```

---

## Learning Goals

Upon completing this project:

- [ ] Understand WebSocket implementation with NestJS and Socket.io
- [ ] Apply Observer pattern for real-time event handling
- [ ] Implement user presence tracking with Redis
- [ ] Master Drizzle ORM for lightweight SQL operations
- [ ] Handle real-time data synchronization across clients

---

## Next Steps

After completion:

1. Add file/image sharing in messages
2. Implement message reactions
3. Add read receipts

Then proceed to: **File Upload API** (next Intermediate project)

---

## Quick Reference

**Where does X go? (Intermediate Clean Architecture):**

- Business logic → `src/{module}/application/services/` or `src/{module}/application/use-cases/`
- DTOs → `src/{module}/application/dto/`
- Database access → `src/{module}/infrastructure/persistence/`
- Endpoints → `src/{module}/infrastructure/controllers/`
- WebSocket handlers → `src/chat/infrastructure/gateways/`
- Domain entities → `src/{module}/domain/entities/`

**Drizzle Commands:**

```bash
pnpm exec drizzle-kit generate
pnpm exec drizzle-kit migrate
pnpm exec drizzle-kit studio
```

---

**Last updated:** 2026-01-05
**To use:** This is the AI context file for Claude Code
