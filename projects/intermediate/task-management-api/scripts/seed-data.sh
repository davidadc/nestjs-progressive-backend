#!/bin/bash

# Seed Data Script for Task Management API
# This script populates the database with test data

BASE_URL="${API_URL:-http://localhost:3000/api/v1}"
CONTENT_TYPE="Content-Type: application/json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Task Management API - Seed Data      ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Helper function for API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4

    if [ -n "$token" ]; then
        curl -s -X "$method" "$BASE_URL$endpoint" \
            -H "$CONTENT_TYPE" \
            -H "Authorization: Bearer $token" \
            -d "$data"
    else
        curl -s -X "$method" "$BASE_URL$endpoint" \
            -H "$CONTENT_TYPE" \
            -d "$data"
    fi
}

extract_token() {
    echo "$1" | grep -o '"accessToken":"[^"]*"' | sed 's/"accessToken":"//;s/"//'
}

extract_id() {
    echo "$1" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"//'
}

# Register Admin User
echo -e "${YELLOW}1. Registering Admin User...${NC}"
ADMIN_RESPONSE=$(api_call POST "/auth/register" '{
    "email": "admin@example.com",
    "password": "Admin123!",
    "name": "Admin User",
    "role": "ADMIN"
}')
ADMIN_TOKEN=$(extract_token "$ADMIN_RESPONSE")
if [ -n "$ADMIN_TOKEN" ]; then
    echo -e "${GREEN}   Admin registered successfully${NC}"
else
    # Try login if already exists
    ADMIN_RESPONSE=$(api_call POST "/auth/login" '{
        "email": "admin@example.com",
        "password": "Admin123!"
    }')
    ADMIN_TOKEN=$(extract_token "$ADMIN_RESPONSE")
    if [ -n "$ADMIN_TOKEN" ]; then
        echo -e "${GREEN}   Admin logged in successfully${NC}"
    else
        echo -e "${RED}   Failed to authenticate admin${NC}"
        exit 1
    fi
fi

# Register Manager User
echo -e "${YELLOW}2. Registering Manager User...${NC}"
MANAGER_RESPONSE=$(api_call POST "/auth/register" '{
    "email": "manager@example.com",
    "password": "Manager123!",
    "name": "Manager User",
    "role": "MANAGER"
}')
MANAGER_TOKEN=$(extract_token "$MANAGER_RESPONSE")
if [ -n "$MANAGER_TOKEN" ]; then
    echo -e "${GREEN}   Manager registered successfully${NC}"
else
    MANAGER_RESPONSE=$(api_call POST "/auth/login" '{
        "email": "manager@example.com",
        "password": "Manager123!"
    }')
    MANAGER_TOKEN=$(extract_token "$MANAGER_RESPONSE")
    if [ -n "$MANAGER_TOKEN" ]; then
        echo -e "${GREEN}   Manager logged in successfully${NC}"
    else
        echo -e "${RED}   Failed to authenticate manager${NC}"
    fi
fi

# Register Regular User 1
echo -e "${YELLOW}3. Registering Regular User 1...${NC}"
USER1_RESPONSE=$(api_call POST "/auth/register" '{
    "email": "user1@example.com",
    "password": "User123!",
    "name": "John Doe"
}')
USER1_TOKEN=$(extract_token "$USER1_RESPONSE")
if [ -n "$USER1_TOKEN" ]; then
    echo -e "${GREEN}   User 1 registered successfully${NC}"
else
    USER1_RESPONSE=$(api_call POST "/auth/login" '{
        "email": "user1@example.com",
        "password": "User123!"
    }')
    USER1_TOKEN=$(extract_token "$USER1_RESPONSE")
    if [ -n "$USER1_TOKEN" ]; then
        echo -e "${GREEN}   User 1 logged in successfully${NC}"
    fi
fi

# Register Regular User 2
echo -e "${YELLOW}4. Registering Regular User 2...${NC}"
USER2_RESPONSE=$(api_call POST "/auth/register" '{
    "email": "user2@example.com",
    "password": "User123!",
    "name": "Jane Smith"
}')
USER2_TOKEN=$(extract_token "$USER2_RESPONSE")
if [ -n "$USER2_TOKEN" ]; then
    echo -e "${GREEN}   User 2 registered successfully${NC}"
