#!/bin/bash

# Chat App - API Integration Test Script
# This script tests all API endpoints

set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"
API_URL="$BASE_URL/api/v1"

echo "========================================"
echo "  Chat App - API Integration Tests"
echo "========================================"
echo ""
echo "Base URL: $BASE_URL"
echo ""

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

# Test user data
TEST_EMAIL="testuser_$(date +%s)@example.com"
TEST_NAME="Test User"
TEST_PASSWORD="testpassword123"
TEST_TOKEN=""
TEST_USER_ID=""

# Second user for conversations
TEST_EMAIL2="testuser2_$(date +%s)@example.com"
TEST_NAME2="Test User 2"
TEST_TOKEN2=""
TEST_USER_ID2=""

# Conversation ID for testing
TEST_CONVERSATION_ID=""

# Function to run a test
run_test() {
    local name=$1
    local expected_status=$2
    local method=$3
    local endpoint=$4
    local data=$5
    local token=$6

    TOTAL=$((TOTAL + 1))
    echo -n "  [$TOTAL] $name... "

    local headers="-H 'Content-Type: application/json'"
    if [ -n "$token" ]; then
        headers="$headers -H 'Authorization: Bearer $token'"
    fi

    local response
    local http_code

    if [ -n "$data" ]; then
        response=$(eval "curl -s -w '\n%{http_code}' -X $method '$API_URL$endpoint' $headers -d '$data'")
    else
        response=$(eval "curl -s -w '\n%{http_code}' -X $method '$API_URL$endpoint' $headers")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "$expected_status" ]; then
        PASSED=$((PASSED + 1))
        echo -e "${GREEN}PASSED${NC} (HTTP $http_code)"
        echo "$body"
        return 0
    else
        FAILED=$((FAILED + 1))
        echo -e "${RED}FAILED${NC} (Expected: $expected_status, Got: $http_code)"
        echo "  Response: $body"
        return 1
    fi
}

# Function to extract value from JSON
extract_json() {
    local json=$1
    local key=$2
    echo "$json" | grep -o "\"$key\":\"[^\"]*\"" | head -1 | cut -d'"' -f4
}

echo ""
echo -e "${BLUE}=== Authentication Tests ===${NC}"
echo ""

