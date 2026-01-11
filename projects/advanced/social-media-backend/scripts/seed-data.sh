#!/bin/bash

# Social Media API - Seed Data Script
# This script populates the database with test data for development and testing

BASE_URL="${API_URL:-http://localhost:3000}"
CONTENT_TYPE="Content-Type: application/json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Store tokens and IDs
declare -A USER_TOKENS
declare -A USER_IDS
declare -A POST_IDS

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Social Media API - Seed Data${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Helper function to make API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4

    local -a curl_args=(-s -X "$method" "$BASE_URL$endpoint" -H "$CONTENT_TYPE")

    if [ -n "$token" ]; then
        curl_args+=(-H "Authorization: Bearer $token")
    fi

    if [ -n "$data" ]; then
        curl_args+=(-d "$data")
    fi

    curl "${curl_args[@]}"
}

# Function to extract JSON value (simple parser)
json_value() {
    echo "$1" | grep -o "\"$2\":[^,}]*" | head -1 | sed 's/.*://' | tr -d '"' | tr -d ' '
}

json_value_nested() {
    echo "$1" | grep -o "\"$2\":{[^}]*}" | head -1 | grep -o "\"$3\":[^,}]*" | sed 's/.*://' | tr -d '"' | tr -d ' '
}

# Cleanup function
cleanup() {
    echo -e "${YELLOW}Note: To reset the database, run:${NC}"
    echo "  pnpm run typeorm migration:revert"
    echo "  pnpm run typeorm migration:run"
}

# ============================================
# SEED USERS
# ============================================
echo -e "${GREEN}[1/5] Creating sample users...${NC}"

# User 1: Alice (main test user)
RESPONSE=$(api_call POST "/api/v1/auth/register" '{
    "email": "alice@example.com",
    "username": "alice",
    "password": "Password123!",
    "name": "Alice Johnson"
}')
USER_TOKENS[alice]=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*"' | sed 's/"accessToken":"//' | tr -d '"')
USER_IDS[alice]=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//' | tr -d '"')
echo "  - Created user: alice (ID: ${USER_IDS[alice]})"

# User 2: Bob
RESPONSE=$(api_call POST "/api/v1/auth/register" '{
    "email": "bob@example.com",
    "username": "bob",
    "password": "Password123!",
    "name": "Bob Smith"
}')
USER_TOKENS[bob]=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*"' | sed 's/"accessToken":"//' | tr -d '"')
USER_IDS[bob]=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//' | tr -d '"')
echo "  - Created user: bob (ID: ${USER_IDS[bob]})"

# User 3: Charlie
RESPONSE=$(api_call POST "/api/v1/auth/register" '{
    "email": "charlie@example.com",
    "username": "charlie",
    "password": "Password123!",
    "name": "Charlie Brown"
}')
USER_TOKENS[charlie]=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*"' | sed 's/"accessToken":"//' | tr -d '"')
USER_IDS[charlie]=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//' | tr -d '"')
echo "  - Created user: charlie (ID: ${USER_IDS[charlie]})"

# User 4: Diana
RESPONSE=$(api_call POST "/api/v1/auth/register" '{
    "email": "diana@example.com",
    "username": "diana",
    "password": "Password123!",
    "name": "Diana Prince"
}')
USER_TOKENS[diana]=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*"' | sed 's/"accessToken":"//' | tr -d '"')
USER_IDS[diana]=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//' | tr -d '"')
echo "  - Created user: diana (ID: ${USER_IDS[diana]})"

# User 5: Eve
RESPONSE=$(api_call POST "/api/v1/auth/register" '{
    "email": "eve@example.com",
    "username": "eve",
    "password": "Password123!",
    "name": "Eve Wilson"
}')
USER_TOKENS[eve]=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*"' | sed 's/"accessToken":"//' | tr -d '"')
USER_IDS[eve]=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//' | tr -d '"')
echo "  - Created user: eve (ID: ${USER_IDS[eve]})"

