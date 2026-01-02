# NestJS Progressive Backend - Monorepo

Collection of 16 progressive NestJS backend projects, from Beginner to Expert level.

**Stack:** NestJS + TypeScript + PostgreSQL + Redis
**Date:** January 2026

---

## Project Status

### Beginner Level

| Project                     | Status | Endpoints | DB  |
| --------------------------- | ------ | --------- | --- |
| **User Authentication API** | ⬜     | 5         | ✅  |
| **Simple CRUD API**         | ⬜     | 6         | ✅  |
| **Notes App Backend**       | ⬜     | 6         | ✅  |
| **Blog REST API**           | ⬜     | 8         | ✅  |

### Intermediate Level

| Project                 | Status | Endpoints | DB  |
| ----------------------- | ------ | --------- | --- |
| **E-commerce Backend**  | ⬜     | 12+       | ✅  |
| **Task Management API** | ⬜     | 10+       | ✅  |
| **Chat App Backend**    | ⬜     | WebSocket | ✅  |
| **File Upload API**     | ⬜     | 5         | ✅  |

### Advanced Level

| Project                           | Status | Endpoints | DB  |
| --------------------------------- | ------ | --------- | --- |
| **Social Media Backend**          | ⬜     | 10+       | ✅  |
| **Payment Integration API**       | ⬜     | 5         | ✅  |
| **Real-time Notification System** | ⬜     | 5         | ✅  |
| **Admin Dashboard API**           | ⬜     | 10+       | ✅  |

### Expert Level

| Project                        | Status | Endpoints | DB  |
| ------------------------------ | ------ | --------- | --- |
| **Microservices Architecture** | ⬜     | Multiple  | ✅  |
| **Scalable Streaming Backend** | ⬜     | WebSocket | ✅  |
| **Multi-tenant SaaS Backend**  | ⬜     | 10+       | ✅  |
| **AI Recommendation Engine**   | ⬜     | 5         | ✅  |

**Legend:** ⬜ = Not started | 🟨 = In progress | ✅ = Completed

---

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- pnpm (or npm/yarn)

### Initial Setup

```bash
# 1. Clone/download the monorepo
cd nestjs-progressive-backend

# 2. Start Docker services (PostgreSQL, Redis, etc)
docker-compose up -d

# 3. Navigate to the first project
cd projects/user-auth-api

# 4. Install dependencies
pnpm install

# 5. Configure .env
cp .env.example .env

# 6. Run migrations
pnpm run typeorm migration:run

# 7. Start in development mode
pnpm run start:dev
```

---

## Structure

```
nestjs-progressive-backend/
├── projects/
│   ├── beginner/
│   │   ├── user-auth-api/
│   │   ├── crud-api/
│   │   ├── notes-app/
│   │   └── blog-api/
│   ├── intermediate/
│   │   ├── ecommerce-backend/
│   │   ├── task-management-api/
│   │   ├── chat-app-backend/
│   │   └── file-upload-api/
│   ├── advanced/
│   │   ├── social-media-backend/
│   │   ├── payment-integration-api/
│   │   ├── notification-system/
│   │   └── admin-dashboard-api/
│   └── expert/
│       ├── microservices/
│       ├── streaming-backend/
│       ├── saas-multi-tenant/
│       └── recommendation-engine/
├── docker-compose.yml
├── README.md (this file)
└── GUIDE.md (detailed documentation)
```

---

## Documentation

- **[GUIDE.md](./GUIDE.md)** - Complete documentation for all projects
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Patterns and architecture decisions
- **[API_CONVENTIONS.md](./API_CONVENTIONS.md)** - API standards

---

## Useful Commands

### Per project:

```bash
# Installation and setup
pnpm install
cp .env.example .env

# Development
pnpm run start:dev       # Watch mode
pnpm run start           # Production
pnpm run build           # Build

# Testing
pnpm run test            # Unit tests
pnpm run test:watch      # Watch mode
pnpm run test:cov        # With coverage
pnpm run test:e2e        # E2E tests

# Database
pnpm run typeorm migration:generate -- --name migration-name
pnpm run typeorm migration:run
pnpm run typeorm migration:revert
```

### Docker:

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f postgres
docker-compose logs -f redis

# Stop services
docker-compose down

