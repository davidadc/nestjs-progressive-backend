#!/bin/bash

# User Journey Tests for Task Management API
# Tests complete workflows for different user roles

BASE_URL="${API_URL:-http://localhost:3000/api/v1}"
CONTENT_TYPE="Content-Type: application/json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

print_step() {
    echo -e "${CYAN}  → $1${NC}"
}

test_result() {
    local name=$1
    local expected_status=$2
    local actual_status=$3

    TOTAL=$((TOTAL + 1))

    if [ "$actual_status" == "$expected_status" ]; then
        PASSED=$((PASSED + 1))
        echo -e "${GREEN}    ✓ $name${NC}"
        return 0
    else
        FAILED=$((FAILED + 1))
        echo -e "${RED}    ✗ $name (Expected: $expected_status, Got: $actual_status)${NC}"
        return 1
    fi
}

api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4

    local response=""

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

    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')

    echo "$http_code|$body"
}

extract_token() {
    echo "$1" | grep -o '"accessToken":"[^"]*"' | sed 's/"accessToken":"//;s/"//'
}

extract_id() {
    echo "$1" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"//'
}

print_header "Task Management API - User Journey Tests"
echo ""
echo -e "Testing against: $BASE_URL"

# ============================================
# JOURNEY 1: Admin - Full Project Lifecycle
# ============================================
print_header "JOURNEY 1: Admin - Full Project Lifecycle"
echo -e "${YELLOW}Scenario: Admin creates a project, adds members, creates tasks, and completes the project${NC}"

# Step 1: Register/Login as Admin
print_step "Step 1: Admin authentication"
ADMIN_EMAIL="journey_admin_$(date +%s)@example.com"
result=$(api_call POST "/auth/register" "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"Admin123!\",
    \"name\": \"Journey Admin\",
    \"role\": \"ADMIN\"
}" "")
http_code=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2)
test_result "Admin registration" "201" "$http_code"
ADMIN_TOKEN=$(extract_token "$body")

# Step 2: Create a project
print_step "Step 2: Create new project"
result=$(api_call POST "/projects" '{
    "name": "Journey Test Project",
    "description": "Testing full project lifecycle"
}' "$ADMIN_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2)
test_result "Create project" "201" "$http_code"
PROJECT_ID=$(extract_id "$body")

# Step 3: Create a team member
print_step "Step 3: Create team member"
MEMBER_EMAIL="journey_member_$(date +%s)@example.com"
result=$(api_call POST "/auth/register" "{
    \"email\": \"$MEMBER_EMAIL\",
    \"password\": \"Member123!\",
    \"name\": \"Journey Member\"
}" "")
http_code=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2)
test_result "Create team member" "201" "$http_code"
MEMBER_TOKEN=$(extract_token "$body")

# Get member ID
result=$(api_call GET "/users/me" "" "$MEMBER_TOKEN")
body=$(echo "$result" | cut -d'|' -f2)
MEMBER_ID=$(extract_id "$body")

# Step 4: Add member to project
print_step "Step 4: Add member to project"
result=$(api_call POST "/projects/$PROJECT_ID/members" "{\"userId\": \"$MEMBER_ID\"}" "$ADMIN_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
test_result "Add member to project" "201" "$http_code"

# Step 5: Create tasks
print_step "Step 5: Create tasks for the project"
result=$(api_call POST "/projects/$PROJECT_ID/tasks" "{
    \"title\": \"Setup development environment\",
    \"description\": \"Install dependencies and configure tools\",
    \"priority\": \"HIGH\",
    \"assignedToId\": \"$MEMBER_ID\"
}" "$ADMIN_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2)
test_result "Create task 1" "201" "$http_code"
TASK1_ID=$(extract_id "$body")

result=$(api_call POST "/projects/$PROJECT_ID/tasks" "{
    \"title\": \"Implement core features\",
    \"description\": \"Build the main functionality\",
    \"priority\": \"HIGH\"
}" "$ADMIN_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2)
test_result "Create task 2" "201" "$http_code"
TASK2_ID=$(extract_id "$body")

