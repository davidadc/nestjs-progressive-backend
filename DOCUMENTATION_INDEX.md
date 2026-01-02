# Complete Monorepo Documentation - Master Index

**Centralized guide for all available documents**

---

## Available Documents

### **1. GUIDE.md** - General Monorepo Guide

**For whom:** Everyone
**When to use:** When starting the project
**Content:**

- Monorepo structure (`projects/`)
- All 16 projects with complete description
- Technology stack
- Step-by-step initial setup
- 5-6 month roadmap
- Checklist per project

**Main sections:**

- Monorepo Structure
- Projects by Level (Beginner → Expert)
- Technology Stack
- Initial Setup
- Development Guide
- Checklist per Project

---

### **2. README.md** - Root Documentation

**For whom:** Developers who clone the project
**When to use:** After downloading
**Content:**

- Quick start
- Projects status
- Visual roadmap
- Useful commands
- Learning resources

---

### **3. ARCHITECTURE.md** - Progressive Architecture

**For whom:** Architects and senior developers
**When to use:** Before designing a project
**Content:**

- **Fundamental Principles:** SOLID + DRY
- **Beginner Level:** Simple Layered Architecture (3 layers)
- **Intermediate Level:** Basic Clean Architecture (4 layers)
- **Advanced Level:** Clean Architecture + DDD (5+ layers)
- **Expert Level:** Microservices + Event Sourcing
- **Design Patterns:** 17 progressive patterns
- **Dependency Injection:** By level
- **Testing Strategy:** Unit, Integration, E2E

**Main sections:**

1. Fundamental Principles (SOLID, DRY)
2. Beginner Level (Layered, Repository, Factory)
3. Intermediate Level (Clean Arch, Use Cases)
4. Advanced Level (CQRS, DDD, Domain Events)
5. Expert Level (Event Sourcing, Sagas)
6. **Design Patterns:** 17 patterns with examples
7. Dependency Injection
8. Testing Strategy
9. Comparative Summary

**When to consult each section?**

- `SOLID Principles`: Anytime (reference)
- `DRY`: When you notice code duplication
- `Beginner Level`: For initial projects
- `Intermediate Level`: When adding complexity
- `Advanced Level`: When you need CQRS/DDD
- `Design Patterns`: When you have a specific problem
- `Testing Strategy`: Before writing tests

---

### **4. API_CONVENTIONS.md** - REST Conventions

**For whom:** Backend developers
**When to use:** Before creating endpoints
**Content:**

- **Beginner:** Basic REST (GET, POST, PUT, DELETE)
- **Intermediate:** Versioning, Rate Limiting, Swagger
- **Advanced:** RFC 7807 Problem Details (MANDATORY)
- **Expert:** Webhooks, Async Operations, Deprecation

**Main sections:**

1. General Conventions (HTTP, Status Codes)
2. Beginner Level (URLs, Pagination, Filters)
3. Intermediate Level (Versioning, Caching, Headers)
4. Advanced Level (RFC 7807, ProblemDetails)
5. Expert Level (Webhooks, Async, Tracing)
6. Error Handling (by level)
7. RFC 7807 Detailed

**When to implement RFC 7807?**

- Beginner: Not required
- Intermediate: Optional
- **Advanced: MANDATORY**
- Expert: MANDATORY with Tracing

---

### **5. DESIGN_PATTERNS_PROGRESSIVE_EXAMPLE.md** - Real Example

**For whom:** Developers learning by example
**When to use:** After understanding a pattern
**Content:**

- **Use case:** Payment System (Payment Processing)
- **Beginner:** Simple Service (no patterns)
- **Intermediate:** Repository + Strategy + Observer + Facade
- **Advanced:** CQRS + RFC 7807 + Domain Events
- **Expert:** Event Sourcing + Sagas

**Each level shows:**

- Complete working code
- Solved problems
- Remaining problems
- Natural evolution

---

### **6. Templates** - Per-Project Documentation

**For whom:** Developers starting a new project
**When to use:** When setting up a project

#### AI_CONTEXT.template.md
Template for Claude Code context. Contains placeholders for:
- Project information and stack
- Folder structure
- Entities and DTOs
- Security requirements
- Endpoints documentation
- Testing strategy
- Workflow prompts

#### README.template.md
Template for project README. Contains placeholders for:
- Setup instructions
- Available scripts (with ORM-specific commands)
- API endpoints
- Environment variables
- Troubleshooting

#### AI_CONTEXT.example.md
Filled example (User Auth API) showing how to customize the template.

**Usage:**

```bash
# Copy templates to your project
cp AI_CONTEXT.template.md projects/beginner/user-auth-api/AI_CONTEXT.md
cp README.template.md projects/beginner/user-auth-api/README.md

# Edit placeholders with project-specific details
# Then run Claude Code from the project directory
```

---

## Workflow by Scenario

### **Scenario 1: Start New Project**

