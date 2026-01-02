# DevContainer Configuration

Devcontainer setup for NestJS monorepo projects using Microsoft's base Debian image.

## Quick Start

### VS Code / Cursor

1. Open: `code .` or `cursor .`
2. Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
3. Select: "Dev Containers: Reopen in Container"
4. Wait for setup (~5-10 minutes first time)

### DevPod

```bash
devpod up <repo-url>
devpod ide <repo-url>
```

## What's Included

- **Base Image:** `mcr.microsoft.com/devcontainers/base:debian`
- **User:** `vscode` (Microsoft's default)
- **Tools:**
  - Node.js LTS
  - pnpm (latest)
  - NestJS CLI
  - Claude Code CLI
  - Docker-in-Docker (for PostgreSQL)
  - Git

## Services

PostgreSQL 17 runs in a Docker container (via Docker-in-Docker):

```
Host:     localhost
Port:     5432
User:     postgres
Password: postgres
Database: nestjs_dev
```

## Ports

| Port | Service       |
|------|---------------|
| 3000 | App 1         |
| 3001 | App 2         |
| 3002 | App 3         |
| 3003 | App 4         |
| 5432 | PostgreSQL    |
| 5555 | Prisma Studio |

## Development

```bash
# Create a new NestJS project
cd projects
nest new my-project

# Run a project
cd projects/my-project
pnpm run start:dev

# Prisma Studio (if using Prisma)
pnpm run prisma studio

# Claude Code
claude
```

## Project Structure

```
nestjs-projects/
├── .devcontainer/
│   ├── devcontainer.json
│   ├── post-create.sh
│   └── README.md
├── projects/
│   ├── project-1/
│   ├── project-2/
│   └── ...
└── README.md
```