echo ""

# ============================================
# SEED FOLLOW RELATIONSHIPS
# ============================================
echo -e "${GREEN}[2/5] Creating follow relationships...${NC}"

# Alice follows Bob, Charlie, Diana
api_call POST "/api/v1/users/${USER_IDS[bob]}/follow" "" "${USER_TOKENS[alice]}" > /dev/null
api_call POST "/api/v1/users/${USER_IDS[charlie]}/follow" "" "${USER_TOKENS[alice]}" > /dev/null
api_call POST "/api/v1/users/${USER_IDS[diana]}/follow" "" "${USER_TOKENS[alice]}" > /dev/null
echo "  - Alice follows: bob, charlie, diana"

# Bob follows Alice, Eve
api_call POST "/api/v1/users/${USER_IDS[alice]}/follow" "" "${USER_TOKENS[bob]}" > /dev/null
api_call POST "/api/v1/users/${USER_IDS[eve]}/follow" "" "${USER_TOKENS[bob]}" > /dev/null
echo "  - Bob follows: alice, eve"

# Charlie follows Alice, Bob, Diana, Eve
api_call POST "/api/v1/users/${USER_IDS[alice]}/follow" "" "${USER_TOKENS[charlie]}" > /dev/null
api_call POST "/api/v1/users/${USER_IDS[bob]}/follow" "" "${USER_TOKENS[charlie]}" > /dev/null
api_call POST "/api/v1/users/${USER_IDS[diana]}/follow" "" "${USER_TOKENS[charlie]}" > /dev/null
api_call POST "/api/v1/users/${USER_IDS[eve]}/follow" "" "${USER_TOKENS[charlie]}" > /dev/null
echo "  - Charlie follows: alice, bob, diana, eve"

# Diana follows Alice
api_call POST "/api/v1/users/${USER_IDS[alice]}/follow" "" "${USER_TOKENS[diana]}" > /dev/null
echo "  - Diana follows: alice"

# Eve follows Bob, Charlie
api_call POST "/api/v1/users/${USER_IDS[bob]}/follow" "" "${USER_TOKENS[eve]}" > /dev/null
api_call POST "/api/v1/users/${USER_IDS[charlie]}/follow" "" "${USER_TOKENS[eve]}" > /dev/null
echo "  - Eve follows: bob, charlie"

echo ""

# ============================================
# SEED POSTS WITH HASHTAGS
# ============================================
echo -e "${GREEN}[3/5] Creating sample posts with hashtags...${NC}"

# Alice's posts
RESPONSE=$(api_call POST "/api/v1/posts" '{
    "content": "Hello everyone! This is my first post on this amazing platform. #welcome #firstpost #socialmedia"
}' "${USER_TOKENS[alice]}")
POST_IDS[alice1]=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//' | tr -d '"')
echo "  - Alice: Post 1 (welcome post)"

RESPONSE=$(api_call POST "/api/v1/posts" '{
    "content": "Just finished reading an amazing book about #programming. Highly recommend it! #coding #tech #learning"
}' "${USER_TOKENS[alice]}")
POST_IDS[alice2]=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//' | tr -d '"')
echo "  - Alice: Post 2 (programming book)"

# Bob's posts
RESPONSE=$(api_call POST "/api/v1/posts" '{
    "content": "Beautiful sunset today! Nature never fails to amaze me. #sunset #nature #photography #beautiful"
}' "${USER_TOKENS[bob]}")
POST_IDS[bob1]=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//' | tr -d '"')
echo "  - Bob: Post 1 (sunset)"

RESPONSE=$(api_call POST "/api/v1/posts" '{
    "content": "Working on a new #coding project today. Building something cool with #nestjs and #typescript! #webdev"
}' "${USER_TOKENS[bob]}")
POST_IDS[bob2]=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//' | tr -d '"')
echo "  - Bob: Post 2 (coding project)"

