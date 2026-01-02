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

# Start PostgreSQL container if not running
echo "Setting up PostgreSQL..."
if ! docker ps -q -f name=nestjs-postgres | grep -q .; then
    if docker ps -aq -f name=nestjs-postgres | grep -q .; then
        echo "  Starting existing PostgreSQL container..."
        docker start nestjs-postgres
    else
        echo "  Creating new PostgreSQL container..."
        docker run -d \
            --name nestjs-postgres \
            -e POSTGRES_USER=postgres \
            -e POSTGRES_PASSWORD=postgres \
            -e POSTGRES_DB=nestjs_dev \
            -p 5432:5432 \
            postgres:17-alpine
    fi
else
    echo "  PostgreSQL already running"
fi

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 5

echo ""
echo "Development environment setup complete!"
echo ""
echo "Quick Start:"
echo "  - Create new project:  cd projects && nest new my-project"
echo "  - Claude Code:         claude"
echo ""
echo "PostgreSQL:"
echo "  - Host:      localhost"
echo "  - Port:      5432"
echo "  - User:      postgres"
echo "  - Password:  postgres"
echo "  - Database:  nestjs_dev"
echo ""
echo "Ports available:"
echo "  - 3000-3003: NestJS applications"
echo "  - 5432:      PostgreSQL"
echo "  - 5555:      Prisma Studio"
echo ""
