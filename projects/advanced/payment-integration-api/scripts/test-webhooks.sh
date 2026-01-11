#!/bin/bash

# Webhook Testing Script
# Tests various webhook scenarios including security validation

BASE_URL="${BASE_URL:-http://localhost:3000}"
API_V1="${BASE_URL}/api/v1"
WEBHOOK_ENDPOINT="${API_V1}/webhooks/stripe"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

print_status() {
    local status=$1
    local message=$2
    case $status in
        "success") echo -e "${GREEN}[SUCCESS]${NC} $message" ;;
        "error") echo -e "${RED}[ERROR]${NC} $message" ;;
        "info") echo -e "${BLUE}[INFO]${NC} $message" ;;
        "warn") echo -e "${YELLOW}[WARN]${NC} $message" ;;
        "test") echo -e "${CYAN}[TEST]${NC} $message" ;;
    esac
}

# Helper to check response status
check_response() {
    local response=$1
    local expected_status=$2
    local test_name=$3

    local actual_status=$(echo "$response" | jq -r '.status // empty' 2>/dev/null)

    if [ "$actual_status" == "$expected_status" ]; then
        print_status "success" "$test_name (HTTP $actual_status)"
        ((TESTS_PASSED++))
        return 0
    else
        print_status "error" "$test_name - Expected $expected_status, got $actual_status"
        ((TESTS_FAILED++))
        return 1
    fi
}

print_header() {
    echo ""
    echo "========================================"
    echo "$1"
    echo "========================================"
    echo ""
}

# ===========================================
# SECURITY TESTS
# ===========================================

# Test 1: Webhook without signature header
test_missing_signature() {
    print_status "test" "1. Missing stripe-signature header"

    response=$(curl -s -X POST "$WEBHOOK_ENDPOINT" \
        -H "Content-Type: application/json" \
        -d '{"type": "payment_intent.succeeded"}')

    echo "$response" | jq . 2>/dev/null || echo "$response"
    check_response "$response" "400" "Missing signature rejected"
}

# Test 2: Webhook with invalid signature
test_invalid_signature() {
    print_status "test" "2. Invalid stripe-signature header"

    response=$(curl -s -X POST "$WEBHOOK_ENDPOINT" \
        -H "Content-Type: application/json" \
        -H "stripe-signature: t=1234567890,v1=invalid_signature_here" \
        -d '{"type": "payment_intent.succeeded", "id": "evt_test"}')

    echo "$response" | jq . 2>/dev/null || echo "$response"
    check_response "$response" "400" "Invalid signature rejected"
}

# Test 3: Webhook with malformed signature format
test_malformed_signature() {
    print_status "test" "3. Malformed signature format"

    response=$(curl -s -X POST "$WEBHOOK_ENDPOINT" \
        -H "Content-Type: application/json" \
        -H "stripe-signature: this_is_not_a_valid_format" \
        -d '{"type": "payment_intent.succeeded"}')

    echo "$response" | jq . 2>/dev/null || echo "$response"
    check_response "$response" "400" "Malformed signature rejected"
}

# Test 4: Webhook with empty signature
test_empty_signature() {
    print_status "test" "4. Empty stripe-signature header"

    response=$(curl -s -X POST "$WEBHOOK_ENDPOINT" \
        -H "Content-Type: application/json" \
        -H "stripe-signature: " \
        -d '{"type": "payment_intent.succeeded"}')

    echo "$response" | jq . 2>/dev/null || echo "$response"
    check_response "$response" "400" "Empty signature rejected"
}

# ===========================================
# PAYLOAD VALIDATION TESTS
# ===========================================

# Test 5: Empty payload
test_empty_payload() {
    print_status "test" "5. Empty request payload"

    response=$(curl -s -X POST "$WEBHOOK_ENDPOINT" \
        -H "Content-Type: application/json" \
        -H "stripe-signature: t=1234567890,v1=test" \
        -d '')

    echo "$response" | jq . 2>/dev/null || echo "$response"
    check_response "$response" "400" "Empty payload rejected"
}

# Test 6: Malformed JSON payload
test_malformed_json() {
    print_status "test" "6. Malformed JSON payload"

    response=$(curl -s -X POST "$WEBHOOK_ENDPOINT" \
        -H "Content-Type: application/json" \
        -H "stripe-signature: t=1234567890,v1=test" \
        -d '{invalid json}')

    echo "$response" | jq . 2>/dev/null || echo "$response"
    check_response "$response" "400" "Malformed JSON rejected"
}

# Test 7: Wrong content type
test_wrong_content_type() {
    print_status "test" "7. Wrong Content-Type header"

    response=$(curl -s -X POST "$WEBHOOK_ENDPOINT" \
        -H "Content-Type: text/plain" \
        -H "stripe-signature: t=1234567890,v1=test" \
        -d '{"type": "payment_intent.succeeded"}')

    echo "$response" | jq . 2>/dev/null || echo "$response"
    # This might return 400 or be handled differently
    local status=$(echo "$response" | jq -r '.status // empty' 2>/dev/null)
    if [ -n "$status" ]; then
        print_status "success" "Wrong content type handled (HTTP $status)"
        ((TESTS_PASSED++))
    else
        print_status "warn" "Content type validation unclear"
    fi
}

# Test 8: GET request instead of POST
test_wrong_http_method() {
    print_status "test" "8. Wrong HTTP method (GET instead of POST)"

    response=$(curl -s -X GET "$WEBHOOK_ENDPOINT" \
        -H "Content-Type: application/json")

    echo "$response" | jq . 2>/dev/null || echo "$response"
    local status=$(echo "$response" | jq -r '.status // empty' 2>/dev/null)
    if [ "$status" == "404" ] || [ "$status" == "405" ]; then
        print_status "success" "Wrong HTTP method rejected (HTTP $status)"
        ((TESTS_PASSED++))
    else
        print_status "warn" "Unexpected response for wrong method"
    fi
}

# ===========================================
# RFC 7807 FORMAT TESTS
# ===========================================

# Test 9: Verify RFC 7807 error format
test_rfc7807_format() {
    print_status "test" "9. RFC 7807 Problem Details format"

    response=$(curl -s -X POST "$WEBHOOK_ENDPOINT" \
        -H "Content-Type: application/json" \
        -d '{"type": "test"}')

    local has_type=$(echo "$response" | jq -r '.type // empty' 2>/dev/null)
    local has_title=$(echo "$response" | jq -r '.title // empty' 2>/dev/null)
    local has_status=$(echo "$response" | jq -r '.status // empty' 2>/dev/null)
    local has_detail=$(echo "$response" | jq -r '.detail // empty' 2>/dev/null)
    local has_instance=$(echo "$response" | jq -r '.instance // empty' 2>/dev/null)
    local has_timestamp=$(echo "$response" | jq -r '.timestamp // empty' 2>/dev/null)
    local has_traceId=$(echo "$response" | jq -r '.traceId // empty' 2>/dev/null)

    echo "  type:      ${has_type:-missing}"
    echo "  title:     ${has_title:-missing}"
    echo "  status:    ${has_status:-missing}"
    echo "  detail:    ${has_detail:-missing}"
    echo "  instance:  ${has_instance:-missing}"
    echo "  timestamp: ${has_timestamp:-missing}"
    echo "  traceId:   ${has_traceId:-missing}"

    if [ -n "$has_type" ] && [ -n "$has_title" ] && [ -n "$has_status" ] && \
       [ -n "$has_detail" ] && [ -n "$has_instance" ] && [ -n "$has_timestamp" ] && \
       [ -n "$has_traceId" ]; then
        print_status "success" "Full RFC 7807 format with extensions"
        ((TESTS_PASSED++))
    elif [ -n "$has_type" ] && [ -n "$has_title" ] && [ -n "$has_status" ]; then
        print_status "success" "Basic RFC 7807 format"
        ((TESTS_PASSED++))
    else
        print_status "error" "Missing RFC 7807 required fields"
        ((TESTS_FAILED++))
    fi
}

# ===========================================
# STRIPE CLI INTEGRATION TESTS
# ===========================================

# Check if Stripe CLI is available
check_stripe_cli() {
    if command -v stripe &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# Test with Stripe CLI (real signatures)
test_with_stripe_cli() {
    print_status "test" "10. Stripe CLI integration test"

    if ! check_stripe_cli; then
        print_status "warn" "Stripe CLI not installed - skipping"
        echo "  Install with: brew install stripe/stripe-cli/stripe"
        return
    fi

    # Check if stripe listen is running
    if ! pgrep -f "stripe listen" > /dev/null; then
        print_status "warn" "Stripe CLI listener not running"
        echo "  Start with: stripe listen --forward-to $WEBHOOK_ENDPOINT"
        return
    fi

    print_status "info" "Triggering test webhook events via Stripe CLI..."

    # Trigger payment_intent.succeeded
    echo ""
    print_status "info" "Triggering payment_intent.succeeded..."
    stripe trigger payment_intent.succeeded 2>&1 | head -5

    sleep 2

    # Trigger payment_intent.payment_failed
    echo ""
    print_status "info" "Triggering payment_intent.payment_failed..."
    stripe trigger payment_intent.payment_failed 2>&1 | head -5

    print_status "success" "Stripe CLI events triggered"
    ((TESTS_PASSED++))
}

# ===========================================
# RUN ALL TESTS
# ===========================================

run_security_tests() {
    print_header "Security Validation Tests"
    test_missing_signature
    echo ""
    test_invalid_signature
    echo ""
    test_malformed_signature
    echo ""
    test_empty_signature
}

run_payload_tests() {
    print_header "Payload Validation Tests"
    test_empty_payload
    echo ""
    test_malformed_json
    echo ""
    test_wrong_content_type
    echo ""
    test_wrong_http_method
}

run_format_tests() {
    print_header "Response Format Tests"
    test_rfc7807_format
}

run_cli_tests() {
    print_header "Stripe CLI Integration Tests"
    test_with_stripe_cli
}

print_summary() {
    print_header "Test Summary"
    echo -e "  ${GREEN}Passed:${NC} $TESTS_PASSED"
    echo -e "  ${RED}Failed:${NC} $TESTS_FAILED"
    echo ""

    if [ $TESTS_FAILED -eq 0 ]; then
        print_status "success" "All tests passed!"
    else
        print_status "error" "Some tests failed"
    fi
}

print_instructions() {
    print_header "Stripe CLI Setup Instructions"
    print_status "info" "For complete webhook testing, use the Stripe CLI:"
    echo ""
    echo "  1. Install Stripe CLI:"
    echo "     brew install stripe/stripe-cli/stripe  # macOS"
    echo "     # Or download from: https://stripe.com/docs/stripe-cli"
    echo ""
    echo "  2. Login to your Stripe account:"
    echo "     stripe login"
    echo ""
    echo "  3. Forward webhooks to your local server:"
    echo "     stripe listen --forward-to $WEBHOOK_ENDPOINT"
    echo ""
    echo "  4. Copy the webhook signing secret and add to .env:"
    echo "     STRIPE_WEBHOOK_SECRET=whsec_..."
    echo ""
    echo "  5. Available test events:"
    echo "     stripe trigger payment_intent.succeeded"
    echo "     stripe trigger payment_intent.payment_failed"
    echo "     stripe trigger checkout.session.completed"
    echo "     stripe trigger checkout.session.expired"
    echo "     stripe trigger charge.refunded"
    echo "     stripe trigger charge.dispute.created"
    echo ""
    echo "  6. List all available events:"
    echo "     stripe trigger --help"
    echo ""
}

run_all_tests() {
    echo "========================================"
    echo "Webhook Security & Validation Test Suite"
    echo "========================================"

    run_security_tests
    run_payload_tests
    run_format_tests
    run_cli_tests
    print_summary
    print_instructions
}

# Command line interface
case "${1:-all}" in
    "security")
        run_security_tests
        print_summary
        ;;
    "payload")
        run_payload_tests
        print_summary
        ;;
    "format")
        run_format_tests
        print_summary
        ;;
    "cli")
        run_cli_tests
        ;;
    "instructions"|"help")
        print_instructions
        ;;
    "all")
        run_all_tests
        ;;
    *)
        echo "Usage: $0 {all|security|payload|format|cli|instructions}"
        echo ""
        echo "Commands:"
        echo "  all          - Run all webhook tests"
        echo "  security     - Run security validation tests"
        echo "  payload      - Run payload validation tests"
        echo "  format       - Run RFC 7807 format tests"
        echo "  cli          - Run Stripe CLI integration tests"
        echo "  instructions - Show Stripe CLI setup instructions"
        ;;
esac
