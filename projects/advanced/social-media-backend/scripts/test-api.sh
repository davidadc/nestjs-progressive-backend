#!/bin/bash

# Social Media API - Integration Test Script
# Tests all API endpoints and verifies responses

BASE_URL="${API_URL:-http://localhost:3000}"
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

# Store tokens and IDs for tests
ACCESS_TOKEN=""
REFRESH_TOKEN=""
USER_ID=""
POST_ID=""
COMMENT_ID=""
TARGET_USER_ID=""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Social Media API - Integration Tests${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Helper function to run a test
run_test() {
    local name=$1
    local expected_status=$2
    local actual_status=$3
    local response=$4

    TOTAL=$((TOTAL + 1))

    if [ "$actual_status" -eq "$expected_status" ]; then
        echo -e "  ${GREEN}✓${NC} $name (HTTP $actual_status)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "  ${RED}✗${NC} $name (expected $expected_status, got $actual_status)"
        echo -e "    Response: $response"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Helper function to check RFC 7807 error format
check_rfc7807() {
    local response=$1
    local name=$2

    TOTAL=$((TOTAL + 1))

    if echo "$response" | grep -q '"type":' && \
       echo "$response" | grep -q '"title":' && \
       echo "$response" | grep -q '"status":' && \
       echo "$response" | grep -q '"detail":'; then
        echo -e "  ${GREEN}✓${NC} $name - RFC 7807 format valid"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "  ${RED}✗${NC} $name - RFC 7807 format invalid"
        echo -e "    Response: $response"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Make API call and capture both status and body
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4

    local -a curl_args=(-s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" -H "$CONTENT_TYPE")

    if [ -n "$token" ]; then
        curl_args+=(-H "Authorization: Bearer $token")
    fi

    if [ -n "$data" ]; then
        curl_args+=(-d "$data")
    fi

    curl "${curl_args[@]}"
}

# Parse response body and status
parse_response() {
    local response=$1
    BODY=$(echo "$response" | sed '$d')
    STATUS=$(echo "$response" | tail -n1)
}

# ============================================
# HEALTH CHECK
# ============================================
echo -e "${YELLOW}[Health Check]${NC}"
RESPONSE=$(api_call GET "/" "" "")
parse_response "$RESPONSE"
run_test "GET / - Health check" 200 "$STATUS" "$BODY"
echo ""

# ============================================
# AUTH ENDPOINTS
# ============================================
echo -e "${YELLOW}[Auth Endpoints]${NC}"

# Register a new user
TIMESTAMP=$(date +%s)
TEST_EMAIL="testuser${TIMESTAMP}@example.com"
TEST_USERNAME="testuser${TIMESTAMP}"

RESPONSE=$(api_call POST "/api/v1/auth/register" "{
    \"email\": \"$TEST_EMAIL\",
    \"username\": \"$TEST_USERNAME\",
    \"password\": \"TestPass123!\",
    \"name\": \"Test User\"
}" "")
parse_response "$RESPONSE"
run_test "POST /auth/register - Register new user" 201 "$STATUS" "$BODY"

ACCESS_TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*"' | sed 's/"accessToken":"//' | tr -d '"')
REFRESH_TOKEN=$(echo "$BODY" | grep -o '"refreshToken":"[^"]*"' | sed 's/"refreshToken":"//' | tr -d '"')
USER_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//' | tr -d '"')

# Register duplicate email (should fail)
RESPONSE=$(api_call POST "/api/v1/auth/register" "{
    \"email\": \"$TEST_EMAIL\",
    \"username\": \"another${TIMESTAMP}\",
    \"password\": \"TestPass123!\",
    \"name\": \"Another User\"
}" "")
parse_response "$RESPONSE"
run_test "POST /auth/register - Duplicate email rejected" 409 "$STATUS" "$BODY"
check_rfc7807 "$BODY" "Duplicate email error format"

# Login
RESPONSE=$(api_call POST "/api/v1/auth/login" "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"TestPass123!\"
}" "")
parse_response "$RESPONSE"
run_test "POST /auth/login - Login with valid credentials" 200 "$STATUS" "$BODY"
ACCESS_TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*"' | sed 's/"accessToken":"//' | tr -d '"')
REFRESH_TOKEN=$(echo "$BODY" | grep -o '"refreshToken":"[^"]*"' | sed 's/"refreshToken":"//' | tr -d '"')

# Login with wrong password
RESPONSE=$(api_call POST "/api/v1/auth/login" "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"WrongPassword!\"
}" "")
parse_response "$RESPONSE"
run_test "POST /auth/login - Invalid password rejected" 401 "$STATUS" "$BODY"
check_rfc7807 "$BODY" "Invalid credentials error format"

# Refresh token
RESPONSE=$(api_call POST "/api/v1/auth/refresh" "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
}" "")
parse_response "$RESPONSE"
run_test "POST /auth/refresh - Refresh token" 200 "$STATUS" "$BODY"
ACCESS_TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*"' | sed 's/"accessToken":"//' | tr -d '"')

# Get profile
RESPONSE=$(api_call GET "/api/v1/auth/profile" "" "$ACCESS_TOKEN")
parse_response "$RESPONSE"
run_test "GET /auth/profile - Get authenticated user profile" 200 "$STATUS" "$BODY"

# Get profile without token
RESPONSE=$(api_call GET "/api/v1/auth/profile" "" "")
parse_response "$RESPONSE"
run_test "GET /auth/profile - Unauthorized without token" 401 "$STATUS" "$BODY"

echo ""

# ============================================
# USER ENDPOINTS
# ============================================
echo -e "${YELLOW}[User Endpoints]${NC}"

# Create a second user for follow tests
RESPONSE=$(api_call POST "/api/v1/auth/register" "{
    \"email\": \"target${TIMESTAMP}@example.com\",
    \"username\": \"target${TIMESTAMP}\",
    \"password\": \"TestPass123!\",
    \"name\": \"Target User\"
}" "")
parse_response "$RESPONSE"
TARGET_USER_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//' | tr -d '"')

# Get user profile
RESPONSE=$(api_call GET "/api/v1/users/$TARGET_USER_ID" "" "")
parse_response "$RESPONSE"
run_test "GET /users/:id - Get user profile (public)" 200 "$STATUS" "$BODY"

# Get non-existent user
RESPONSE=$(api_call GET "/api/v1/users/00000000-0000-0000-0000-000000000000" "" "")
parse_response "$RESPONSE"
run_test "GET /users/:id - Non-existent user returns 404" 404 "$STATUS" "$BODY"
check_rfc7807 "$BODY" "User not found error format"

# Follow user
RESPONSE=$(api_call POST "/api/v1/users/$TARGET_USER_ID/follow" "" "$ACCESS_TOKEN")
parse_response "$RESPONSE"
run_test "POST /users/:id/follow - Follow user" 204 "$STATUS" "$BODY"

# Follow same user again (should fail)
RESPONSE=$(api_call POST "/api/v1/users/$TARGET_USER_ID/follow" "" "$ACCESS_TOKEN")
parse_response "$RESPONSE"
run_test "POST /users/:id/follow - Already following rejected" 409 "$STATUS" "$BODY"

# Get followers
RESPONSE=$(api_call GET "/api/v1/users/$TARGET_USER_ID/followers" "" "")
parse_response "$RESPONSE"
run_test "GET /users/:id/followers - Get user followers" 200 "$STATUS" "$BODY"

# Get following
RESPONSE=$(api_call GET "/api/v1/users/$USER_ID/following" "" "")
parse_response "$RESPONSE"
run_test "GET /users/:id/following - Get user following" 200 "$STATUS" "$BODY"

# Search users
RESPONSE=$(api_call GET "/api/v1/users/search?q=target" "" "")
parse_response "$RESPONSE"
run_test "GET /users/search - Search users" 200 "$STATUS" "$BODY"

# Update profile
RESPONSE=$(api_call PATCH "/api/v1/users/$USER_ID" "{
    \"bio\": \"Updated bio for testing\"
}" "$ACCESS_TOKEN")
parse_response "$RESPONSE"
run_test "PATCH /users/:id - Update own profile" 200 "$STATUS" "$BODY"

# Update another user's profile (should fail)
RESPONSE=$(api_call PATCH "/api/v1/users/$TARGET_USER_ID" "{
    \"bio\": \"Trying to update someone else\"
}" "$ACCESS_TOKEN")
parse_response "$RESPONSE"
run_test "PATCH /users/:id - Cannot update other's profile" 403 "$STATUS" "$BODY"

# Unfollow user
RESPONSE=$(api_call DELETE "/api/v1/users/$TARGET_USER_ID/follow" "" "$ACCESS_TOKEN")
parse_response "$RESPONSE"
run_test "DELETE /users/:id/follow - Unfollow user" 204 "$STATUS" "$BODY"

echo ""

# ============================================
# POST ENDPOINTS
# ============================================
echo -e "${YELLOW}[Post Endpoints]${NC}"

# Create post
RESPONSE=$(api_call POST "/api/v1/posts" "{
    \"content\": \"This is a test post with #testing and #api hashtags!\"
}" "$ACCESS_TOKEN")
parse_response "$RESPONSE"
run_test "POST /posts - Create post" 201 "$STATUS" "$BODY"
POST_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//' | tr -d '"')

# Create post without auth
RESPONSE=$(api_call POST "/api/v1/posts" "{
    \"content\": \"Unauthorized post\"
}" "")
parse_response "$RESPONSE"
run_test "POST /posts - Unauthorized without token" 401 "$STATUS" "$BODY"

# Get post
RESPONSE=$(api_call GET "/api/v1/posts/$POST_ID" "" "")
parse_response "$RESPONSE"
run_test "GET /posts/:id - Get post (public)" 200 "$STATUS" "$BODY"

# Get non-existent post
RESPONSE=$(api_call GET "/api/v1/posts/00000000-0000-0000-0000-000000000000" "" "")
parse_response "$RESPONSE"
run_test "GET /posts/:id - Non-existent post returns 404" 404 "$STATUS" "$BODY"
check_rfc7807 "$BODY" "Post not found error format"

# Get user posts
RESPONSE=$(api_call GET "/api/v1/posts/user/$USER_ID" "" "")
parse_response "$RESPONSE"
run_test "GET /posts/user/:userId - Get user posts" 200 "$STATUS" "$BODY"

# Like post
RESPONSE=$(api_call POST "/api/v1/posts/$POST_ID/like" "" "$ACCESS_TOKEN")
parse_response "$RESPONSE"
run_test "POST /posts/:id/like - Like post" 204 "$STATUS" "$BODY"

# Like same post again (should fail)
RESPONSE=$(api_call POST "/api/v1/posts/$POST_ID/like" "" "$ACCESS_TOKEN")
parse_response "$RESPONSE"
run_test "POST /posts/:id/like - Already liked rejected" 409 "$STATUS" "$BODY"

# Get post likes
RESPONSE=$(api_call GET "/api/v1/posts/$POST_ID/likes" "" "")
parse_response "$RESPONSE"
run_test "GET /posts/:id/likes - Get post likes" 200 "$STATUS" "$BODY"

# Unlike post
RESPONSE=$(api_call DELETE "/api/v1/posts/$POST_ID/like" "" "$ACCESS_TOKEN")
parse_response "$RESPONSE"
run_test "DELETE /posts/:id/like - Unlike post" 204 "$STATUS" "$BODY"

echo ""

# ============================================
# COMMENT ENDPOINTS
# ============================================
echo -e "${YELLOW}[Comment Endpoints]${NC}"

# Create comment
RESPONSE=$(api_call POST "/api/v1/posts/$POST_ID/comments" "{
    \"content\": \"This is a test comment on the post!\"
}" "$ACCESS_TOKEN")
parse_response "$RESPONSE"
run_test "POST /posts/:postId/comments - Create comment" 201 "$STATUS" "$BODY"
COMMENT_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//' | tr -d '"')

# Get post comments
RESPONSE=$(api_call GET "/api/v1/posts/$POST_ID/comments" "" "")
parse_response "$RESPONSE"
run_test "GET /posts/:postId/comments - Get post comments" 200 "$STATUS" "$BODY"

# Like comment
RESPONSE=$(api_call POST "/api/v1/posts/$POST_ID/comments/$COMMENT_ID/like" "" "$ACCESS_TOKEN")
parse_response "$RESPONSE"
run_test "POST /posts/:postId/comments/:commentId/like - Like comment" 204 "$STATUS" "$BODY"

# Unlike comment
RESPONSE=$(api_call DELETE "/api/v1/posts/$POST_ID/comments/$COMMENT_ID/like" "" "$ACCESS_TOKEN")
parse_response "$RESPONSE"
run_test "DELETE /posts/:postId/comments/:commentId/like - Unlike comment" 204 "$STATUS" "$BODY"

# Delete comment
RESPONSE=$(api_call DELETE "/api/v1/posts/$POST_ID/comments/$COMMENT_ID" "" "$ACCESS_TOKEN")
parse_response "$RESPONSE"
run_test "DELETE /posts/:postId/comments/:commentId - Delete comment" 204 "$STATUS" "$BODY"

echo ""

# ============================================
# FEED ENDPOINTS
# ============================================
echo -e "${YELLOW}[Feed Endpoints]${NC}"

# Get personalized feed
RESPONSE=$(api_call GET "/api/v1/feed" "" "$ACCESS_TOKEN")
parse_response "$RESPONSE"
run_test "GET /feed - Get personalized feed (auth required)" 200 "$STATUS" "$BODY"

# Get personalized feed without auth
RESPONSE=$(api_call GET "/api/v1/feed" "" "")
parse_response "$RESPONSE"
run_test "GET /feed - Unauthorized without token" 401 "$STATUS" "$BODY"

# Get trending feed
RESPONSE=$(api_call GET "/api/v1/feed/trending" "" "")
parse_response "$RESPONSE"
run_test "GET /feed/trending - Get trending feed (public)" 200 "$STATUS" "$BODY"

# Get trending feed with pagination
RESPONSE=$(api_call GET "/api/v1/feed/trending?limit=5" "" "")
parse_response "$RESPONSE"
run_test "GET /feed/trending - Trending with limit param" 200 "$STATUS" "$BODY"

echo ""

# ============================================
# HASHTAG ENDPOINTS
# ============================================
echo -e "${YELLOW}[Hashtag Endpoints]${NC}"

# Get trending hashtags
RESPONSE=$(api_call GET "/api/v1/hashtags/trending" "" "")
parse_response "$RESPONSE"
run_test "GET /hashtags/trending - Get trending hashtags" 200 "$STATUS" "$BODY"

# Get posts by hashtag
RESPONSE=$(api_call GET "/api/v1/hashtags/testing/posts" "" "")
parse_response "$RESPONSE"
run_test "GET /hashtags/:tag/posts - Get posts by hashtag" 200 "$STATUS" "$BODY"

echo ""

# ============================================
# NOTIFICATION ENDPOINTS
# ============================================
echo -e "${YELLOW}[Notification Endpoints]${NC}"

# Get notifications
RESPONSE=$(api_call GET "/api/v1/notifications" "" "$ACCESS_TOKEN")
parse_response "$RESPONSE"
run_test "GET /notifications - Get user notifications" 200 "$STATUS" "$BODY"

# Get notifications without auth
RESPONSE=$(api_call GET "/api/v1/notifications" "" "")
parse_response "$RESPONSE"
run_test "GET /notifications - Unauthorized without token" 401 "$STATUS" "$BODY"

# Mark all as read
RESPONSE=$(api_call PATCH "/api/v1/notifications/read-all" "" "$ACCESS_TOKEN")
parse_response "$RESPONSE"
run_test "PATCH /notifications/read-all - Mark all as read" 204 "$STATUS" "$BODY"

echo ""

# ============================================
# CLEANUP - DELETE POST
# ============================================
echo -e "${YELLOW}[Cleanup]${NC}"

RESPONSE=$(api_call DELETE "/api/v1/posts/$POST_ID" "" "$ACCESS_TOKEN")
parse_response "$RESPONSE"
run_test "DELETE /posts/:id - Delete own post" 204 "$STATUS" "$BODY"

echo ""

# ============================================
# TEST SUMMARY
# ============================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please check the output above.${NC}"
    exit 1
fi