# Step 6: Progress tasks through workflow
print_step "Step 6: Progress tasks through workflow"
result=$(api_call PATCH "/tasks/$TASK1_ID/status" '{"status": "IN_PROGRESS"}' "$ADMIN_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
test_result "Task 1 → IN_PROGRESS" "200" "$http_code"

result=$(api_call PATCH "/tasks/$TASK1_ID/status" '{"status": "DONE"}' "$ADMIN_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
test_result "Task 1 → DONE" "200" "$http_code"

result=$(api_call PATCH "/tasks/$TASK2_ID/status" '{"status": "IN_PROGRESS"}' "$ADMIN_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
test_result "Task 2 → IN_PROGRESS" "200" "$http_code"

result=$(api_call PATCH "/tasks/$TASK2_ID/status" '{"status": "DONE"}' "$ADMIN_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
test_result "Task 2 → DONE" "200" "$http_code"

# Step 7: Verify project completion
print_step "Step 7: Verify all tasks completed"
result=$(api_call GET "/tasks?projectId=$PROJECT_ID&status=DONE" "" "$ADMIN_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
test_result "List completed tasks" "200" "$http_code"

# Step 8: Clean up - Delete project
print_step "Step 8: Archive/Delete project"
result=$(api_call DELETE "/projects/$PROJECT_ID" "" "$ADMIN_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
test_result "Delete project" "204" "$http_code"

# ============================================
# JOURNEY 2: Manager - Task Management Flow
# ============================================
print_header "JOURNEY 2: Manager - Task Management Flow"
echo -e "${YELLOW}Scenario: Manager views projects, creates tasks, assigns them, and tracks progress${NC}"

# Step 1: Register/Login as Manager
print_step "Step 1: Manager authentication"
MANAGER_EMAIL="journey_manager_$(date +%s)@example.com"
result=$(api_call POST "/auth/register" "{
    \"email\": \"$MANAGER_EMAIL\",
    \"password\": \"Manager123!\",
    \"name\": \"Journey Manager\",
    \"role\": \"MANAGER\"
}" "")
http_code=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2)
test_result "Manager registration" "201" "$http_code"
MANAGER_TOKEN=$(extract_token "$body")

# Get manager ID
result=$(api_call GET "/users/me" "" "$MANAGER_TOKEN")
body=$(echo "$result" | cut -d'|' -f2)
MANAGER_ID=$(extract_id "$body")

# Step 2: Admin creates project and adds manager
print_step "Step 2: Admin creates project with manager"
result=$(api_call POST "/projects" '{
    "name": "Manager Journey Project",
    "description": "Project for manager journey test"
}' "$ADMIN_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2)
test_result "Admin creates project" "201" "$http_code"
MGR_PROJECT_ID=$(extract_id "$body")

result=$(api_call POST "/projects/$MGR_PROJECT_ID/members" "{\"userId\": \"$MANAGER_ID\"}" "$ADMIN_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
test_result "Add manager to project" "201" "$http_code"

# Step 3: Manager views project
print_step "Step 3: Manager views assigned project"
result=$(api_call GET "/projects/$MGR_PROJECT_ID" "" "$MANAGER_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
test_result "Manager views project" "200" "$http_code"

# Step 4: Manager creates tasks
print_step "Step 4: Manager creates and assigns tasks"
result=$(api_call POST "/projects/$MGR_PROJECT_ID/tasks" '{
    "title": "Manager created task",
    "description": "Task created by manager",
    "priority": "MEDIUM"
}' "$MANAGER_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2)
test_result "Manager creates task" "201" "$http_code"
MGR_TASK_ID=$(extract_id "$body")

# Step 5: Manager updates task
print_step "Step 5: Manager updates task details"
result=$(api_call PATCH "/tasks/$MGR_TASK_ID" '{
    "title": "Updated by manager",
    "priority": "HIGH"
}' "$MANAGER_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
test_result "Manager updates task" "200" "$http_code"

# Step 6: Manager tracks progress
print_step "Step 6: Manager tracks task progress"
result=$(api_call GET "/tasks?projectId=$MGR_PROJECT_ID" "" "$MANAGER_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
test_result "Manager lists project tasks" "200" "$http_code"

# Cleanup
result=$(api_call DELETE "/projects/$MGR_PROJECT_ID" "" "$ADMIN_TOKEN")

# ============================================
# JOURNEY 3: User - Task Worker Flow
# ============================================
print_header "JOURNEY 3: User - Task Worker Flow"
echo -e "${YELLOW}Scenario: Regular user views assigned tasks, updates status, and adds comments${NC}"

# Step 1: Create project with user
print_step "Step 1: Setup - Admin creates project and adds user"
WORKER_EMAIL="journey_worker_$(date +%s)@example.com"
result=$(api_call POST "/auth/register" "{
    \"email\": \"$WORKER_EMAIL\",
    \"password\": \"Worker123!\",
    \"name\": \"Journey Worker\"
}" "")
http_code=$(echo "$result" | cut -d'|' -f1)
body=$(echo "$result" | cut -d'|' -f2)
test_result "Worker registration" "201" "$http_code"
WORKER_TOKEN=$(extract_token "$body")

result=$(api_call GET "/users/me" "" "$WORKER_TOKEN")
body=$(echo "$result" | cut -d'|' -f2)
WORKER_ID=$(extract_id "$body")

result=$(api_call POST "/projects" '{
    "name": "Worker Journey Project",
    "description": "Project for worker journey test"
}' "$ADMIN_TOKEN")
body=$(echo "$result" | cut -d'|' -f2)
WORKER_PROJECT_ID=$(extract_id "$body")

result=$(api_call POST "/projects/$WORKER_PROJECT_ID/members" "{\"userId\": \"$WORKER_ID\"}" "$ADMIN_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
test_result "Add worker to project" "201" "$http_code"

# Create task assigned to worker
result=$(api_call POST "/projects/$WORKER_PROJECT_ID/tasks" "{
    \"title\": \"Worker assigned task\",
    \"description\": \"Task for worker to complete\",
    \"priority\": \"MEDIUM\",
    \"assignedToId\": \"$WORKER_ID\"
}" "$ADMIN_TOKEN")
body=$(echo "$result" | cut -d'|' -f2)
WORKER_TASK_ID=$(extract_id "$body")

# Step 2: Worker views assigned tasks
print_step "Step 2: Worker views assigned tasks"
result=$(api_call GET "/tasks?assignedTo=me" "" "$WORKER_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
test_result "Worker views assigned tasks" "200" "$http_code"

# Step 3: Worker starts working on task
print_step "Step 3: Worker starts task"
result=$(api_call PATCH "/tasks/$WORKER_TASK_ID/status" '{"status": "IN_PROGRESS"}' "$WORKER_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
test_result "Worker starts task" "200" "$http_code"

# Step 4: Worker adds comment
print_step "Step 4: Worker adds progress comment"
result=$(api_call POST "/tasks/$WORKER_TASK_ID/comments" '{
    "content": "Started working on this task. Making good progress!"
}' "$WORKER_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
test_result "Worker adds comment" "201" "$http_code"

# Step 5: Worker completes task
print_step "Step 5: Worker completes task"
result=$(api_call PATCH "/tasks/$WORKER_TASK_ID/status" '{"status": "DONE"}' "$WORKER_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
test_result "Worker completes task" "200" "$http_code"

# Step 6: Worker adds completion comment
print_step "Step 6: Worker adds completion comment"
result=$(api_call POST "/tasks/$WORKER_TASK_ID/comments" '{
    "content": "Task completed successfully!"
}' "$WORKER_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
test_result "Worker adds completion comment" "201" "$http_code"

# Cleanup
result=$(api_call DELETE "/projects/$WORKER_PROJECT_ID" "" "$ADMIN_TOKEN")

# ============================================
# JOURNEY 4: Unauthorized Access Attempts
# ============================================
print_header "JOURNEY 4: Unauthorized Access Attempts"
echo -e "${YELLOW}Scenario: Verify RBAC enforcement prevents unauthorized actions${NC}"

# Setup: Create isolated project
print_step "Setup: Create isolated project"
result=$(api_call POST "/projects" '{
    "name": "RBAC Test Project",
    "description": "Testing access control"
}' "$ADMIN_TOKEN")
body=$(echo "$result" | cut -d'|' -f2)
RBAC_PROJECT_ID=$(extract_id "$body")

result=$(api_call POST "/projects/$RBAC_PROJECT_ID/tasks" '{
    "title": "RBAC Test Task",
    "priority": "LOW"
}' "$ADMIN_TOKEN")
body=$(echo "$result" | cut -d'|' -f2)
RBAC_TASK_ID=$(extract_id "$body")

# Create outsider user (not a member)
OUTSIDER_EMAIL="journey_outsider_$(date +%s)@example.com"
result=$(api_call POST "/auth/register" "{
    \"email\": \"$OUTSIDER_EMAIL\",
    \"password\": \"Outsider123!\",
    \"name\": \"Journey Outsider\"
}" "")
body=$(echo "$result" | cut -d'|' -f2)
OUTSIDER_TOKEN=$(extract_token "$body")

# Test 1: Regular user cannot create projects
print_step "Test 1: Regular user cannot create projects"
result=$(api_call POST "/projects" '{
    "name": "Unauthorized Project"
}' "$OUTSIDER_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
test_result "Regular user blocked from creating project" "403" "$http_code"

# Test 2: Non-member cannot access project
print_step "Test 2: Non-member cannot access project"
result=$(api_call GET "/projects/$RBAC_PROJECT_ID" "" "$OUTSIDER_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
test_result "Non-member blocked from viewing project" "403" "$http_code"

# Test 3: Non-member cannot view project tasks
print_step "Test 3: Non-member cannot view project task"
result=$(api_call GET "/tasks/$RBAC_TASK_ID" "" "$OUTSIDER_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
test_result "Non-member blocked from viewing task" "403" "$http_code"

# Test 4: Non-owner cannot add members
print_step "Test 4: Non-owner cannot add members"
# First add worker to project to make them a member
result=$(api_call POST "/projects/$RBAC_PROJECT_ID/members" "{\"userId\": \"$WORKER_ID\"}" "$ADMIN_TOKEN")
result=$(api_call POST "/projects/$RBAC_PROJECT_ID/members" "{\"userId\": \"$MANAGER_ID\"}" "$WORKER_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
test_result "Non-owner blocked from adding members" "403" "$http_code"

# Test 5: Non-owner cannot delete project
print_step "Test 5: Non-owner cannot delete project"
result=$(api_call DELETE "/projects/$RBAC_PROJECT_ID" "" "$WORKER_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
test_result "Non-owner blocked from deleting project" "403" "$http_code"

# Test 6: Regular user cannot create tasks
print_step "Test 6: Regular user cannot create tasks"
result=$(api_call POST "/projects/$RBAC_PROJECT_ID/tasks" '{
    "title": "Unauthorized Task"
}' "$WORKER_TOKEN")
http_code=$(echo "$result" | cut -d'|' -f1)
test_result "Regular user blocked from creating tasks" "403" "$http_code"

# Test 7: Unauthenticated access blocked
print_step "Test 7: Unauthenticated access blocked"
result=$(api_call GET "/projects" "" "")
http_code=$(echo "$result" | cut -d'|' -f1)
test_result "Unauthenticated request blocked" "401" "$http_code"

# Cleanup
result=$(api_call DELETE "/projects/$RBAC_PROJECT_ID" "" "$ADMIN_TOKEN")

# ============================================
# Test Summary
# ============================================
echo ""
print_header "Journey Test Summary"
echo ""
echo -e "  Total Tests: $TOTAL"
echo -e "  ${GREEN}Passed: $PASSED${NC}"
echo -e "  ${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All journey tests passed!${NC}"
    echo ""
    echo -e "Journeys tested:"
    echo -e "  1. Admin - Full project lifecycle"
    echo -e "  2. Manager - Task management flow"
    echo -e "  3. User - Task worker flow"
    echo -e "  4. Unauthorized access attempts"
    exit 0
else
    echo -e "${RED}Some journey tests failed. Please check the output above.${NC}"
    exit 1
fi