else
    USER2_RESPONSE=$(api_call POST "/auth/login" '{
        "email": "user2@example.com",
        "password": "User123!"
    }')
    USER2_TOKEN=$(extract_token "$USER2_RESPONSE")
    if [ -n "$USER2_TOKEN" ]; then
        echo -e "${GREEN}   User 2 logged in successfully${NC}"
    fi
fi

# Get user IDs
echo -e "${YELLOW}5. Getting user IDs...${NC}"
USERS_RESPONSE=$(api_call GET "/users" "" "$ADMIN_TOKEN")
MANAGER_ID=$(echo "$USERS_RESPONSE" | grep -o '"id":"[^"]*","email":"manager@example.com"' | grep -o '"id":"[^"]*"' | sed 's/"id":"//;s/"//')
USER1_ID=$(echo "$USERS_RESPONSE" | grep -o '"id":"[^"]*","email":"user1@example.com"' | grep -o '"id":"[^"]*"' | sed 's/"id":"//;s/"//')
USER2_ID=$(echo "$USERS_RESPONSE" | grep -o '"id":"[^"]*","email":"user2@example.com"' | grep -o '"id":"[^"]*"' | sed 's/"id":"//;s/"//')
echo -e "${GREEN}   User IDs retrieved${NC}"

# Create Project 1
echo -e "${YELLOW}6. Creating Project 1 (Q1 Development)...${NC}"
PROJECT1_RESPONSE=$(api_call POST "/projects" '{
    "name": "Q1 Development",
    "description": "First quarter development tasks and features"
}' "$ADMIN_TOKEN")
PROJECT1_ID=$(extract_id "$PROJECT1_RESPONSE")
if [ -n "$PROJECT1_ID" ]; then
    echo -e "${GREEN}   Project 1 created: $PROJECT1_ID${NC}"
else
    echo -e "${RED}   Failed to create Project 1${NC}"
fi

# Create Project 2
echo -e "${YELLOW}7. Creating Project 2 (Marketing Campaign)...${NC}"
PROJECT2_RESPONSE=$(api_call POST "/projects" '{
    "name": "Marketing Campaign",
    "description": "Marketing initiatives and content creation"
}' "$ADMIN_TOKEN")
PROJECT2_ID=$(extract_id "$PROJECT2_RESPONSE")
if [ -n "$PROJECT2_ID" ]; then
    echo -e "${GREEN}   Project 2 created: $PROJECT2_ID${NC}"
else
    echo -e "${RED}   Failed to create Project 2${NC}"
fi

# Add members to Project 1
echo -e "${YELLOW}8. Adding members to Project 1...${NC}"
if [ -n "$MANAGER_ID" ]; then
    api_call POST "/projects/$PROJECT1_ID/members" "{\"userId\": \"$MANAGER_ID\"}" "$ADMIN_TOKEN" > /dev/null
    echo -e "${GREEN}   Added Manager to Project 1${NC}"
fi
if [ -n "$USER1_ID" ]; then
    api_call POST "/projects/$PROJECT1_ID/members" "{\"userId\": \"$USER1_ID\"}" "$ADMIN_TOKEN" > /dev/null
    echo -e "${GREEN}   Added User 1 to Project 1${NC}"
fi

# Add members to Project 2
echo -e "${YELLOW}9. Adding members to Project 2...${NC}"
if [ -n "$USER1_ID" ]; then
    api_call POST "/projects/$PROJECT2_ID/members" "{\"userId\": \"$USER1_ID\"}" "$ADMIN_TOKEN" > /dev/null
    echo -e "${GREEN}   Added User 1 to Project 2${NC}"
fi
if [ -n "$USER2_ID" ]; then
    api_call POST "/projects/$PROJECT2_ID/members" "{\"userId\": \"$USER2_ID\"}" "$ADMIN_TOKEN" > /dev/null
    echo -e "${GREEN}   Added User 2 to Project 2${NC}"
fi

# Create Tasks for Project 1
echo -e "${YELLOW}10. Creating tasks for Project 1...${NC}"

# Task 1 - TODO, HIGH
TASK1_RESPONSE=$(api_call POST "/projects/$PROJECT1_ID/tasks" "{
    \"title\": \"Implement user authentication\",
    \"description\": \"Add JWT-based authentication with refresh tokens\",
    \"priority\": \"HIGH\",
    \"assignedToId\": \"$USER1_ID\",
    \"dueDate\": \"2026-01-15T00:00:00Z\"
}" "$ADMIN_TOKEN")
TASK1_ID=$(extract_id "$TASK1_RESPONSE")
echo -e "${GREEN}   Created task: Implement user authentication${NC}"

