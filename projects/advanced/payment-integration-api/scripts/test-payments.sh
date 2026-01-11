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

# ===========================================
# HEALTH CHECK TESTS (Phase 16)
# ===========================================

# Test: Main Health Check
test_health_check() {
    print_status "info" "Testing main health check (/health)..."

    response=$(curl -s "${BASE_URL}/health")
    echo "$response" | jq . 2>/dev/null || echo "$response"

    local status=$(echo "$response" | jq -r '.status // empty' 2>/dev/null)
    if [ "$status" == "ok" ]; then
        print_status "success" "Main health check passed"
        return 0
    else
        print_status "error" "Main health check failed"
        return 1
    fi
}

# Test: Readiness Check
test_readiness_check() {
    print_status "info" "Testing readiness check (/health/ready)..."

    response=$(curl -s "${BASE_URL}/health/ready")
    echo "$response" | jq . 2>/dev/null || echo "$response"

    local status=$(echo "$response" | jq -r '.status // empty' 2>/dev/null)
    if [ "$status" == "ok" ]; then
        print_status "success" "Readiness check passed"
        return 0
    else
        print_status "error" "Readiness check failed"
        return 1
    fi
}

# Test: Liveness Check
test_liveness_check() {
    print_status "info" "Testing liveness check (/health/live)..."

    response=$(curl -s "${BASE_URL}/health/live")
    echo "$response" | jq . 2>/dev/null || echo "$response"

    local status=$(echo "$response" | jq -r '.status // empty' 2>/dev/null)
    if [ "$status" == "ok" ]; then
        print_status "success" "Liveness check passed"
        return 0
    else
        print_status "error" "Liveness check failed"
        return 1
    fi
}

# Run all health check tests
run_health_tests() {
    echo ""
    echo "========================================"
    echo "Health Check Tests (Phase 16)"
    echo "========================================"
    echo ""

    test_health_check
    echo ""
    test_readiness_check
    echo ""
    test_liveness_check
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

# ===========================================
# IDEMPOTENCY TESTS (Phase 14)
# ===========================================

# Test: Idempotent payment creation
test_idempotency() {
    print_status "info" "Testing idempotency handling..."

    local order_id=$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid)
    local idempotency_key=$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid)

    local payload='{
        "currency": "USD",
        "returnUrl": "https://example.com/success",
        "cancelUrl": "https://example.com/cancel"
    }'

    # First request with idempotency key
    print_status "info" "First request with Idempotency-Key: $idempotency_key"
    response1=$(curl -s -X POST "${API_V1}/orders/$order_id/checkout" \
        -H "Content-Type: application/json" \
        -H "Idempotency-Key: $idempotency_key" \
        -d "$payload")
    echo "$response1" | jq . 2>/dev/null || echo "$response1"

    local payment_id1=$(echo "$response1" | jq -r '.data.id // empty' 2>/dev/null)

    # Second request with same idempotency key (should return same result)
    print_status "info" "Second request with same Idempotency-Key (should return cached response)..."
    response2=$(curl -s -X POST "${API_V1}/orders/$order_id/checkout" \
        -H "Content-Type: application/json" \
        -H "Idempotency-Key: $idempotency_key" \
        -d "$payload")
    echo "$response2" | jq . 2>/dev/null || echo "$response2"

    local payment_id2=$(echo "$response2" | jq -r '.data.id // empty' 2>/dev/null)

    # Compare results
    if [ -n "$payment_id1" ] && [ "$payment_id1" == "$payment_id2" ]; then
        print_status "success" "Idempotency working: Same payment ID returned ($payment_id1)"
    elif [ -n "$payment_id1" ] && [ -n "$payment_id2" ]; then
        print_status "warn" "Different payment IDs returned (idempotency may not be working)"
        print_status "info" "  First:  $payment_id1"
        print_status "info" "  Second: $payment_id2"
    else
        print_status "warn" "Could not verify idempotency (check response format)"
    fi
}

# Test: Different idempotency keys create different payments
test_idempotency_different_keys() {
    print_status "info" "Testing different idempotency keys create different payments..."

    local order_id1=$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid)
    local order_id2=$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid)
    local key1=$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid)
    local key2=$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid)

    local payload='{
        "currency": "USD",
        "returnUrl": "https://example.com/success",
        "cancelUrl": "https://example.com/cancel"
    }'

    # First request
    response1=$(curl -s -X POST "${API_V1}/orders/$order_id1/checkout" \
        -H "Content-Type: application/json" \
        -H "Idempotency-Key: $key1" \
        -d "$payload")
    local payment_id1=$(echo "$response1" | jq -r '.data.id // empty' 2>/dev/null)

    # Second request with different key
    response2=$(curl -s -X POST "${API_V1}/orders/$order_id2/checkout" \
        -H "Content-Type: application/json" \
        -H "Idempotency-Key: $key2" \
        -d "$payload")
    local payment_id2=$(echo "$response2" | jq -r '.data.id // empty' 2>/dev/null)

    if [ -n "$payment_id1" ] && [ -n "$payment_id2" ] && [ "$payment_id1" != "$payment_id2" ]; then
        print_status "success" "Different keys create different payments"
    else
        print_status "warn" "Could not verify different keys behavior"
    fi
}

# Run all idempotency tests
run_idempotency_tests() {
    echo ""
    echo "========================================"
    echo "Idempotency Tests (Phase 14)"
    echo "========================================"
    echo ""

    test_idempotency
    echo ""
    test_idempotency_different_keys
}

# ===========================================
# RATE LIMITING TESTS (Phase 15)
# ===========================================

# Test: Rate limiting on payment endpoints
test_rate_limiting() {
    print_status "info" "Testing rate limiting (sending rapid requests)..."

    local endpoint="/payments/00000000-0000-0000-0000-000000000000"
    local rate_limited=false
    local request_count=0
    local rate_limit_count=0

    # Send rapid requests to trigger rate limiting
    for i in {1..25}; do
        response=$(curl -s -w "\n%{http_code}" -X GET "${API_V1}${endpoint}")
        http_code=$(echo "$response" | tail -n1)
        ((request_count++))

        if [ "$http_code" == "429" ]; then
            rate_limited=true
            ((rate_limit_count++))
        fi
    done

    if [ "$rate_limited" = true ]; then
        print_status "success" "Rate limiting triggered ($rate_limit_count/25 requests returned 429)"

        # Check RFC 7807 format for rate limit response
        response=$(curl -s -X GET "${API_V1}${endpoint}")
        for i in {1..20}; do
            response=$(curl -s -X GET "${API_V1}${endpoint}")
            local status=$(echo "$response" | jq -r '.status // empty' 2>/dev/null)
            if [ "$status" == "429" ]; then
                echo "$response" | jq . 2>/dev/null
                local has_type=$(echo "$response" | jq -r '.type // empty' 2>/dev/null)
                if [ -n "$has_type" ]; then
                    print_status "success" "Rate limit response follows RFC 7807 format"
                fi
                break
            fi
        done
    else
        print_status "warn" "Rate limiting not triggered after $request_count requests"
        print_status "info" "  This may be expected if rate limits are set high"
    fi
}

# Test: Rate limit headers
test_rate_limit_headers() {
    print_status "info" "Testing rate limit headers..."

    response=$(curl -s -i -X GET "${API_V1}/payments/00000000-0000-0000-0000-000000000000" 2>&1)

    # Check for rate limit headers
    local has_limit=$(echo "$response" | grep -i "x-ratelimit-limit" | head -1)
    local has_remaining=$(echo "$response" | grep -i "x-ratelimit-remaining" | head -1)
    local has_reset=$(echo "$response" | grep -i "x-ratelimit-reset" | head -1)

    if [ -n "$has_limit" ]; then
        print_status "success" "Rate limit header found: $has_limit"
    fi
    if [ -n "$has_remaining" ]; then
        print_status "success" "Rate remaining header found: $has_remaining"
    fi
    if [ -n "$has_reset" ]; then
        print_status "success" "Rate reset header found: $has_reset"
    fi

    if [ -z "$has_limit" ] && [ -z "$has_remaining" ] && [ -z "$has_reset" ]; then
        print_status "warn" "No rate limit headers found (may be configured differently)"
    fi
}

# Run all rate limiting tests
run_rate_limit_tests() {
    echo ""
    echo "========================================"
    echo "Rate Limiting Tests (Phase 15)"
    echo "========================================"
    echo ""

    test_rate_limit_headers
    echo ""
    test_rate_limiting
}

# Run all tests
run_all_tests() {
    echo "========================================"
    echo "Payment Integration API - Test Suite"
    echo "========================================"
    echo ""

    # Health checks (Phase 16)
    run_health_tests
    echo ""

    # Generate unique order ID (UUID format)
    ORDER_ID=$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid)

    echo "========================================"
    echo "Payment API Tests"
    echo "========================================"
    echo ""

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

    # Idempotency tests (Phase 14)
    run_idempotency_tests
    echo ""

    # Rate limiting tests (Phase 15)
    run_rate_limit_tests
    echo ""

    echo "========================================"
    echo "Test Suite Complete"
    echo "========================================"
}

# Command line interface
case "${1:-all}" in
    "health")
        run_health_tests
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
    "idempotency")
        run_idempotency_tests
        ;;
    "ratelimit")
        run_rate_limit_tests
        ;;
    "all")
        run_all_tests
        ;;
    *)
        echo "Usage: $0 {health|initiate|get|status|transactions|refund|errors|idempotency|ratelimit|all}"
        echo ""
        echo "Commands:"
        echo "  health                      - Test health endpoints (Phase 16)"
        echo "  initiate [orderId] [currency] - Initiate payment"
        echo "  get <paymentId>             - Get payment by ID"
        echo "  status <orderId>            - Get payment status by order ID"
        echo "  transactions [page] [limit] [paymentId] - List transactions"
        echo "  refund <paymentId>          - Refund payment"
        echo "  errors                      - Test error handling (RFC 7807)"
        echo "  idempotency                 - Test idempotency handling (Phase 14)"
        echo "  ratelimit                   - Test rate limiting (Phase 15)"
        echo "  all                         - Run all tests"
        ;;
esac
