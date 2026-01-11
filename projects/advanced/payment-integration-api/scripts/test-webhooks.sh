#!/bin/bash

# Webhook Testing Script
# Note: Real webhook testing requires Stripe CLI for signature generation

BASE_URL="${BASE_URL:-http://localhost:3000}"
API_V1="${BASE_URL}/api/v1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    local status=$1
    local message=$2
    case $status in
        "success") echo -e "${GREEN}[SUCCESS]${NC} $message" ;;
        "error") echo -e "${RED}[ERROR]${NC} $message" ;;
        "info") echo -e "${BLUE}[INFO]${NC} $message" ;;
        "warn") echo -e "${YELLOW}[WARN]${NC} $message" ;;
    esac
}

echo "========================================"
echo "Webhook Testing Information"
echo "========================================"
echo ""
print_status "info" "Webhook testing requires proper Stripe signatures."
echo ""
echo "For local testing, use the Stripe CLI:"
echo ""
echo "  1. Install Stripe CLI:"
echo "     brew install stripe/stripe-cli/stripe"
echo ""
echo "  2. Login to your Stripe account:"
echo "     stripe login"
echo ""
echo "  3. Forward webhooks to your local server:"
echo "     stripe listen --forward-to ${API_V1}/webhooks/stripe"
echo ""
echo "  4. Copy the webhook signing secret and add to .env:"
echo "     STRIPE_WEBHOOK_SECRET=whsec_..."
echo ""
echo "  5. Trigger test events:"
echo "     stripe trigger checkout.session.completed"
echo "     stripe trigger payment_intent.payment_failed"
echo ""
echo "========================================"

# Test webhook endpoint without signature (should fail)
test_webhook_without_signature() {
    print_status "info" "Testing webhook without signature (should fail)..."

    response=$(curl -s -X POST "${API_V1}/webhooks/stripe" \
        -H "Content-Type: application/json" \
        -d '{"type": "test"}')

    echo "$response" | jq . 2>/dev/null || echo "$response"

    # Check if it properly rejected the request
    local status=$(echo "$response" | jq -r '.status // empty' 2>/dev/null)
    if [ "$status" == "400" ]; then
        print_status "success" "Webhook properly rejected unsigned request"
    else
        print_status "warn" "Webhook may not be properly validating signatures"
    fi
}

test_webhook_without_signature