# Task 2 - IN_PROGRESS, MEDIUM
TASK2_RESPONSE=$(api_call POST "/projects/$PROJECT1_ID/tasks" "{
    \"title\": \"Design database schema\",
    \"description\": \"Create ERD and implement Prisma models\",
    \"priority\": \"MEDIUM\",
    \"assignedToId\": \"$MANAGER_ID\",
    \"dueDate\": \"2026-01-10T00:00:00Z\"
}" "$ADMIN_TOKEN")
TASK2_ID=$(extract_id "$TASK2_RESPONSE")
api_call PATCH "/tasks/$TASK2_ID/status" '{"status": "IN_PROGRESS"}' "$ADMIN_TOKEN" > /dev/null
echo -e "${GREEN}   Created task: Design database schema (IN_PROGRESS)${NC}"

# Task 3 - DONE, LOW
TASK3_RESPONSE=$(api_call POST "/projects/$PROJECT1_ID/tasks" "{
    \"title\": \"Setup project structure\",
    \"description\": \"Initialize NestJS project with proper folder structure\",
    \"priority\": \"LOW\",
    \"dueDate\": \"2026-01-05T00:00:00Z\"
}" "$ADMIN_TOKEN")
TASK3_ID=$(extract_id "$TASK3_RESPONSE")
api_call PATCH "/tasks/$TASK3_ID/status" '{"status": "DONE"}' "$ADMIN_TOKEN" > /dev/null
echo -e "${GREEN}   Created task: Setup project structure (DONE)${NC}"

# Create Tasks for Project 2
echo -e "${YELLOW}11. Creating tasks for Project 2...${NC}"

# Task 4 - TODO, MEDIUM
TASK4_RESPONSE=$(api_call POST "/projects/$PROJECT2_ID/tasks" "{
    \"title\": \"Write blog posts\",
    \"description\": \"Create 5 blog posts for the product launch\",
    \"priority\": \"MEDIUM\",
    \"assignedToId\": \"$USER2_ID\",
    \"dueDate\": \"2026-01-20T00:00:00Z\"
}" "$ADMIN_TOKEN")
TASK4_ID=$(extract_id "$TASK4_RESPONSE")
echo -e "${GREEN}   Created task: Write blog posts${NC}"

# Task 5 - TODO, HIGH
TASK5_RESPONSE=$(api_call POST "/projects/$PROJECT2_ID/tasks" "{
    \"title\": \"Design social media graphics\",
    \"description\": \"Create graphics for Instagram, Twitter, and LinkedIn\",
    \"priority\": \"HIGH\",
    \"assignedToId\": \"$USER1_ID\",
    \"dueDate\": \"2026-01-12T00:00:00Z\"
}" "$ADMIN_TOKEN")
TASK5_ID=$(extract_id "$TASK5_RESPONSE")
echo -e "${GREEN}   Created task: Design social media graphics${NC}"

# Add comments to tasks
echo -e "${YELLOW}12. Adding comments to tasks...${NC}"
if [ -n "$TASK1_ID" ]; then
    api_call POST "/tasks/$TASK1_ID/comments" '{"content": "Started working on this. Will update soon."}' "$USER1_TOKEN" > /dev/null
    api_call POST "/tasks/$TASK1_ID/comments" '{"content": "Make sure to include password reset functionality."}' "$ADMIN_TOKEN" > /dev/null
    echo -e "${GREEN}   Added comments to authentication task${NC}"
fi

if [ -n "$TASK2_ID" ]; then
    api_call POST "/tasks/$TASK2_ID/comments" '{"content": "Database design is 80% complete."}' "$MANAGER_TOKEN" > /dev/null
    echo -e "${GREEN}   Added comment to database schema task${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}  Seed Data Complete!                  ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Created:"
echo -e "  - 4 Users (admin, manager, user1, user2)"
echo -e "  - 2 Projects with members"
echo -e "  - 5 Tasks with various statuses and priorities"
echo -e "  - 3 Comments"
echo ""
echo -e "Test Credentials:"
echo -e "  Admin:   admin@example.com / Admin123!"
echo -e "  Manager: manager@example.com / Manager123!"
echo -e "  User 1:  user1@example.com / User123!"
echo -e "  User 2:  user2@example.com / User123!"
echo ""
