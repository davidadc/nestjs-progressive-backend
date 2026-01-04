# NestJS Progressive Backend - Monorepo

Collection of 16 progressive NestJS backend projects, from Beginner to Expert level.

**Stack:** NestJS + TypeScript + PostgreSQL + Redis
**Date:** January 2026

---

## Project Status

### Beginner Level

| Project                     | Status | Endpoints | DB  |
| --------------------------- | ------ | --------- | --- |
| **User Authentication API** | ✅     | 5         | ✅  |
| **Simple CRUD API**         | ✅     | 6         | ✅  |
| **Notes App Backend**       | ✅     | 9         | ✅  |
| **Blog REST API**           | ✅     | 8         | ✅  |

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
├── docs/                        # All documentation
│   ├── GUIDE.md
│   ├── ARCHITECTURE.md
│   ├── API_CONVENTIONS.md
│   ├── DESIGN_PATTERNS_PROGRESSIVE_EXAMPLE.md
│   └── DOCUMENTATION_INDEX.md
├── templates/                   # All templates
│   ├── AI_CONTEXT.template.md
│   ├── AI_CONTEXT.example.md
│   ├── README.template.md
│   └── PROGRESS.template.md
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
├── scripts/                     # Utility scripts
├── docker-compose.yml
├── README.md                    # This file
└── CLAUDE.md                    # AI instructions
```

---

## Documentation

- **[GUIDE.md](./docs/GUIDE.md)** - Complete documentation for all 16 projects
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Patterns and architecture decisions (17 patterns)
- **[API_CONVENTIONS.md](./docs/API_CONVENTIONS.md)** - REST conventions by level (RFC 7807 for Advanced+)
- **[DOCUMENTATION_INDEX.md](./docs/DOCUMENTATION_INDEX.md)** - Quick navigation index
- **[DESIGN_PATTERNS_PROGRESSIVE_EXAMPLE.md](./docs/DESIGN_PATTERNS_PROGRESSIVE_EXAMPLE.md)** - Real payment system example
- **[CLAUDE.md](./CLAUDE.md)** - Instructions for Claude Code

### Templates

- **[AI_CONTEXT.template.md](./templates/AI_CONTEXT.template.md)** - Template for per-project AI context
- **[README.template.md](./templates/README.template.md)** - Template for per-project README
- **[PROGRESS.template.md](./templates/PROGRESS.template.md)** - Template for implementation progress tracking

---

## Starting a New Project - Recommended Path

Follow this step-by-step workflow when starting any of the 16 projects:

### Step 1: Choose Your Project

**Read:** `docs/GUIDE.md`

- Review the 16 projects organized by level (Beginner → Expert)
- Each project includes description, entities, endpoints, and requirements
- Check the ORM assignment (Prisma, TypeORM, or Drizzle)

### Step 2: Understand the Architecture

**Read:** `docs/ARCHITECTURE.md` (section for your level)

- **Beginner:** 3-Layer (Controller → Service → Repository)
- **Intermediate:** 4-Layer Clean Architecture
- **Advanced:** 5+ Layer with DDD, CQRS
- **Expert:** Distributed (Event Sourcing, Sagas)

Review the design patterns for your level:
| Level | Patterns |
|-------|----------|
| Beginner | Repository, Factory, Singleton, Decorator |
| Intermediate | + Strategy, Observer, Adapter, Builder, Facade |
| Advanced | + Mediator, State, Template Method, Domain Events |
| Expert | + CQRS, Event Sourcing, Circuit Breaker, Saga |

### Step 3: Learn API Conventions

**Read:** `docs/API_CONVENTIONS.md` (section for your level)

- URL structure, HTTP methods, status codes
- Request/response formats
- Error handling approach
- **Advanced+:** RFC 7807 Problem Details (MANDATORY)

### Step 4: Study Real Examples

**Read:** `docs/DESIGN_PATTERNS_PROGRESSIVE_EXAMPLE.md`

- See how a Payment System evolves from Beginner to Expert
- Understand when and why to introduce each pattern
- Reference working code for each level

### Step 5: Set Up Your Project

**Copy templates to your project folder:**

```bash
# Navigate to your project directory
cd projects/{level}/{project-name}

# Copy all templates (from project directory)
cp ../../../templates/AI_CONTEXT.template.md ./AI_CONTEXT.md
cp ../../../templates/README.template.md ./README.md
cp ../../../templates/PROGRESS.template.md ./PROGRESS.md
```

**Customize the templates:**

- Replace all `{{PLACEHOLDER}}` values with project-specific details
- Remove sections that don't apply to your level
- Add project-specific endpoints and entities

**PROGRESS.md serves as:**

- Implementation planification (must be approved before coding)
- Progress tracking checklist
- Technical reference (endpoints, entities, folder structure)

### Step 6: Start Developing

**Use your project's `AI_CONTEXT.md` as a guide:**

1. **Setup:** Create folder structure, configure database
2. **Domain Layer:** Entities, repository interfaces
3. **Application Layer:** DTOs, services, use-cases
4. **Infrastructure Layer:** Controllers, repositories, config
5. **Testing:** Unit tests (80%+ coverage), E2E tests
6. **Documentation:** Swagger/OpenAPI

### Quick Reference

```
DOCUMENTATION FLOW:

docs/GUIDE.md                    → "What project should I build?"
        ↓
docs/ARCHITECTURE.md             → "What patterns should I use?"
        ↓
docs/API_CONVENTIONS.md          → "How should I design endpoints?"
        ↓
docs/DESIGN_PATTERNS_...         → "Show me real code examples"
        ↓
templates/ (copy to project):
  - AI_CONTEXT.template.md       → "Set up my project context"
  - README.template.md           → "Document my project"
  - PROGRESS.template.md         → "Plan my implementation"
        ↓
Project's PROGRESS.md            → "Get approval, then track progress"
        ↓
Project's AI_CONTEXT.md          → "Guide my implementation"
```

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

- [x] User Authentication API
- [x] Simple CRUD API
- [x] Notes App Backend
- [x] Blog REST API

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

| ORM         | Projects   | Best For                                  |
| ----------- | ---------- | ----------------------------------------- |
| **Prisma**  | 5 projects | Rapid development, type safety, beginners |
| **TypeORM** | 6 projects | Complex domains, DDD, enterprise patterns |
| **Drizzle** | 4 projects | Performance-critical, SQL control         |

See [GUIDE.md](./docs/GUIDE.md) for specific ORM assignments per project.

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

**Last updated:** 2026-01-03
**Maintainer:** David
**Contributions:** Welcome