# Charlie's posts
RESPONSE=$(api_call POST "/api/v1/posts" '{
    "content": "Coffee and code - the perfect combo! ☕ #coding #developer #coffeetime #morning"
}' "${USER_TOKENS[charlie]}")
POST_IDS[charlie1]=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//' | tr -d '"')
echo "  - Charlie: Post 1 (coffee and code)"

RESPONSE=$(api_call POST "/api/v1/posts" '{
    "content": "Just deployed my first microservice! The journey of #learning never stops. #tech #microservices #backend"
}' "${USER_TOKENS[charlie]}")
POST_IDS[charlie2]=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//' | tr -d '"')
echo "  - Charlie: Post 2 (microservice)"

# Diana's posts
RESPONSE=$(api_call POST "/api/v1/posts" '{
    "content": "Exploring new design patterns today. Clean architecture is the way to go! #architecture #cleancode #programming"
}' "${USER_TOKENS[diana]}")
POST_IDS[diana1]=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//' | tr -d '"')
echo "  - Diana: Post 1 (clean architecture)"

# Eve's posts
RESPONSE=$(api_call POST "/api/v1/posts" '{
    "content": "Team building event was amazing! Love working with such talented people. #teamwork #culture #tech"
}' "${USER_TOKENS[eve]}")
POST_IDS[eve1]=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//' | tr -d '"')
echo "  - Eve: Post 1 (team building)"

RESPONSE=$(api_call POST "/api/v1/posts" '{
    "content": "Just learned about CQRS pattern. Game changer for complex applications! #cqrs #patterns #learning #backend"
}' "${USER_TOKENS[eve]}")
POST_IDS[eve2]=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//' | tr -d '"')
echo "  - Eve: Post 2 (CQRS)"

echo ""

# ============================================
# SEED LIKES
# ============================================
echo -e "${GREEN}[4/5] Adding likes to posts...${NC}"

# Like Alice's first post (make it popular)
api_call POST "/api/v1/posts/${POST_IDS[alice1]}/like" "" "${USER_TOKENS[bob]}" > /dev/null
api_call POST "/api/v1/posts/${POST_IDS[alice1]}/like" "" "${USER_TOKENS[charlie]}" > /dev/null
api_call POST "/api/v1/posts/${POST_IDS[alice1]}/like" "" "${USER_TOKENS[diana]}" > /dev/null
api_call POST "/api/v1/posts/${POST_IDS[alice1]}/like" "" "${USER_TOKENS[eve]}" > /dev/null
echo "  - Alice's post 1: 4 likes (bob, charlie, diana, eve)"

# Like Bob's coding post
api_call POST "/api/v1/posts/${POST_IDS[bob2]}/like" "" "${USER_TOKENS[alice]}" > /dev/null
api_call POST "/api/v1/posts/${POST_IDS[bob2]}/like" "" "${USER_TOKENS[charlie]}" > /dev/null
api_call POST "/api/v1/posts/${POST_IDS[bob2]}/like" "" "${USER_TOKENS[eve]}" > /dev/null
echo "  - Bob's post 2: 3 likes (alice, charlie, eve)"

# Like Charlie's coffee post
api_call POST "/api/v1/posts/${POST_IDS[charlie1]}/like" "" "${USER_TOKENS[alice]}" > /dev/null
api_call POST "/api/v1/posts/${POST_IDS[charlie1]}/like" "" "${USER_TOKENS[bob]}" > /dev/null
echo "  - Charlie's post 1: 2 likes (alice, bob)"

# Like Diana's architecture post
api_call POST "/api/v1/posts/${POST_IDS[diana1]}/like" "" "${USER_TOKENS[alice]}" > /dev/null
api_call POST "/api/v1/posts/${POST_IDS[diana1]}/like" "" "${USER_TOKENS[charlie]}" > /dev/null
api_call POST "/api/v1/posts/${POST_IDS[diana1]}/like" "" "${USER_TOKENS[eve]}" > /dev/null
echo "  - Diana's post 1: 3 likes (alice, charlie, eve)"