1. Read: `GUIDE.md` → Choose level and project
2. Consult: `ARCHITECTURE.md` → Read section corresponding to the level
3. Copy templates to project folder:
   - `AI_CONTEXT.template.md` → `projects/{level}/{project}/AI_CONTEXT.md`
   - `README.template.md` → `projects/{level}/{project}/README.md`
4. Customize: Replace placeholders with project-specific details
5. Start: Follow `README.md` Quick Start
6. Code: Run `claude code` from project directory

### **Scenario 2: Implement Endpoint**

1. Read: `API_CONVENTIONS.md` → Section for your level
2. Design: URL, methods, status codes
3. If Advanced+: Implement RFC 7807 with `ProblemDetailsFactory`
4. Validate: Against conventions for your level

### **Scenario 3: Solve Architectural Problem**

1. Identify the problem
2. Consult: `ARCHITECTURE.md` → "Design Patterns" section
3. Study: `DESIGN_PATTERNS_PROGRESSIVE_EXAMPLE.md` → Real example
4. Implement: Adapting to the context

### **Scenario 4: Learn a Pattern**

1. Choose pattern (e.g.: Strategy)
2. Read: `ARCHITECTURE.md` → "Design Patterns" section of the corresponding level
3. Example: `DESIGN_PATTERNS_PROGRESSIVE_EXAMPLE.md` → Real implementation
4. Practice: Implement in your project

### **Scenario 5: Scale to Next Level**

1. Analyze: What problems do you have?
2. Consult: `ARCHITECTURE.md` → Next level
3. Refactor: Introduce new patterns
4. Validate: Tests pass
5. Document: Update `AI_CONTEXT.md`

---

## Document Mind Map

```
START
  │
  ├─→ GUIDE.md (Which project to do?)
  │
  ├─→ README.md (Quick setup)
  │
  ├─→ ARCHITECTURE.md
  │    ├─→ SOLID/DRY Principles
  │    ├─→ Beginner Level (3 layers)
  │    ├─→ Intermediate Level (4 layers)
  │    ├─→ Advanced Level (5+ layers + DDD)
  │    ├─→ Expert Level (Microservices)
  │    └─→ DESIGN PATTERNS (17 patterns)
  │
  ├─→ DESIGN_PATTERNS_PROGRESSIVE_EXAMPLE.md (See patterns in action)
  │
  ├─→ API_CONVENTIONS.md (REST Endpoints)
  │    └─→ RFC 7807 from Advanced
  │
  └─→ AI_CONTEXT.md (For Claude Code)
```

---

## Quick Reference Table

### **By Project Level**

#### **Beginner Level** (User Auth, CRUD, Notes, Blog)

| Document                               | Sections                      | Patterns                       |
| -------------------------------------- | ----------------------------- | ------------------------------ |
| ARCHITECTURE.md                        | "Beginner Level Architecture" | Repository, Factory, Decorator |
| API_CONVENTIONS.md                     | "Beginner Level Conventions"  | URLs, Pagination               |
| GUIDE.md                               | Description of each project   | -                              |
| DESIGN_PATTERNS_PROGRESSIVE_EXAMPLE.md | "BEGINNER"                    | Simple Service                 |

#### **Intermediate Level** (E-commerce, Task, Chat, File Upload)

| Document                               | Sections                          | Patterns                        |
| -------------------------------------- | --------------------------------- | ------------------------------- |
| ARCHITECTURE.md                        | "Intermediate Level Architecture" | Strategy, Observer, Adapter     |
| API_CONVENTIONS.md                     | "Intermediate Level Conventions"  | Versioning, Rate Limit, Headers |
| DESIGN_PATTERNS_PROGRESSIVE_EXAMPLE.md | "INTERMEDIATE"                    | Facade, multiple strategies     |

#### **Advanced Level** (Social, Payments, Notifications, Admin)

| Document                               | Sections                                       | Patterns                           |
| -------------------------------------- | ---------------------------------------------- | ---------------------------------- |
| ARCHITECTURE.md                        | "Advanced Level Architecture"                  | CQRS, Domain Events, Value Objects |
| API_CONVENTIONS.md                     | **"Advanced Level - RFC 7807"** MANDATORY      | ProblemDetails                     |
| DESIGN_PATTERNS_PROGRESSIVE_EXAMPLE.md | "ADVANCED"                                     | CQRS, RFC 7807                     |

#### **Expert Level** (Microservices, Streaming, SaaS, Recommendations)

| Document                               | Sections                    | Patterns                  |
| -------------------------------------- | --------------------------- | ------------------------- |
| ARCHITECTURE.md                        | "Expert Level Architecture" | Event Sourcing, Sagas     |
| API_CONVENTIONS.md                     | "Expert Level Conventions"  | Webhooks, Tracing         |
| DESIGN_PATTERNS_PROGRESSIVE_EXAMPLE.md | "EXPERT"                    | Event Sourcing, Sagas     |

---

## Cross References

### **SOLID Principles** (in ARCHITECTURE.md)

→ Apply from Beginner onwards

### **DRY Principle** (in ARCHITECTURE.md)

→ Reuse code, services, validators

