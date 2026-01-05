#!/bin/bash

# Chat App - Seed Data Script
# This script seeds the database with test data for development
# Note: Don't use set -e because we want to continue if users already exist

BASE_URL="${BASE_URL:-http://localhost:3000}"
API_URL="$BASE_URL/api/v1"

echo "========================================"
echo "  Chat App - Seed Data Script"
echo "========================================"
echo ""
echo "Base URL: $BASE_URL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Store tokens and IDs
declare -A USER_TOKENS
declare -A USER_IDS

# Function to make API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4

    local headers="-H 'Content-Type: application/json'"
    if [ -n "$token" ]; then
        headers="$headers -H 'Authorization: Bearer $token'"
    fi

    if [ -n "$data" ]; then
        eval "curl -s -X $method '$API_URL$endpoint' $headers -d '$data'"
    else
        eval "curl -s -X $method '$API_URL$endpoint' $headers"
    fi
}

# Function to register a user
register_user() {
    local email=$1
    local name=$2
    local password=$3

    echo -n "  Registering $name... "

    local response=$(api_call POST "/auth/register" "{\"email\":\"$email\",\"name\":\"$name\",\"password\":\"$password\"}")

    if echo "$response" | grep -q '"success":true'; then
        local user_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        USER_IDS["$email"]="$user_id"
        echo -e "${GREEN}OK${NC} (ID: $user_id)"
        return 0
    else
        echo -e "${YELLOW}Already exists or error${NC}"
        return 1
    fi
}

# Function to login a user
login_user() {
    local email=$1
    local password=$2

    echo -n "  Logging in $email... "

    local response=$(api_call POST "/auth/login" "{\"email\":\"$email\",\"password\":\"$password\"}")

    if echo "$response" | grep -q '"accessToken"'; then
        local token=$(echo "$response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
        local user_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        USER_TOKENS["$email"]="$token"
        USER_IDS["$email"]="$user_id"
        echo -e "${GREEN}OK${NC}"
        return 0
    else
        echo -e "${RED}FAILED${NC}"
        return 1
    fi
}

# Function to create a conversation
create_conversation() {
    local creator_email=$1
    local participant_id=$2
    local name=$3

    local token="${USER_TOKENS[$creator_email]}"

    echo -n "  Creating conversation... "

    local data="{\"participantIds\":[\"$participant_id\"]"
    if [ -n "$name" ]; then
        data="$data,\"name\":\"$name\""
    fi
    data="$data}"

    local response=$(api_call POST "/conversations" "$data" "$token")

    if echo "$response" | grep -q '"success":true'; then
        local conv_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        echo -e "${GREEN}OK${NC} (ID: $conv_id)"
        echo "$conv_id"
        return 0
    else
        echo -e "${RED}FAILED${NC}"
        return 1
    fi
}

# Function to send a message
send_message() {
    local sender_email=$1
    local conversation_id=$2
    local content=$3

    local token="${USER_TOKENS[$sender_email]}"

    echo -n "  Sending message... "

    local response=$(api_call POST "/conversations/$conversation_id/messages" "{\"content\":\"$content\"}" "$token")

    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}OK${NC}"
        return 0
    else
        echo -e "${RED}FAILED${NC}"
        return 1
    fi
}

# Main seeding logic
echo "Step 1: Creating test users"
echo "----------------------------"

register_user "alice@example.com" "Alice Johnson" "password123"
register_user "bob@example.com" "Bob Smith" "password123"
register_user "charlie@example.com" "Charlie Brown" "password123"
register_user "diana@example.com" "Diana Prince" "password123"

echo ""
echo "Step 2: Logging in users"
echo "------------------------"

login_user "alice@example.com" "password123"
login_user "bob@example.com" "password123"
login_user "charlie@example.com" "password123"
login_user "diana@example.com" "password123"

echo ""
echo "Step 3: Creating conversations"
echo "------------------------------"

# Alice and Bob 1:1 conversation
CONV1=$(create_conversation "alice@example.com" "${USER_IDS[bob@example.com]}")

# Alice, Bob, and Charlie group chat
if [ -n "${USER_IDS[charlie@example.com]}" ]; then
    echo -n "  Creating group chat... "
    token="${USER_TOKENS[alice@example.com]}"
    response=$(api_call POST "/conversations" "{\"participantIds\":[\"${USER_IDS[bob@example.com]}\",\"${USER_IDS[charlie@example.com]}\"],\"name\":\"Project Team\"}" "$token")
    if echo "$response" | grep -q '"success":true'; then
        CONV2=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        echo -e "${GREEN}OK${NC} (ID: $CONV2)"
    fi
fi

echo ""
echo "Step 4: Sending sample messages"
echo "--------------------------------"

if [ -n "$CONV1" ]; then
    send_message "alice@example.com" "$CONV1" "Hey Bob! How are you?"
    send_message "bob@example.com" "$CONV1" "Hi Alice! I'm doing great, thanks!"
    send_message "alice@example.com" "$CONV1" "That's wonderful to hear!"
fi

if [ -n "$CONV2" ]; then
    send_message "alice@example.com" "$CONV2" "Welcome to the project team chat!"
    send_message "bob@example.com" "$CONV2" "Thanks for adding me!"
    send_message "charlie@example.com" "$CONV2" "Excited to be here!"
fi

echo ""
echo "========================================"
echo "  Seeding Complete!"
echo "========================================"
echo ""
echo "Test Users:"
echo "  - alice@example.com / password123"
echo "  - bob@example.com / password123"
echo "  - charlie@example.com / password123"
echo "  - diana@example.com / password123"
echo ""
