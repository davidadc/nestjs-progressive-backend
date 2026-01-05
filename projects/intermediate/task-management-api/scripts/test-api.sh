#!/bin/bash

# API Test Script for Task Management API
# Tests all endpoints and validates responses

BASE_URL="${API_URL:-http://localhost:3000/api/v1}"
CONTENT_TYPE="Content-Type: application/json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0
TOTAL=0

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

test_result() {
    local name=$1
    local expected_status=$2
    local actual_status=$3
    local response=$4

    TOTAL=$((TOTAL + 1))

    if [ "$actual_status" == "$expected_status" ]; then
        PASSED=$((PASSED + 1))
        echo -e "${GREEN}  PASS${NC} - $name (HTTP $actual_status)"
    else
        FAILED=$((FAILED + 1))
        echo -e "${RED}  FAIL${NC} - $name (Expected: $expected_status, Got: $actual_status)"
        if [ -n "$response" ]; then
            echo -e "         Response: ${response:0:100}"
        fi
    fi
}

api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4

    local response=""
    local http_code=""

    if [ -n "$token" ]; then
        if [ -n "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
                -H "$CONTENT_TYPE" \
                -H "Authorization: Bearer $token" \
                -d "$data")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
                -H "$CONTENT_TYPE" \
                -H "Authorization: Bearer $token")
        fi
    else
        if [ -n "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
                -H "$CONTENT_TYPE" \
                -d "$data")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
                -H "$CONTENT_TYPE")
        fi
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    echo "$http_code|$body"
}

extract_token() {
    echo "$1" | grep -o '"accessToken":"[^"]*"' | sed 's/"accessToken":"//;s/"//'
}

extract_id() {
    echo "$1" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"//'
}

print_header "Task Management API Tests"
echo ""
echo -e "Testing against: $BASE_URL"
echo ""

# ============================================
# Health Check Tests
# ============================================
print_header "1. Health Check"

result=$(api_call GET "/health" "" "")
http_code=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2)
test_result "GET /health" "200" "$http_code" "$body"

# ============================================
# Authentication Tests
# ============================================
print_header "2. Authentication Tests"

# Register new user
RANDOM_EMAIL="testuser$(date +%s)@example.com"
result=$(api_call POST "/auth/register" "{
    \"email\": \"$RANDOM_EMAIL\",
    \"password\": \"Test123!\",
    \"name\": \"Test User\"
}" "")
http_code=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2)
test_result "POST /auth/register - Valid registration" "201" "$http_code" "$body"
TEST_TOKEN=$(extract_token "$body")

# Register with duplicate email
result=$(api_call POST "/auth/register" "{
    \"email\": \"$RANDOM_EMAIL\",
    \"password\": \"Test123!\",
    \"name\": \"Test User\"
}" "")
http_code=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2)
test_result "POST /auth/register - Duplicate email (409)" "409" "$http_code" "$body"

# Register with invalid email
result=$(api_call POST "/auth/register" '{
    "email": "invalid-email",
    "password": "Test123!",
    "name": "Test User"
}' "")
http_code=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2)
test_result "POST /auth/register - Invalid email (400)" "400" "$http_code" "$body"

# Login with valid credentials
result=$(api_call POST "/auth/login" "{
    \"email\": \"$RANDOM_EMAIL\",
    \"password\": \"Test123!\"
}" "")
http_code=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2)
test_result "POST /auth/login - Valid credentials" "200" "$http_code" "$body"

# Login with invalid credentials
result=$(api_call POST "/auth/login" '{
    "email": "nonexistent@example.com",
    "password": "wrong123"
}' "")
http_code=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2)
test_result "POST /auth/login - Invalid credentials (401)" "401" "$http_code" "$body"

# ============================================
# User Profile Tests
# ============================================
print_header "3. User Profile Tests"