# Test: Register user 1
echo -n "  [1] Register User 1... "
TOTAL=$((TOTAL + 1))
RESPONSE=$(curl -s -w '\n%{http_code}' -X POST "$API_URL/auth/register" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$TEST_EMAIL\",\"name\":\"$TEST_NAME\",\"password\":\"$TEST_PASSWORD\"}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
    PASSED=$((PASSED + 1))
    TEST_USER_ID=$(extract_json "$BODY" "id")
    echo -e "${GREEN}PASSED${NC} (HTTP $HTTP_CODE, ID: $TEST_USER_ID)"
else
    FAILED=$((FAILED + 1))
    echo -e "${RED}FAILED${NC} (HTTP $HTTP_CODE)"
fi

# Test: Register user 2
echo -n "  [2] Register User 2... "
TOTAL=$((TOTAL + 1))
RESPONSE=$(curl -s -w '\n%{http_code}' -X POST "$API_URL/auth/register" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$TEST_EMAIL2\",\"name\":\"$TEST_NAME2\",\"password\":\"$TEST_PASSWORD\"}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
    PASSED=$((PASSED + 1))
    TEST_USER_ID2=$(extract_json "$BODY" "id")
    echo -e "${GREEN}PASSED${NC} (HTTP $HTTP_CODE, ID: $TEST_USER_ID2)"
else
    FAILED=$((FAILED + 1))
    echo -e "${RED}FAILED${NC} (HTTP $HTTP_CODE)"
fi

# Test: Register duplicate email (should fail)
echo -n "  [3] Register Duplicate Email (expect 409)... "
TOTAL=$((TOTAL + 1))
RESPONSE=$(curl -s -w '\n%{http_code}' -X POST "$API_URL/auth/register" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$TEST_EMAIL\",\"name\":\"$TEST_NAME\",\"password\":\"$TEST_PASSWORD\"}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "409" ]; then
    PASSED=$((PASSED + 1))
    echo -e "${GREEN}PASSED${NC} (HTTP $HTTP_CODE)"
else
    FAILED=$((FAILED + 1))
    echo -e "${RED}FAILED${NC} (Expected: 409, Got: $HTTP_CODE)"
fi

# Test: Login user 1
echo -n "  [4] Login User 1... "
TOTAL=$((TOTAL + 1))
RESPONSE=$(curl -s -w '\n%{http_code}' -X POST "$API_URL/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    PASSED=$((PASSED + 1))
    TEST_TOKEN=$(extract_json "$BODY" "accessToken")
    echo -e "${GREEN}PASSED${NC} (HTTP $HTTP_CODE, Got token)"
else
    FAILED=$((FAILED + 1))
    echo -e "${RED}FAILED${NC} (HTTP $HTTP_CODE)"
fi

# Test: Login user 2
echo -n "  [5] Login User 2... "
TOTAL=$((TOTAL + 1))
RESPONSE=$(curl -s -w '\n%{http_code}' -X POST "$API_URL/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$TEST_EMAIL2\",\"password\":\"$TEST_PASSWORD\"}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    PASSED=$((PASSED + 1))
    TEST_TOKEN2=$(extract_json "$BODY" "accessToken")
    echo -e "${GREEN}PASSED${NC} (HTTP $HTTP_CODE, Got token)"
else
    FAILED=$((FAILED + 1))
    echo -e "${RED}FAILED${NC} (HTTP $HTTP_CODE)"
fi

# Test: Login invalid credentials
echo -n "  [6] Login Invalid Credentials (expect 401)... "
TOTAL=$((TOTAL + 1))
RESPONSE=$(curl -s -w '\n%{http_code}' -X POST "$API_URL/auth/login" \
    -H 'Content-Type: application/json' \
    -d '{"email":"wrong@example.com","password":"wrongpassword"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "401" ]; then
    PASSED=$((PASSED + 1))
    echo -e "${GREEN}PASSED${NC} (HTTP $HTTP_CODE)"
else
    FAILED=$((FAILED + 1))
    echo -e "${RED}FAILED${NC} (Expected: 401, Got: $HTTP_CODE)"
fi

echo ""
echo -e "${BLUE}=== Conversation Tests ===${NC}"
echo ""

# Test: Create conversation without auth (should fail)
echo -n "  [7] Create Conversation Without Auth (expect 401)... "
TOTAL=$((TOTAL + 1))
RESPONSE=$(curl -s -w '\n%{http_code}' -X POST "$API_URL/conversations" \
    -H 'Content-Type: application/json' \
    -d "{\"participantIds\":[\"$TEST_USER_ID2\"]}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "401" ]; then
    PASSED=$((PASSED + 1))
    echo -e "${GREEN}PASSED${NC} (HTTP $HTTP_CODE)"
else
    FAILED=$((FAILED + 1))
    echo -e "${RED}FAILED${NC} (Expected: 401, Got: $HTTP_CODE)"
fi

# Test: Create conversation
echo -n "  [8] Create Conversation... "
TOTAL=$((TOTAL + 1))
RESPONSE=$(curl -s -w '\n%{http_code}' -X POST "$API_URL/conversations" \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $TEST_TOKEN" \
    -d "{\"participantIds\":[\"$TEST_USER_ID2\"]}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
    PASSED=$((PASSED + 1))
    TEST_CONVERSATION_ID=$(extract_json "$BODY" "id")
    echo -e "${GREEN}PASSED${NC} (HTTP $HTTP_CODE, ID: $TEST_CONVERSATION_ID)"
else
    FAILED=$((FAILED + 1))
    echo -e "${RED}FAILED${NC} (HTTP $HTTP_CODE)"
    echo "  Response: $BODY"
fi

# Test: Get conversations
echo -n "  [9] Get User Conversations... "
TOTAL=$((TOTAL + 1))
RESPONSE=$(curl -s -w '\n%{http_code}' -X GET "$API_URL/conversations" \
    -H "Authorization: Bearer $TEST_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    PASSED=$((PASSED + 1))
    echo -e "${GREEN}PASSED${NC} (HTTP $HTTP_CODE)"
else
    FAILED=$((FAILED + 1))
    echo -e "${RED}FAILED${NC} (HTTP $HTTP_CODE)"
fi

# Test: Get conversation by ID
echo -n "  [10] Get Conversation By ID... "
TOTAL=$((TOTAL + 1))
RESPONSE=$(curl -s -w '\n%{http_code}' -X GET "$API_URL/conversations/$TEST_CONVERSATION_ID" \
    -H "Authorization: Bearer $TEST_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    PASSED=$((PASSED + 1))
    echo -e "${GREEN}PASSED${NC} (HTTP $HTTP_CODE)"
else
    FAILED=$((FAILED + 1))
    echo -e "${RED}FAILED${NC} (HTTP $HTTP_CODE)"
fi

# Test: Get non-existent conversation
echo -n "  [11] Get Non-Existent Conversation (expect 404)... "
TOTAL=$((TOTAL + 1))
RESPONSE=$(curl -s -w '\n%{http_code}' -X GET "$API_URL/conversations/00000000-0000-0000-0000-000000000000" \
    -H "Authorization: Bearer $TEST_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "404" ]; then
    PASSED=$((PASSED + 1))
    echo -e "${GREEN}PASSED${NC} (HTTP $HTTP_CODE)"
else
    FAILED=$((FAILED + 1))
    echo -e "${RED}FAILED${NC} (Expected: 404, Got: $HTTP_CODE)"
fi

echo ""
echo -e "${BLUE}=== Message Tests ===${NC}"
echo ""

# Test: Send message
echo -n "  [12] Send Message... "
TOTAL=$((TOTAL + 1))
RESPONSE=$(curl -s -w '\n%{http_code}' -X POST "$API_URL/conversations/$TEST_CONVERSATION_ID/messages" \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $TEST_TOKEN" \
    -d '{"content":"Hello, this is a test message!"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "201" ]; then
    PASSED=$((PASSED + 1))
    echo -e "${GREEN}PASSED${NC} (HTTP $HTTP_CODE)"
else
    FAILED=$((FAILED + 1))
    echo -e "${RED}FAILED${NC} (HTTP $HTTP_CODE)"
fi

# Test: Send message from user 2
echo -n "  [13] Send Message From User 2... "
TOTAL=$((TOTAL + 1))
RESPONSE=$(curl -s -w '\n%{http_code}' -X POST "$API_URL/conversations/$TEST_CONVERSATION_ID/messages" \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $TEST_TOKEN2" \
    -d '{"content":"Hello back! Got your message."}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "201" ]; then
    PASSED=$((PASSED + 1))
    echo -e "${GREEN}PASSED${NC} (HTTP $HTTP_CODE)"
else
    FAILED=$((FAILED + 1))
    echo -e "${RED}FAILED${NC} (HTTP $HTTP_CODE)"
fi

# Test: Get messages
echo -n "  [14] Get Message History... "
TOTAL=$((TOTAL + 1))
RESPONSE=$(curl -s -w '\n%{http_code}' -X GET "$API_URL/conversations/$TEST_CONVERSATION_ID/messages" \
    -H "Authorization: Bearer $TEST_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    PASSED=$((PASSED + 1))
    echo -e "${GREEN}PASSED${NC} (HTTP $HTTP_CODE)"
else
    FAILED=$((FAILED + 1))
    echo -e "${RED}FAILED${NC} (HTTP $HTTP_CODE)"
fi

# Test: Get messages with pagination
echo -n "  [15] Get Messages With Pagination... "
TOTAL=$((TOTAL + 1))
RESPONSE=$(curl -s -w '\n%{http_code}' -X GET "$API_URL/conversations/$TEST_CONVERSATION_ID/messages?page=1&limit=10" \
    -H "Authorization: Bearer $TEST_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    PASSED=$((PASSED + 1))
    echo -e "${GREEN}PASSED${NC} (HTTP $HTTP_CODE)"
else
    FAILED=$((FAILED + 1))
    echo -e "${RED}FAILED${NC} (HTTP $HTTP_CODE)"
fi

# Test: Send empty message (validation error)
echo -n "  [16] Send Empty Message (expect 400)... "
TOTAL=$((TOTAL + 1))
RESPONSE=$(curl -s -w '\n%{http_code}' -X POST "$API_URL/conversations/$TEST_CONVERSATION_ID/messages" \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $TEST_TOKEN" \
    -d '{"content":""}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "400" ]; then
    PASSED=$((PASSED + 1))
    echo -e "${GREEN}PASSED${NC} (HTTP $HTTP_CODE)"
else
    FAILED=$((FAILED + 1))
    echo -e "${RED}FAILED${NC} (Expected: 400, Got: $HTTP_CODE)"
fi

echo ""
echo -e "${BLUE}=== User Tests ===${NC}"
echo ""

# Test: Get online users
echo -n "  [17] Get Online Users... "
TOTAL=$((TOTAL + 1))
RESPONSE=$(curl -s -w '\n%{http_code}' -X GET "$API_URL/users/online" \
    -H "Authorization: Bearer $TEST_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    PASSED=$((PASSED + 1))
    echo -e "${GREEN}PASSED${NC} (HTTP $HTTP_CODE)"
else
    FAILED=$((FAILED + 1))
    echo -e "${RED}FAILED${NC} (HTTP $HTTP_CODE)"
fi

echo ""
echo "========================================"
echo "  Test Results"
echo "========================================"
echo ""
echo -e "  Total:  $TOTAL"
echo -e "  ${GREEN}Passed: $PASSED${NC}"
echo -e "  ${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi
