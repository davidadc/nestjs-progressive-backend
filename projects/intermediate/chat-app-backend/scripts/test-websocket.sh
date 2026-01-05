#!/bin/bash

# Chat App - WebSocket Integration Test Script
# This script tests all WebSocket events using a Node.js script with socket.io-client

BASE_URL="${BASE_URL:-http://localhost:3000}"
API_URL="$BASE_URL/api/v1"
WS_URL="${WS_URL:-http://localhost:3000}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================"
echo "  Chat App - WebSocket Tests"
echo "========================================"
echo ""
echo "API URL: $API_URL"
echo "WebSocket URL: $WS_URL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if socket.io-client is installed
if ! node -e "require('socket.io-client')" 2>/dev/null; then
    echo -e "${YELLOW}Installing socket.io-client...${NC}"
    npm install --no-save socket.io-client 2>/dev/null || {
        echo -e "${RED}Failed to install socket.io-client. Please run: npm install socket.io-client${NC}"
        exit 1
    }
fi

# Run the Node.js test script
node "$SCRIPT_DIR/test-websocket.js" "$API_URL" "$WS_URL"