# Get current user
result=$(api_call GET "/users/me" "" "$TEST_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2)
test_result "GET /users/me - Authenticated" "200" "$http_code" "$body"

# Get current user without token
result=$(api_call GET "/users/me" "" "")
http_code=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2)
test_result "GET /users/me - No token (401)" "401" "$http_code" "$body"

# Update current user
result=$(api_call PATCH "/users/me" '{
    "name": "Updated Name"
}' "$TEST_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2)
test_result "PATCH /users/me - Update name" "200" "$http_code" "$body"

# ============================================
# Login as Admin for further tests
# ============================================
print_header "4. Admin Authentication"

result=$(api_call POST "/auth/login" '{
    "email": "admin@example.com",
    "password": "Admin123!"
}' "")
http_code=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2)
ADMIN_TOKEN=$(extract_token "$body")

if [ -n "$ADMIN_TOKEN" ]; then
    echo -e "${GREEN}  Admin authenticated successfully${NC}"
else
    # Register admin if not exists
    result=$(api_call POST "/auth/register" '{
        "email": "admin@example.com",
        "password": "Admin123!",
        "name": "Admin User",
        "role": "ADMIN"
    }' "")
    body=$(echo "$result" | cut -d'|' -f2)
    ADMIN_TOKEN=$(extract_token "$body")
    if [ -n "$ADMIN_TOKEN" ]; then
        echo -e "${GREEN}  Admin registered and authenticated${NC}"
    else
        echo -e "${YELLOW}  Warning: Admin authentication failed, some tests may fail${NC}"
    fi
fi

# ============================================
# Project Tests
# ============================================
print_header "5. Project Tests"

# Create project (Admin only)
result=$(api_call POST "/projects" '{
    "name": "Test Project",
    "description": "A test project for API testing"
}' "$ADMIN_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2)
test_result "POST /projects - Create project (Admin)" "201" "$http_code" "$body"
PROJECT_ID=$(extract_id "$body")

# Create project as regular user (should fail with 403)
result=$(api_call POST "/projects" '{
    "name": "Unauthorized Project",
    "description": "This should fail"
}' "$TEST_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2)
test_result "POST /projects - Create project (Regular user, 403)" "403" "$http_code" "$body"

