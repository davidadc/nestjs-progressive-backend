#!/bin/bash
set -e

# Get the workspace folder
WORKSPACE_FOLDER="${WORKSPACE_FOLDER:-${containerWorkspaceFolder}}"

echo "=== NestJS Projects Development Environment Setup ==="
echo "WORKSPACE_FOLDER: $WORKSPACE_FOLDER"
echo ""

# Ensure we're in the workspace directory
cd "$WORKSPACE_FOLDER"

# Install pnpm
echo "Installing pnpm..."
npm install -g pnpm@latest

# Install NestJS CLI globally
echo "Installing NestJS CLI..."
npm install -g @nestjs/cli

# Install Claude Code CLI
echo "Installing Claude Code..."
npm install -g @anthropic-ai/claude-code

# Initialize git if not already a git repo
if [ ! -d ".git" ]; then
    echo "Initializing git repository..."
    git init
fi

# Create projects directory if it doesn't exist
if [ ! -d "projects" ]; then
    echo "Creating projects directory..."
    mkdir -p projects
fi

# Start all services via docker-compose
echo "Starting services via docker-compose..."
docker-compose up -d

# Wait for PostgreSQL to be healthy
echo "Waiting for PostgreSQL to be ready..."
until docker exec nestjs-postgres pg_isready -U admin -d postgres > /dev/null 2>&1; do
    echo "  Waiting for PostgreSQL..."
    sleep 2
done
echo "  PostgreSQL is ready!"

echo ""
echo "Development environment setup complete!"
echo ""
echo "Quick Start:"
echo "  - Create new project:  cd projects && nest new my-project"
echo "  - Claude Code:         claude"
echo ""
echo "Services running:"
echo "  - PostgreSQL:        localhost:5432 (admin/admin, postgres)"
echo "  - Redis:             localhost:6379"
echo "  - pgAdmin:           http://localhost:5050 (admin@example.com/admin)"
echo "  - MailHog:           http://localhost:8025"
echo "  - Redis Commander:   http://localhost:8081"
echo ""
echo "Ports available:"
echo "  - 3000:      NestJS application"
echo "  - 5432:      PostgreSQL"
echo "  - 5555:      Prisma Studio"
echo "  - 6379:      Redis"
echo "  - 5050:      pgAdmin"
echo "  - 8025:      MailHog UI"
echo "  - 8081:      Redis Commander"
echo ""