# Reset database
docker-compose down -v
docker-compose up -d
```

---

## Suggested Roadmap

### Phase 1: Fundamentals (Beginner)

- [ ] User Authentication API
- [ ] Simple CRUD API
- [ ] Notes App Backend
- [ ] Blog REST API

### Phase 2: Intermediate Level

- [ ] E-commerce Backend
- [ ] Task Management API
- [ ] Chat App Backend
- [ ] File Upload API

### Phase 3: Advanced Level

- [ ] Social Media Backend
- [ ] Payment Integration API
- [ ] Real-time Notification System
- [ ] Admin Dashboard API

### Phase 4: Expert Level

- [ ] Microservices Architecture
- [ ] Scalable Streaming Backend
- [ ] Multi-tenant SaaS Backend
- [ ] AI Recommendation Engine

---

## Tech Stack

### Backend

- **Runtime:** Node.js 20+
- **Language:** TypeScript 5+
- **Framework:** NestJS 10+
- **ORMs:** Prisma, TypeORM, Drizzle (varies by project)
- **Database:** PostgreSQL 17+
- **Cache:** Redis 7+
- **Testing:** Jest, Supertest
- **API Documentation:** Swagger/OpenAPI

### ORM Distribution

| ORM | Projects | Best For |
|-----|----------|----------|
| **Prisma** | 5 projects | Rapid development, type safety, beginners |
| **TypeORM** | 6 projects | Complex domains, DDD, enterprise patterns |
| **Drizzle** | 4 projects | Performance-critical, SQL control |

See [GUIDE.md](./GUIDE.md) for specific ORM assignments per project.

### DevOps

- **Containerization:** Docker
- **Orchestration:** Docker Compose
- **Version Control:** Git
- **Package Manager:** pnpm

---

## Using with Claude Code

### Option 1: Code Review per Project

```bash
cd projects/user-auth-api
claude code
```

Ask Claude:

- "Review the project structure"
- "Implement the authentication layer"
- "Generate tests for RegisterUseCase"

### Option 2: Context-Aware Development

Each project has an `AI_CONTEXT.md` file:

```bash
claude code --context AI_CONTEXT.md
```

### Option 3: Code Generation

Ask Claude to generate:

- Base structure for a new project
- Entities and repositories
- Controllers and DTOs
- Complete tests

---

## Development Checklist

For each project:

- [ ] **Planning**

  - [ ] Identify entities
  - [ ] Map relationships
  - [ ] List endpoints
  - [ ] Security requirements

- [ ] **Implementation**

  - [ ] Domain layer (entities, repositories)
  - [ ] Application layer (use cases, services, DTOs)
  - [ ] Infrastructure layer (controllers, persistence, config)
  - [ ] Testing (unit + e2e)
  - [ ] Documentation (Swagger, README)

- [ ] **Quality**
  - [ ] Minimum 80% coverage
  - [ ] Lint/Prettier
  - [ ] Error handling
  - [ ] Input validation

---

## Security

### Checklist per project

- [ ] **Authentication**

  - [ ] JWT with expiration
  - [ ] Refresh tokens
  - [ ] Password hashing (bcrypt)

- [ ] **Authorization**

  - [ ] Role-based access control (RBAC)
  - [ ] Guards on protected endpoints
  - [ ] Permission validation

- [ ] **Data**

  - [ ] Input validation (class-validator)
  - [ ] SQL injection protection (TypeORM)
  - [ ] Rate limiting on critical endpoints
  - [ ] HTTPS in production

- [ ] **Logs & Audit**
  - [ ] Structured logging
  - [ ] Audit of sensitive changes
  - [ ] Don't log sensitive data

---

## Troubleshooting

### PostgreSQL connection refused

```bash
# Verify Docker is running
docker ps

# Restart postgres
docker-compose restart postgres

# View logs
docker-compose logs postgres
```

### Port 5432 already in use

```bash
# Use a different port in docker-compose.yml
# Change: "5432:5432" to "5433:5432"
# Update DATABASE_PORT in .env
```

### Jest tests not running

```bash
# Install test dependencies
pnpm install

# Clear Jest cache
pnpm run test -- --clearCache
```

---

## Contact and Feedback

- **Issues:** Document bugs in each project
- **Improvements:** Propose improvements via git commits
- **Questions:** Check GUIDE.md first

---

## License

MIT - Free for educational and personal use

---

## Learning Resources

### Documentation

- [NestJS Official Docs](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [PostgreSQL Docs](https://www.postgresql.org/docs)
- [JWT.io](https://jwt.io)

### Architecture

- Clean Architecture: Robert C. Martin
- Domain-Driven Design: Eric Evans
- SOLID Principles
- Design Patterns: Gang of Four

### Videos & Courses

- NestJS Official YouTube
- Traversy Media
- The Net Ninja

---

**Last updated:** 2026-01-02
**Maintainer:** David
**Contributions:** Welcome