# List projects
result=$(api_call GET "/projects" "" "$ADMIN_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2)
test_result "GET /projects - List projects" "200" "$http_code" "$body"

# Get project by ID
if [ -n "$PROJECT_ID" ]; then
    result=$(api_call GET "/projects/$PROJECT_ID" "" "$ADMIN_TOKEN")
    http_code=$(echo "$result" | cut -d'|' -f1)
    body=$(echo "$result" | cut -d'|' -f2)
    test_result "GET /projects/:id - Get project" "200" "$http_code" "$body"
fi

# Update project
if [ -n "$PROJECT_ID" ]; then
    result=$(api_call PATCH "/projects/$PROJECT_ID" '{
        "name": "Updated Test Project"
    }' "$ADMIN_TOKEN")
    http_code=$(echo "$result" | cut -d'|' -f1)
    body=$(echo "$result" | cut -d'|' -f2)
    test_result "PATCH /projects/:id - Update project" "200" "$http_code" "$body"
fi

# Get non-existent project
result=$(api_call GET "/projects/00000000-0000-0000-0000-000000000000" "" "$ADMIN_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2)
test_result "GET /projects/:id - Not found (404)" "404" "$http_code" "$body"

# ============================================
# Task Tests
# ============================================
print_header "6. Task Tests"

# Create task in project
if [ -n "$PROJECT_ID" ]; then
    result=$(api_call POST "/projects/$PROJECT_ID/tasks" '{
        "title": "Test Task",
        "description": "A test task",
        "priority": "HIGH"
    }' "$ADMIN_TOKEN")
    http_code=$(echo "$result" | cut -d'|' -f1)
    body=$(echo "$result" | cut -d'|' -f2)
    test_result "POST /projects/:id/tasks - Create task" "201" "$http_code" "$body"
    TASK_ID=$(extract_id "$body")
fi

# List tasks
result=$(api_call GET "/tasks" "" "$ADMIN_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2)
test_result "GET /tasks - List tasks" "200" "$http_code" "$body"

# List tasks with filters
result=$(api_call GET "/tasks?status=TODO&priority=HIGH" "" "$ADMIN_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2)
test_result "GET /tasks?status=TODO&priority=HIGH - Filtered tasks" "200" "$http_code" "$body"

# Get task by ID
if [ -n "$TASK_ID" ]; then
    result=$(api_call GET "/tasks/$TASK_ID" "" "$ADMIN_TOKEN")
    http_code=$(echo "$result" | cut -d'|' -f1)
    body=$(echo "$result" | cut -d'|' -f2)
    test_result "GET /tasks/:id - Get task" "200" "$http_code" "$body"
fi

# Update task
if [ -n "$TASK_ID" ]; then
    result=$(api_call PATCH "/tasks/$TASK_ID" '{
        "title": "Updated Test Task",
        "priority": "MEDIUM"
    }' "$ADMIN_TOKEN")
    http_code=$(echo "$result" | cut -d'|' -f1)
    body=$(echo "$result" | cut -d'|' -f2)
    test_result "PATCH /tasks/:id - Update task" "200" "$http_code" "$body"
fi

# Update task status
if [ -n "$TASK_ID" ]; then
    result=$(api_call PATCH "/tasks/$TASK_ID/status" '{
        "status": "IN_PROGRESS"
    }' "$ADMIN_TOKEN")
    http_code=$(echo "$result" | cut -d'|' -f1)
    body=$(echo "$result" | cut -d'|' -f2)
    test_result "PATCH /tasks/:id/status - Update status" "200" "$http_code" "$body"
fi

# ============================================
# Comment Tests
# ============================================
print_header "7. Comment Tests"

# Add comment to task
if [ -n "$TASK_ID" ]; then
    result=$(api_call POST "/tasks/$TASK_ID/comments" '{
        "content": "This is a test comment"
    }' "$ADMIN_TOKEN")
    http_code=$(echo "$result" | cut -d'|' -f1)
    body=$(echo "$result" | cut -d'|' -f2)
    test_result "POST /tasks/:id/comments - Add comment" "201" "$http_code" "$body"
fi

# List comments for task
if [ -n "$TASK_ID" ]; then
    result=$(api_call GET "/tasks/$TASK_ID/comments" "" "$ADMIN_TOKEN")
    http_code=$(echo "$result" | cut -d'|' -f1)
    body=$(echo "$result" | cut -d'|' -f2)
    test_result "GET /tasks/:id/comments - List comments" "200" "$http_code" "$body"
fi

# ============================================
# Cleanup Tests
# ============================================
print_header "8. Cleanup Tests"

# Delete task
if [ -n "$TASK_ID" ]; then
    result=$(api_call DELETE "/tasks/$TASK_ID" "" "$ADMIN_TOKEN")
    http_code=$(echo "$result" | cut -d'|' -f1)
    body=$(echo "$result" | cut -d'|' -f2)
    test_result "DELETE /tasks/:id - Delete task" "204" "$http_code" "$body"
fi

# Delete project
if [ -n "$PROJECT_ID" ]; then
    result=$(api_call DELETE "/projects/$PROJECT_ID" "" "$ADMIN_TOKEN")
    http_code=$(echo "$result" | cut -d'|' -f1)
    body=$(echo "$result" | cut -d'|' -f2)
    test_result "DELETE /projects/:id - Delete project" "204" "$http_code" "$body"
fi

# ============================================
# Test Summary
# ============================================
echo ""
print_header "Test Summary"
echo ""
echo -e "  Total Tests: $TOTAL"
echo -e "  ${GREEN}Passed: $PASSED${NC}"
echo -e "  ${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please check the output above.${NC}"
    exit 1
fi