### **Repository Pattern** (in ARCHITECTURE.md)

→ From Beginner, improves in Intermediate+

### **Strategy Pattern** (in ARCHITECTURE.md)

→ For multiple providers (payments, emails, SMS)

### **Observer Pattern** (in ARCHITECTURE.md)

→ For notifications and events

### **CQRS Pattern** (in ARCHITECTURE.md)

→ From Advanced to separate read/write

### **RFC 7807** (in API_CONVENTIONS.md)

→ **Mandatory from Advanced**

### **Event Sourcing** (in ARCHITECTURE.md)

→ Expert: store events, not state

---

## Recommended Learning Paths

### **Path 1: Complete Beginner (8 weeks)**

```
Week 1-2:  GUIDE.md + README.md → Setup
Week 3-4:  ARCHITECTURE.md (Beginner) → Concepts
Week 5-6:  API_CONVENTIONS.md (Beginner) → 2 projects
Week 7-8:  DESIGN_PATTERNS_PROGRESSIVE_EXAMPLE.md → Practice
```

### **Path 2: Experienced Developer (6 weeks)**

```
Week 1:    ARCHITECTURE.md (all levels) → Complete vision
Week 2:    API_CONVENTIONS.md (all levels) → Conventions
Week 3-4:  ARCHITECTURE.md "Design Patterns" → Reference
Week 5-6:  DESIGN_PATTERNS_PROGRESSIVE_EXAMPLE.md → Practice
```

### **Path 3: Scaling (2 weeks per level)**

```
Current:   Finish Beginner
Next:      ARCHITECTURE.md (Intermediate) + new patterns
Next:      API_CONVENTIONS.md (Intermediate) + Swagger
Next:      ARCHITECTURE.md (Advanced) + RFC 7807
Next:      API_CONVENTIONS.md (Advanced) + Implement RFC 7807
Final:     ARCHITECTURE.md (Expert) + Event Sourcing
```

---

## How to Organize Documents

**In your monorepo:**

```
nestjs-progressive-backend/
├── GUIDE.md                              # Main guide
├── README.md                             # For cloning
├── CLAUDE.md                             # Claude Code instructions
├── ARCHITECTURE.md                       # Architecture + patterns reference
├── API_CONVENTIONS.md                    # REST conventions
├── DESIGN_PATTERNS_PROGRESSIVE_EXAMPLE.md # Progressive example
├── DOCUMENTATION_INDEX.md                # This index
│
├── AI_CONTEXT.template.md                # Template for per-project AI context
├── README.template.md                    # Template for per-project README
├── AI_CONTEXT.example.md                 # Filled example (User Auth)
│
└── projects/
    └── beginner/
        └── user-auth-api/
            ├── README.md                 # Project-specific README
            ├── AI_CONTEXT.md             # Project-specific AI context
            └── src/
```

---

## Project Lifecycle

```
1. PLAN (Read GUIDE.md + ARCHITECTURE.md)
   ├─ Choose level
   ├─ Choose projects
   └─ Review necessary patterns

2. DESIGN (Consult ARCHITECTURE.md)
   ├─ Folder structure
   ├─ Identify patterns ("Design Patterns" section)
   └─ Design API

3. IMPLEMENTATION (Use AI_CONTEXT.md + DESIGN_PATTERNS_PROGRESSIVE_EXAMPLE.md)
   ├─ Implement layers
   ├─ Apply patterns
   └─ Create endpoints

4. VALIDATION (Review API_CONVENTIONS.md)
   ├─ Correct URLs
   ├─ Appropriate status codes
   ├─ RFC 7807 if Advanced+
   └─ Tests pass

5. SCALING (Review new sections)
   ├─ Next level of complexity
   ├─ New patterns
   └─ New conventions
```

---

## Quick Search

**"What is the architecture for X project?"**
→ GUIDE.md + ARCHITECTURE.md (level section)

**"What is the status code for X?"**
→ API_CONVENTIONS.md (level section)

**"How do I use RFC 7807?"**
→ API_CONVENTIONS.md + DESIGN_PATTERNS_PROGRESSIVE_EXAMPLE.md (Advanced)

**"What pattern should I use for X?"**
→ ARCHITECTURE.md ("Design Patterns" section of the corresponding level)

**"How is X pattern implemented?"**
→ ARCHITECTURE.md (Design Patterns) + DESIGN_PATTERNS_PROGRESSIVE_EXAMPLE.md

**"How do I scale my project?"**
→ ARCHITECTURE.md (Comparative Summary) + next level section

---

## Frequently Asked Questions

**Where do I start?**
→ GUIDE.md → README.md → Choose a Beginner project

**When do I move to Intermediate?**
→ When you finish 3 Beginner projects

**When do I implement RFC 7807?**
→ When you reach Advanced Level

**Can I skip levels?**
→ Not recommended, each level prepares for the next

**Should I use all the patterns?**
→ No, only use those that solve real problems

---

**Last updated:** 2026-01-02
**Version:** 1.0 Complete
**Maintainer:** David