# Like Eve's CQRS post
api_call POST "/api/v1/posts/${POST_IDS[eve2]}/like" "" "${USER_TOKENS[alice]}" > /dev/null
api_call POST "/api/v1/posts/${POST_IDS[eve2]}/like" "" "${USER_TOKENS[bob]}" > /dev/null
api_call POST "/api/v1/posts/${POST_IDS[eve2]}/like" "" "${USER_TOKENS[charlie]}" > /dev/null
api_call POST "/api/v1/posts/${POST_IDS[eve2]}/like" "" "${USER_TOKENS[diana]}" > /dev/null
echo "  - Eve's post 2: 4 likes (alice, bob, charlie, diana)"

echo ""

# ============================================
# SEED COMMENTS
# ============================================
echo -e "${GREEN}[5/5] Adding comments to posts...${NC}"

# Comments on Alice's first post
api_call POST "/api/v1/posts/${POST_IDS[alice1]}/comments" '{
    "content": "Welcome to the platform! Glad to have you here!"
}' "${USER_TOKENS[bob]}" > /dev/null
api_call POST "/api/v1/posts/${POST_IDS[alice1]}/comments" '{
    "content": "Great first post! Looking forward to more content from you."
}' "${USER_TOKENS[charlie]}" > /dev/null
echo "  - Alice's post 1: 2 comments"

# Comments on Bob's coding post
api_call POST "/api/v1/posts/${POST_IDS[bob2]}/comments" '{
    "content": "NestJS is amazing! What are you building?"
}' "${USER_TOKENS[alice]}" > /dev/null
api_call POST "/api/v1/posts/${POST_IDS[bob2]}/comments" '{
    "content": "TypeScript + NestJS is the best combo for backend development!"
}' "${USER_TOKENS[eve]}" > /dev/null
echo "  - Bob's post 2: 2 comments"

# Comments on Charlie's microservice post
api_call POST "/api/v1/posts/${POST_IDS[charlie2]}/comments" '{
    "content": "Congrats! Microservices can be tricky. What stack are you using?"
}' "${USER_TOKENS[diana]}" > /dev/null
echo "  - Charlie's post 2: 1 comment"

# Comments on Eve's CQRS post
api_call POST "/api/v1/posts/${POST_IDS[eve2]}/comments" '{
    "content": "CQRS is indeed powerful. Have you tried event sourcing too?"
}' "${USER_TOKENS[bob]}" > /dev/null
api_call POST "/api/v1/posts/${POST_IDS[eve2]}/comments" '{
    "content": "Great learning! DDD patterns work really well with CQRS."
}' "${USER_TOKENS[diana]}" > /dev/null
api_call POST "/api/v1/posts/${POST_IDS[eve2]}/comments" '{
    "content": "This is exactly what we use in our project. Works like a charm!"
}' "${USER_TOKENS[alice]}" > /dev/null
echo "  - Eve's post 2: 3 comments"

echo ""

# ============================================
# SUMMARY
# ============================================
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Seed data created successfully!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Created:"
echo "  - 5 users (alice, bob, charlie, diana, eve)"
echo "  - 9 posts with various hashtags"
echo "  - 10 follow relationships"
echo "  - 16 likes"
echo "  - 8 comments"
echo ""
echo "Test credentials:"
echo "  - Email: alice@example.com | Password: Password123!"
echo "  - Email: bob@example.com | Password: Password123!"
echo "  - Email: charlie@example.com | Password: Password123!"
echo "  - Email: diana@example.com | Password: Password123!"
echo "  - Email: eve@example.com | Password: Password123!"
echo ""
echo "Popular hashtags: #coding, #tech, #learning, #programming, #backend"
echo ""

cleanup
