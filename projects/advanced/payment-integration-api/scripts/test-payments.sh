#!/bin/bash

# Payment Integration API - Test Scripts
# These scripts test the payment API endpoints

BASE_URL="${BASE_URL:-http://localhost:3000}"
API_V1="${BASE_URL}/api/v1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function to print colored output
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

# Helper function to make API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local headers="${4:-}"

    if [ -n "$data" ]; then
        curl -s -X "$method" "${API_V1}${endpoint}" \
            -H "Content-Type: application/json" \
            $headers \
            -d "$data"
    else
        curl -s -X "$method" "${API_V1}${endpoint}" \
            -H "Content-Type: application/json" \
            $headers
    fi
}

# Test: Health Check
test_health_check() {
    print_status "info" "Testing health check..."

    response=$(curl -s "${BASE_URL}/api/v1/payments" -w "\n%{http_code}")
    http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 500 ]; then
        print_status "success" "API is reachable (HTTP $http_code)"
        return 0
    else
        print_status "error" "API is not reachable (HTTP $http_code)"
        return 1
    fi
}

# Test: Initiate Payment
test_initiate_payment() {
    local order_id="${1:-$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid)}"
    local currency="${2:-USD}"

    print_status "info" "Testing payment initiation..."
    print_status "info" "Order ID: $order_id, Currency: $currency"

    local payload='{
        "currency": "'$currency'",
        "returnUrl": "https://example.com/success",
        "cancelUrl": "https://example.com/cancel"
    }'

    response=$(api_call "POST" "/orders/$order_id/checkout" "$payload")
    echo "$response" | jq . 2>/dev/null || echo "$response"

    # Extract payment ID for subsequent tests
    payment_id=$(echo "$response" | jq -r '.data.id // .id // empty' 2>/dev/null)
    if [ -n "$payment_id" ] && [ "$payment_id" != "null" ]; then
        print_status "success" "Payment initiated: $payment_id"
        echo "$payment_id"
    else
        print_status "warn" "Could not extract payment ID from response"
    fi
}

# Test: Get Payment by ID
test_get_payment() {
    local payment_id=$1

    if [ -z "$payment_id" ]; then
        print_status "error" "Payment ID required"
        return 1
    fi

    print_status "info" "Getting payment: $payment_id"

    response=$(api_call "GET" "/payments/$payment_id")
    echo "$response" | jq . 2>/dev/null || echo "$response"
}

# Test: Get Payment Status by Order ID
test_get_payment_status() {
    local order_id=$1

    if [ -z "$order_id" ]; then
        print_status "error" "Order ID required"
        return 1
    fi

    print_status "info" "Getting payment status for order: $order_id"

    response=$(api_call "GET" "/orders/$order_id/payment-status")
    echo "$response" | jq . 2>/dev/null || echo "$response"
}

# Test: List Transactions
test_list_transactions() {
    local page="${1:-1}"
    local limit="${2:-10}"
    local payment_id="${3:-}"

    print_status "info" "Listing transactions (page: $page, limit: $limit)"

    local endpoint="/transactions?page=$page&limit=$limit"
    if [ -n "$payment_id" ]; then
        endpoint="${endpoint}&paymentId=$payment_id"
    fi

    response=$(api_call "GET" "$endpoint")
    echo "$response" | jq . 2>/dev/null || echo "$response"
}

# Test: Refund Payment
test_refund_payment() {
    local payment_id=$1

    if [ -z "$payment_id" ]; then
        print_status "error" "Payment ID required"
        return 1
    fi

    print_status "info" "Refunding payment: $payment_id"

    response=$(api_call "POST" "/payments/$payment_id/refund")
    echo "$response" | jq . 2>/dev/null || echo "$response"
}

# Test: Error Handling (RFC 7807)
test_error_handling() {
    print_status "info" "Testing RFC 7807 error responses..."

    # Test 404 - Payment not found (use valid UUID format)
    print_status "info" "Testing 404 response..."
    response=$(api_call "GET" "/payments/00000000-0000-0000-0000-000000000000")
    echo "$response" | jq . 2>/dev/null || echo "$response"

    # Check if response follows RFC 7807 format
    local has_type=$(echo "$response" | jq -r '.type // empty' 2>/dev/null)
    local has_title=$(echo "$response" | jq -r '.title // empty' 2>/dev/null)
    local has_status=$(echo "$response" | jq -r '.status // empty' 2>/dev/null)

    if [ -n "$has_type" ] && [ -n "$has_title" ] && [ -n "$has_status" ]; then
        print_status "success" "Response follows RFC 7807 format"
    else
        print_status "warn" "Response may not follow RFC 7807 format"
    fi

    # Test 400 - Bad request (invalid UUID)
    print_status "info" "Testing 400 response (invalid UUID)..."
    response=$(api_call "GET" "/payments/invalid-uuid")
    echo "$response" | jq . 2>/dev/null || echo "$response"
}

# Run all tests
run_all_tests() {
    echo "========================================"
    echo "Payment Integration API - Test Suite"
    echo "========================================"
    echo ""

    # Health check
    test_health_check
    echo ""

    # Generate unique order ID (UUID format)
    ORDER_ID=$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid)

    # Initiate payment
    PAYMENT_ID=$(test_initiate_payment "$ORDER_ID" "USD" 2>&1 | tail -n1)
    echo ""

    # Get payment by ID
    if [ -n "$PAYMENT_ID" ] && [ "$PAYMENT_ID" != "null" ]; then
        test_get_payment "$PAYMENT_ID"
        echo ""
    fi

    # Get payment status by order ID
    test_get_payment_status "$ORDER_ID"
    echo ""

    # List transactions
    test_list_transactions 1 10
    echo ""

    # Test error handling
    test_error_handling
    echo ""

    echo "========================================"
    echo "Test Suite Complete"
    echo "========================================"
}

# Command line interface
case "${1:-all}" in
    "health")
        test_health_check
        ;;
    "initiate")
        test_initiate_payment "${2:-}" "${3:-USD}"
        ;;
    "get")
        test_get_payment "$2"
        ;;
    "status")
        test_get_payment_status "$2"
        ;;
    "transactions")
        test_list_transactions "${2:-1}" "${3:-10}" "${4:-}"
        ;;
    "refund")
        test_refund_payment "$2"
        ;;
    "errors")
        test_error_handling
        ;;
    "all")
        run_all_tests
        ;;
    *)
        echo "Usage: $0 {health|initiate|get|status|transactions|refund|errors|all}"
        echo ""
        echo "Commands:"
        echo "  health                      - Test API health"
        echo "  initiate [orderId] [currency] - Initiate payment"
        echo "  get <paymentId>             - Get payment by ID"
        echo "  status <orderId>            - Get payment status by order ID"
        echo "  transactions [page] [limit] [paymentId] - List transactions"
        echo "  refund <paymentId>          - Refund payment"
        echo "  errors                      - Test error handling"
        echo "  all                         - Run all tests"
        ;;
esac
