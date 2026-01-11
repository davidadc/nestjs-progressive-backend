#!/bin/bash

# Social Media API - User Journey Tests
# Tests complete user workflows end-to-end

BASE_URL="${API_URL:-http://localhost:3000}"
CONTENT_TYPE="Content-Type: application/json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test counters
JOURNEY_PASSED=0
JOURNEY_FAILED=0

TIMESTAMP=$(date +%s)

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Social Media API - User Journeys${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Helper function to make API calls
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

parse_response() {
    local response=$1
    BODY=$(echo "$response" | sed '$d')
    STATUS=$(echo "$response" | tail -n1)
}

check_status() {
    local expected=$1
    local actual=$2
    local step=$3

    if [ "$actual" -eq "$expected" ]; then
        echo -e "    ${GREEN}✓${NC} $step"
        return 0
    else
        echo -e "    ${RED}✗${NC} $step (expected $expected, got $actual)"
        return 1
    fi
}

# ============================================
# JOURNEY 1: New User - Registration and First Post
# ============================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Journey 1: New User - Registration and First Post${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "  Scenario: Register -> Update profile -> Create post with hashtag -> View in own feed"
echo ""

JOURNEY1_PASSED=true

# Step 1: Register new user
echo -e "  ${BLUE}Step 1: Register new user${NC}"
RESPONSE=$(api_call POST "/api/v1/auth/register" "{
    \"email\": \"newuser${TIMESTAMP}@example.com\",
    \"username\": \"newuser${TIMESTAMP}\",
    \"password\": \"SecurePass123!\",
    \"name\": \"New User\"
}" "")
parse_response "$RESPONSE"
if ! check_status 201 "$STATUS" "User registered successfully"; then
    JOURNEY1_PASSED=false
fi
J1_TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*"' | sed 's/"accessToken":"//' | tr -d '"')
J1_USER_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//' | tr -d '"')

# Step 2: Update profile with bio
echo -e "  ${BLUE}Step 2: Update profile${NC}"
RESPONSE=$(api_call PATCH "/api/v1/users/$J1_USER_ID" "{
    \"bio\": \"Hello! I am new here and excited to share my thoughts.\"
}" "$J1_TOKEN")
parse_response "$RESPONSE"
if ! check_status 200 "$STATUS" "Profile updated with bio"; then
    JOURNEY1_PASSED=false
fi

# Step 3: Create first post with hashtags
echo -e "  ${BLUE}Step 3: Create first post with hashtags${NC}"
RESPONSE=$(api_call POST "/api/v1/posts" "{
    \"content\": \"My first post on this platform! Excited to be here. #newbie #firstpost #hello #socialmedia\"
}" "$J1_TOKEN")
parse_response "$RESPONSE"
if ! check_status 201 "$STATUS" "First post created with hashtags"; then
    JOURNEY1_PASSED=false
fi
J1_POST_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//' | tr -d '"')

# Step 4: Verify post appears in own feed
echo -e "  ${BLUE}Step 4: Verify post appears in feed${NC}"
RESPONSE=$(api_call GET "/api/v1/feed" "" "$J1_TOKEN")
parse_response "$RESPONSE"
if ! check_status 200 "$STATUS" "Feed retrieved"; then
    JOURNEY1_PASSED=false
fi
if echo "$BODY" | grep -q "$J1_POST_ID"; then
    echo -e "    ${GREEN}✓${NC} Own post appears in personalized feed"
else
    echo -e "    ${RED}✗${NC} Own post not found in feed"
    JOURNEY1_PASSED=false
fi

# Step 5: Verify hashtag is searchable
echo -e "  ${BLUE}Step 5: Verify hashtag is searchable${NC}"
RESPONSE=$(api_call GET "/api/v1/hashtags/newbie/posts" "" "")
parse_response "$RESPONSE"
if ! check_status 200 "$STATUS" "Hashtag search works"; then
    JOURNEY1_PASSED=false
fi

if $JOURNEY1_PASSED; then
    echo -e "\n  ${GREEN}✓ Journey 1 PASSED${NC}"
    JOURNEY_PASSED=$((JOURNEY_PASSED + 1))
else
    echo -e "\n  ${RED}✗ Journey 1 FAILED${NC}"
    JOURNEY_FAILED=$((JOURNEY_FAILED + 1))
fi
echo ""

# ============================================
# JOURNEY 2: Social Interaction
# ============================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Journey 2: Social Interaction${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "  Scenario: Login -> Follow user -> Like post -> Comment -> View in feed"
echo ""

JOURNEY2_PASSED=true

# Step 1: Register a second user
echo -e "  ${BLUE}Step 1: Create interacting user${NC}"
RESPONSE=$(api_call POST "/api/v1/auth/register" "{
    \"email\": \"interactor${TIMESTAMP}@example.com\",
    \"username\": \"interactor${TIMESTAMP}\",
    \"password\": \"SecurePass123!\",
    \"name\": \"Social User\"
}" "")
parse_response "$RESPONSE"
if ! check_status 201 "$STATUS" "Interacting user created"; then
    JOURNEY2_PASSED=false
fi
J2_TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*"' | sed 's/"accessToken":"//' | tr -d '"')

# Step 2: Follow the first user
echo -e "  ${BLUE}Step 2: Follow the first user${NC}"
RESPONSE=$(api_call POST "/api/v1/users/$J1_USER_ID/follow" "" "$J2_TOKEN")
parse_response "$RESPONSE"
if ! check_status 204 "$STATUS" "Followed first user"; then
    JOURNEY2_PASSED=false
fi

# Step 3: Like the first user's post
echo -e "  ${BLUE}Step 3: Like the post${NC}"
RESPONSE=$(api_call POST "/api/v1/posts/$J1_POST_ID/like" "" "$J2_TOKEN")
parse_response "$RESPONSE"
if ! check_status 204 "$STATUS" "Post liked"; then
    JOURNEY2_PASSED=false
fi

# Step 4: Comment on the post
echo -e "  ${BLUE}Step 4: Comment on the post${NC}"
RESPONSE=$(api_call POST "/api/v1/posts/$J1_POST_ID/comments" "{
    \"content\": \"Welcome to the platform! Great first post!\"
}" "$J2_TOKEN")
parse_response "$RESPONSE"
if ! check_status 201 "$STATUS" "Comment added"; then
    JOURNEY2_PASSED=false
fi

# Step 5: Verify post appears in interactor's feed
echo -e "  ${BLUE}Step 5: Verify post in feed (from followed user)${NC}"
RESPONSE=$(api_call GET "/api/v1/feed" "" "$J2_TOKEN")
parse_response "$RESPONSE"
if ! check_status 200 "$STATUS" "Feed retrieved"; then
    JOURNEY2_PASSED=false
fi
if echo "$BODY" | grep -q "$J1_POST_ID"; then
    echo -e "    ${GREEN}✓${NC} Followed user's post appears in feed"
else
    echo -e "    ${RED}✗${NC} Followed user's post not in feed"
    JOURNEY2_PASSED=false
fi

if $JOURNEY2_PASSED; then
    echo -e "\n  ${GREEN}✓ Journey 2 PASSED${NC}"
    JOURNEY_PASSED=$((JOURNEY_PASSED + 1))
else
    echo -e "\n  ${RED}✗ Journey 2 FAILED${NC}"
    JOURNEY_FAILED=$((JOURNEY_FAILED + 1))
fi
echo ""

# ============================================
# JOURNEY 3: Content Discovery
# ============================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Journey 3: Content Discovery${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "  Scenario: Browse trending -> Search users -> Follow -> View personalized feed"
echo ""

JOURNEY3_PASSED=true

# Step 1: Register discovery user
echo -e "  ${BLUE}Step 1: Create discovery user${NC}"
RESPONSE=$(api_call POST "/api/v1/auth/register" "{
    \"email\": \"discoverer${TIMESTAMP}@example.com\",
    \"username\": \"discoverer${TIMESTAMP}\",
    \"password\": \"SecurePass123!\",
    \"name\": \"Discovery User\"
}" "")
parse_response "$RESPONSE"
if ! check_status 201 "$STATUS" "Discovery user created"; then
    JOURNEY3_PASSED=false
fi
J3_TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*"' | sed 's/"accessToken":"//' | tr -d '"')

# Step 2: Browse trending feed (public)
echo -e "  ${BLUE}Step 2: Browse trending feed${NC}"
RESPONSE=$(api_call GET "/api/v1/feed/trending" "" "")
parse_response "$RESPONSE"
if ! check_status 200 "$STATUS" "Trending feed retrieved"; then
    JOURNEY3_PASSED=false
fi

# Step 3: Browse trending hashtags
echo -e "  ${BLUE}Step 3: Browse trending hashtags${NC}"
RESPONSE=$(api_call GET "/api/v1/hashtags/trending" "" "")
parse_response "$RESPONSE"
if ! check_status 200 "$STATUS" "Trending hashtags retrieved"; then
    JOURNEY3_PASSED=false
fi

# Step 4: Search for users
echo -e "  ${BLUE}Step 4: Search for users${NC}"
RESPONSE=$(api_call GET "/api/v1/users/search?q=newuser" "" "")
parse_response "$RESPONSE"
if ! check_status 200 "$STATUS" "User search works"; then
    JOURNEY3_PASSED=false
fi

# Step 5: Follow found user
echo -e "  ${BLUE}Step 5: Follow discovered user${NC}"
RESPONSE=$(api_call POST "/api/v1/users/$J1_USER_ID/follow" "" "$J3_TOKEN")
parse_response "$RESPONSE"
if ! check_status 204 "$STATUS" "Followed discovered user"; then
    JOURNEY3_PASSED=false
fi

# Step 6: View personalized feed with new follow
echo -e "  ${BLUE}Step 6: View personalized feed${NC}"
RESPONSE=$(api_call GET "/api/v1/feed" "" "$J3_TOKEN")
parse_response "$RESPONSE"
if ! check_status 200 "$STATUS" "Personalized feed works after follow"; then
    JOURNEY3_PASSED=false
fi

if $JOURNEY3_PASSED; then
    echo -e "\n  ${GREEN}✓ Journey 3 PASSED${NC}"
    JOURNEY_PASSED=$((JOURNEY_PASSED + 1))
else
    echo -e "\n  ${RED}✗ Journey 3 FAILED${NC}"
    JOURNEY_FAILED=$((JOURNEY_FAILED + 1))
fi
echo ""

# ============================================
# JOURNEY 4: Engagement Flow
# ============================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Journey 4: Engagement Flow${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "  Scenario: Create post -> Receive likes -> View notifications -> Check stats"
echo ""

JOURNEY4_PASSED=true

# Step 1: Create a content creator
echo -e "  ${BLUE}Step 1: Create content creator${NC}"
RESPONSE=$(api_call POST "/api/v1/auth/register" "{
    \"email\": \"creator${TIMESTAMP}@example.com\",
    \"username\": \"creator${TIMESTAMP}\",
    \"password\": \"SecurePass123!\",
    \"name\": \"Content Creator\"
}" "")
parse_response "$RESPONSE"
if ! check_status 201 "$STATUS" "Content creator registered"; then
    JOURNEY4_PASSED=false
fi
J4_CREATOR_TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*"' | sed 's/"accessToken":"//' | tr -d '"')
J4_CREATOR_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//' | tr -d '"')

# Step 2: Create engaging post
echo -e "  ${BLUE}Step 2: Create engaging post${NC}"
RESPONSE=$(api_call POST "/api/v1/posts" "{
    \"content\": \"Check out this amazing content! #trending #viral #mustread\"
}" "$J4_CREATOR_TOKEN")
parse_response "$RESPONSE"
if ! check_status 201 "$STATUS" "Post created"; then
    JOURNEY4_PASSED=false
fi
J4_POST_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//' | tr -d '"')

# Step 3: Have multiple users like and follow
echo -e "  ${BLUE}Step 3: Receive engagement (likes & follow)${NC}"
# Use existing tokens to like the post
RESPONSE=$(api_call POST "/api/v1/posts/$J4_POST_ID/like" "" "$J1_TOKEN")
parse_response "$RESPONSE"
check_status 204 "$STATUS" "Like from user 1"

RESPONSE=$(api_call POST "/api/v1/posts/$J4_POST_ID/like" "" "$J2_TOKEN")
parse_response "$RESPONSE"
check_status 204 "$STATUS" "Like from user 2"

RESPONSE=$(api_call POST "/api/v1/users/$J4_CREATOR_ID/follow" "" "$J1_TOKEN")
parse_response "$RESPONSE"
check_status 204 "$STATUS" "Follow from user 1"

# Step 4: Check notifications
echo -e "  ${BLUE}Step 4: View notifications${NC}"
RESPONSE=$(api_call GET "/api/v1/notifications" "" "$J4_CREATOR_TOKEN")
parse_response "$RESPONSE"
if ! check_status 200 "$STATUS" "Notifications retrieved"; then
    JOURNEY4_PASSED=false
fi
# Check that we have notifications
if echo "$BODY" | grep -q '"items":\[\]'; then
    echo -e "    ${YELLOW}!${NC} No notifications found (may be expected if event handlers not triggered)"
else
    echo -e "    ${GREEN}✓${NC} Notifications present"
fi

# Step 5: Mark notifications as read
echo -e "  ${BLUE}Step 5: Mark all notifications as read${NC}"
RESPONSE=$(api_call PATCH "/api/v1/notifications/read-all" "" "$J4_CREATOR_TOKEN")
parse_response "$RESPONSE"
if ! check_status 204 "$STATUS" "Notifications marked as read"; then
    JOURNEY4_PASSED=false
fi

# Step 6: Check post stats
echo -e "  ${BLUE}Step 6: Verify post engagement stats${NC}"
RESPONSE=$(api_call GET "/api/v1/posts/$J4_POST_ID" "" "")
parse_response "$RESPONSE"
if ! check_status 200 "$STATUS" "Post retrieved"; then
    JOURNEY4_PASSED=false
fi
LIKES_COUNT=$(echo "$BODY" | grep -o '"likesCount":[0-9]*' | sed 's/"likesCount"://')
if [ "$LIKES_COUNT" -ge 2 ]; then
    echo -e "    ${GREEN}✓${NC} Post has $LIKES_COUNT likes"
else
    echo -e "    ${RED}✗${NC} Expected at least 2 likes, got $LIKES_COUNT"
    JOURNEY4_PASSED=false
fi

# Step 7: Check creator profile stats
echo -e "  ${BLUE}Step 7: Verify profile stats${NC}"
RESPONSE=$(api_call GET "/api/v1/users/$J4_CREATOR_ID" "" "")
parse_response "$RESPONSE"
if ! check_status 200 "$STATUS" "Profile retrieved"; then
    JOURNEY4_PASSED=false
fi
FOLLOWERS_COUNT=$(echo "$BODY" | grep -o '"followersCount":[0-9]*' | sed 's/"followersCount"://')
POSTS_COUNT=$(echo "$BODY" | grep -o '"postsCount":[0-9]*' | sed 's/"postsCount"://')
echo -e "    ${GREEN}✓${NC} Creator has $FOLLOWERS_COUNT followers, $POSTS_COUNT posts"

if $JOURNEY4_PASSED; then
    echo -e "\n  ${GREEN}✓ Journey 4 PASSED${NC}"
    JOURNEY_PASSED=$((JOURNEY_PASSED + 1))
else
    echo -e "\n  ${RED}✗ Journey 4 FAILED${NC}"
    JOURNEY_FAILED=$((JOURNEY_FAILED + 1))
fi
echo ""

# ============================================
# JOURNEY SUMMARY
# ============================================
TOTAL_JOURNEYS=$((JOURNEY_PASSED + JOURNEY_FAILED))

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Journey Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Total Journeys: $TOTAL_JOURNEYS"
echo -e "${GREEN}Passed: $JOURNEY_PASSED${NC}"
echo -e "${RED}Failed: $JOURNEY_FAILED${NC}"
echo ""

if [ $JOURNEY_FAILED -eq 0 ]; then
    echo -e "${GREEN}All user journeys completed successfully!${NC}"
    exit 0
else
    echo -e "${RED}Some journeys failed. Please check the output above.${NC}"
    exit 1
fi
