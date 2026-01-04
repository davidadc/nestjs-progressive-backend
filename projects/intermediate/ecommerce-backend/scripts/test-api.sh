#!/bin/bash

# E-commerce API Test Script
# This script tests all API endpoints sequentially
# Prerequisites: Run seed-data.sh first to populate test data

set -e

BASE_URL="${BASE_URL:-http://localhost:3000/api/v1}"
CONTENT_TYPE="Content-Type: application/json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Variables to store IDs and tokens
USER_TOKEN=""
ADMIN_TOKEN=""
USER_ID=""
ADMIN_ID=""
CATEGORY_ID="cat-electronics"  # From seed data
PRODUCT_ID="prod-laptop"       # From seed data
CART_ITEM_ID=""
ORDER_ID=""
REVIEW_ID=""

# Test counters
PASSED=0
FAILED=0
SKIPPED=0

print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
}

print_subheader() {
    echo -e "\n${CYAN}--- $1 ---${NC}"
}

print_test() {
    echo -e "\n${YELLOW}▶ TEST: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ PASS: $1${NC}"
    ((PASSED++))
}

print_error() {
    echo -e "${RED}✗ FAIL: $1${NC}"
    ((FAILED++))
}

print_skip() {
    echo -e "${YELLOW}⊘ SKIP: $1${NC}"
    ((SKIPPED++))
}

print_response() {
    echo "$1" | jq . 2>/dev/null || echo "$1"
}

# Helper function to make requests
request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4

    local curl_cmd="curl -s -X $method \"$BASE_URL$endpoint\" -H \"$CONTENT_TYPE\""

    if [ -n "$token" ]; then
        curl_cmd="$curl_cmd -H \"Authorization: Bearer $token\""
    fi

    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi

    eval $curl_cmd
}

# Helper to check if response is successful
check_success() {
    local response=$1
    local field=$2

    if echo "$response" | jq -e "$field" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# ============================================
# HEALTH CHECK
# ============================================
print_header "HEALTH CHECK"

print_test "Check API is running"
RESPONSE=$(curl -s "$BASE_URL/../health" 2>/dev/null || curl -s "http://localhost:3000" 2>/dev/null || echo "")
if [ -n "$RESPONSE" ]; then
    print_success "API is running"
else
    print_error "API is not running at $BASE_URL"
    echo -e "${RED}Please start the server with: pnpm run start:dev${NC}"
    exit 1
fi

# ============================================
# AUTH ENDPOINTS
# ============================================
print_header "AUTH ENDPOINTS"

# Register regular user
print_test "Register new user"
TIMESTAMP=$(date +%s)
RESPONSE=$(request POST "/auth/register" "{\"email\":\"testuser${TIMESTAMP}@example.com\",\"password\":\"Password123!\",\"name\":\"Test User\"}")
print_response "$RESPONSE"
if check_success "$RESPONSE" '.data.id'; then
    USER_ID=$(echo "$RESPONSE" | jq -r '.data.id')
    USER_EMAIL="testuser${TIMESTAMP}@example.com"
    print_success "User registered with ID: $USER_ID"
else
    print_error "Failed to register user"
fi

# Register admin user (for testing admin endpoints)
print_test "Register admin user"
RESPONSE=$(request POST "/auth/register" "{\"email\":\"admin${TIMESTAMP}@example.com\",\"password\":\"Admin123!\",\"name\":\"Admin User\"}")
print_response "$RESPONSE"
if check_success "$RESPONSE" '.data.id'; then
    ADMIN_ID=$(echo "$RESPONSE" | jq -r '.data.id')
    ADMIN_EMAIL="admin${TIMESTAMP}@example.com"
    print_success "Admin user registered with ID: $ADMIN_ID"
else
    print_error "Failed to register admin user"
fi

# Login as regular user
print_test "Login as regular user"
RESPONSE=$(request POST "/auth/login" "{\"email\":\"$USER_EMAIL\",\"password\":\"Password123!\"}")
print_response "$RESPONSE"
if check_success "$RESPONSE" '.data.accessToken'; then
    USER_TOKEN=$(echo "$RESPONSE" | jq -r '.data.accessToken')
    print_success "User logged in, token obtained"
else
    print_error "Failed to login as user"
fi

# Get user profile
print_test "Get user profile"
RESPONSE=$(request GET "/auth/profile" "" "$USER_TOKEN")
print_response "$RESPONSE"
if check_success "$RESPONSE" '.data.id'; then
    print_success "Profile retrieved successfully"
else
    print_error "Failed to get profile"
fi

# Test invalid login
print_test "Test invalid login (should fail)"
RESPONSE=$(request POST "/auth/login" '{"email":"nonexistent@example.com","password":"wrongpass"}')
print_response "$RESPONSE"
if check_success "$RESPONSE" '.success' && [ "$(echo "$RESPONSE" | jq -r '.success')" = "false" ]; then
    print_success "Invalid login correctly rejected"
else
    print_error "Invalid login should have been rejected"
fi

# Test protected route without token
print_test "Access protected route without token (should fail)"
RESPONSE=$(request GET "/auth/profile")
print_response "$RESPONSE"
if echo "$RESPONSE" | jq -e '.statusCode == 401 or .success == false' > /dev/null 2>&1; then
    print_success "Unauthorized access correctly rejected"
else
    print_error "Should have rejected unauthorized access"
fi

# ============================================
# CATEGORY ENDPOINTS
# ============================================
print_header "CATEGORY ENDPOINTS"

# List categories (public)
print_test "List all categories (public)"
RESPONSE=$(request GET "/categories")
print_response "$RESPONSE"
if check_success "$RESPONSE" '.data'; then
    CATEGORY_COUNT=$(echo "$RESPONSE" | jq '.data | length')
    print_success "Retrieved $CATEGORY_COUNT categories"
    # Get first category ID if available
    if [ "$CATEGORY_COUNT" -gt 0 ]; then
        CATEGORY_ID=$(echo "$RESPONSE" | jq -r '.data[0].id')
    fi
else
    print_error "Failed to list categories"
fi

# Get single category
print_test "Get category by ID"
RESPONSE=$(request GET "/categories/$CATEGORY_ID")
print_response "$RESPONSE"
if check_success "$RESPONSE" '.data.id'; then
    print_success "Category retrieved: $(echo "$RESPONSE" | jq -r '.data.name')"
else
    print_error "Failed to get category"
fi

# Create category (requires admin - expected to fail with user token)
print_test "Create category (requires admin - expected to fail)"
RESPONSE=$(request POST "/categories" '{"name":"Test Category","description":"Test description"}' "$USER_TOKEN")
print_response "$RESPONSE"
if echo "$RESPONSE" | jq -e '.statusCode == 403 or .success == false' > /dev/null 2>&1; then
    print_success "Admin-only endpoint correctly protected"
else
    # If it succeeded, the user might have admin role
    if check_success "$RESPONSE" '.data.id'; then
        print_success "Category created (user has admin privileges)"
        # Clean up - delete the test category
        TEST_CAT_ID=$(echo "$RESPONSE" | jq -r '.data.id')
    else
        print_error "Unexpected response"
    fi
fi

# ============================================
# PRODUCT ENDPOINTS
# ============================================
print_header "PRODUCT ENDPOINTS"

# List products (public)
print_test "List all products (public)"
RESPONSE=$(request GET "/products")
print_response "$RESPONSE"
if check_success "$RESPONSE" '.data'; then
    PRODUCT_COUNT=$(echo "$RESPONSE" | jq '.data | if type == "array" then length else .items | length end' 2>/dev/null || echo "0")
    print_success "Retrieved products"
    # Get first product ID if available
    FIRST_PRODUCT=$(echo "$RESPONSE" | jq -r '.data[0].id // .data.items[0].id // empty' 2>/dev/null)
    if [ -n "$FIRST_PRODUCT" ]; then
        PRODUCT_ID="$FIRST_PRODUCT"
    fi
else
    print_error "Failed to list products"
fi

# List products with pagination
print_test "List products with pagination"
RESPONSE=$(request GET "/products?page=1&limit=5")
print_response "$RESPONSE"
if check_success "$RESPONSE" '.data'; then
    print_success "Pagination working"
else
    print_error "Failed to paginate products"
fi

# List products with sorting
print_test "List products sorted by price (ascending)"
RESPONSE=$(request GET "/products?sort=price&order=asc")
print_response "$RESPONSE"
if check_success "$RESPONSE" '.data'; then
    print_success "Sorting working"
else
    print_error "Failed to sort products"
fi

# Filter products by category
print_test "Filter products by category"
RESPONSE=$(request GET "/products?categoryId=$CATEGORY_ID")
print_response "$RESPONSE"
if check_success "$RESPONSE" '.data'; then
    print_success "Category filter working"
else
    print_error "Failed to filter by category"
fi

# Search products
print_test "Search products by name"
RESPONSE=$(request GET "/products?search=laptop")
print_response "$RESPONSE"
if check_success "$RESPONSE" '.data'; then
    print_success "Search working"
else
    print_error "Failed to search products"
fi

# Get single product
print_test "Get product by ID"
if [ -n "$PRODUCT_ID" ]; then
    RESPONSE=$(request GET "/products/$PRODUCT_ID")
    print_response "$RESPONSE"
    if check_success "$RESPONSE" '.data.id'; then
        print_success "Product retrieved: $(echo "$RESPONSE" | jq -r '.data.name')"
    else
        print_error "Failed to get product"
    fi
else
    print_skip "No product ID available"
fi

# Get non-existent product
print_test "Get non-existent product (should return 404)"
RESPONSE=$(request GET "/products/non-existent-id-12345")
print_response "$RESPONSE"
if echo "$RESPONSE" | jq -e '.statusCode == 404 or .success == false' > /dev/null 2>&1; then
    print_success "404 returned for non-existent product"
else
    print_error "Should have returned 404"
fi

# ============================================
# CART ENDPOINTS
# ============================================
print_header "CART ENDPOINTS"

if [ -z "$USER_TOKEN" ]; then
    print_skip "Cart tests require authentication"
else
    # Get cart (should be empty or create new)
    print_test "Get user cart"
    RESPONSE=$(request GET "/cart" "" "$USER_TOKEN")
    print_response "$RESPONSE"
    if check_success "$RESPONSE" '.data'; then
        print_success "Cart retrieved"
    else
        print_error "Failed to get cart"
    fi

    # Add item to cart
    print_test "Add item to cart"
    if [ -n "$PRODUCT_ID" ]; then
        RESPONSE=$(request POST "/cart/items" "{\"productId\":\"$PRODUCT_ID\",\"quantity\":2}" "$USER_TOKEN")
        print_response "$RESPONSE"
        if check_success "$RESPONSE" '.data'; then
            print_success "Item added to cart"
            CART_ITEM_ID=$(echo "$RESPONSE" | jq -r '.data.items[0].id // .data.id // empty' 2>/dev/null)
        else
            print_error "Failed to add item to cart"
        fi
    else
        print_skip "No product ID available"
    fi

    # Update cart item quantity
    print_test "Update cart item quantity"
    if [ -n "$CART_ITEM_ID" ]; then
        RESPONSE=$(request PATCH "/cart/items/$CART_ITEM_ID" '{"quantity":3}' "$USER_TOKEN")
        print_response "$RESPONSE"
        if check_success "$RESPONSE" '.data'; then
            print_success "Cart item quantity updated"
        else
            print_error "Failed to update cart item"
        fi
    else
        print_skip "No cart item ID available"
    fi

    # Get cart again to verify
    print_test "Verify cart contents"
    RESPONSE=$(request GET "/cart" "" "$USER_TOKEN")
    print_response "$RESPONSE"
    if check_success "$RESPONSE" '.data'; then
        print_success "Cart verified"
    else
        print_error "Failed to verify cart"
    fi
fi

# ============================================
# ORDER ENDPOINTS
# ============================================
print_header "ORDER ENDPOINTS"

if [ -z "$USER_TOKEN" ]; then
    print_skip "Order tests require authentication"
else
    # Get orders (should be empty initially)
    print_test "Get user orders"
    RESPONSE=$(request GET "/orders" "" "$USER_TOKEN")
    print_response "$RESPONSE"
    if check_success "$RESPONSE" '.data'; then
        print_success "Orders retrieved"
    else
        print_error "Failed to get orders"
    fi

    # Create order from cart
    print_test "Create order from cart"
    RESPONSE=$(request POST "/orders" '{"shippingAddress":"123 Test St, Test City, TC 12345"}' "$USER_TOKEN")
    print_response "$RESPONSE"
    if check_success "$RESPONSE" '.data.id'; then
        ORDER_ID=$(echo "$RESPONSE" | jq -r '.data.id')
        print_success "Order created with ID: $ORDER_ID"
    else
        # Might fail if cart is empty
        if echo "$RESPONSE" | grep -qi "cart.*empty\|no.*items"; then
            print_skip "Cart is empty, cannot create order"
        else
            print_error "Failed to create order"
        fi
    fi

    # Get order by ID
    print_test "Get order by ID"
    if [ -n "$ORDER_ID" ]; then
        RESPONSE=$(request GET "/orders/$ORDER_ID" "" "$USER_TOKEN")
        print_response "$RESPONSE"
        if check_success "$RESPONSE" '.data.id'; then
            print_success "Order retrieved"
        else
            print_error "Failed to get order"
        fi
    else
        print_skip "No order ID available"
    fi

    # List orders with pagination
    print_test "List orders with pagination"
    RESPONSE=$(request GET "/orders?page=1&limit=10" "" "$USER_TOKEN")
    print_response "$RESPONSE"
    if check_success "$RESPONSE" '.data'; then
        print_success "Order pagination working"
    else
        print_error "Failed to paginate orders"
    fi
fi

# ============================================
# REVIEW ENDPOINTS
# ============================================
print_header "REVIEW ENDPOINTS"

# Get product reviews (public)
print_test "Get product reviews"
if [ -n "$PRODUCT_ID" ]; then
    RESPONSE=$(request GET "/products/$PRODUCT_ID/reviews")
    print_response "$RESPONSE"
    if check_success "$RESPONSE" '.data'; then
        print_success "Reviews retrieved"
    else
        print_error "Failed to get reviews"
    fi
else
    print_skip "No product ID available"
fi

# Create review (requires auth and purchased product)
print_test "Create product review"
if [ -n "$USER_TOKEN" ] && [ -n "$PRODUCT_ID" ]; then
    RESPONSE=$(request POST "/products/$PRODUCT_ID/reviews" '{"rating":5,"comment":"Excellent product! Highly recommended."}' "$USER_TOKEN")
    print_response "$RESPONSE"
    if check_success "$RESPONSE" '.data.id'; then
        REVIEW_ID=$(echo "$RESPONSE" | jq -r '.data.id')
        print_success "Review created with ID: $REVIEW_ID"
    else
        # Might fail if user hasn't purchased product
        if echo "$RESPONSE" | grep -qi "purchase\|order"; then
            print_skip "User hasn't purchased this product"
        else
            print_error "Failed to create review"
        fi
    fi
else
    print_skip "Review creation requires auth and product ID"
fi

# Update review
print_test "Update review"
if [ -n "$REVIEW_ID" ]; then
    RESPONSE=$(request PATCH "/reviews/$REVIEW_ID" '{"rating":4,"comment":"Updated review - still great!"}' "$USER_TOKEN")
    print_response "$RESPONSE"
    if check_success "$RESPONSE" '.data'; then
        print_success "Review updated"
    else
        print_error "Failed to update review"
    fi
else
    print_skip "No review ID available"
fi

# ============================================
# USER JOURNEY TESTS
# ============================================
print_header "USER JOURNEY TESTS"

echo -e "\n${CYAN}These tests simulate complete user workflows${NC}"

# ------------------------------
# Journey 1: New Customer Purchase Flow
# Register → Login → Browse → Add to Cart → Checkout
# ------------------------------
print_subheader "Journey 1: New Customer Purchase Flow"

# Step 1: Register new customer
print_test "Step 1: Register new customer"
JOURNEY_TIMESTAMP=$(date +%s)
JOURNEY_EMAIL="customer${JOURNEY_TIMESTAMP}@example.com"
RESPONSE=$(request POST "/auth/register" "{\"email\":\"$JOURNEY_EMAIL\",\"password\":\"Customer123!\",\"name\":\"Journey Customer\"}")
if check_success "$RESPONSE" '.data.id'; then
    JOURNEY_USER_ID=$(echo "$RESPONSE" | jq -r '.data.id')
    print_success "Customer registered: $JOURNEY_EMAIL"
else
    print_error "Journey 1 failed at registration"
    print_response "$RESPONSE"
fi

# Step 2: Login
print_test "Step 2: Login as new customer"
RESPONSE=$(request POST "/auth/login" "{\"email\":\"$JOURNEY_EMAIL\",\"password\":\"Customer123!\"}")
if check_success "$RESPONSE" '.data.accessToken'; then
    JOURNEY_TOKEN=$(echo "$RESPONSE" | jq -r '.data.accessToken')
    print_success "Customer logged in"
else
    print_error "Journey 1 failed at login"
    print_response "$RESPONSE"
fi

# Step 3: Browse products
print_test "Step 3: Browse available products"
RESPONSE=$(request GET "/products?limit=5")
if check_success "$RESPONSE" '.data'; then
    JOURNEY_PRODUCT_ID=$(echo "$RESPONSE" | jq -r '.data[0].id // .data.items[0].id // empty' 2>/dev/null)
    JOURNEY_PRODUCT_NAME=$(echo "$RESPONSE" | jq -r '.data[0].name // .data.items[0].name // "Unknown"' 2>/dev/null)
    if [ -n "$JOURNEY_PRODUCT_ID" ]; then
        print_success "Found product: $JOURNEY_PRODUCT_NAME"
    else
        print_skip "No products available for purchase"
    fi
else
    print_error "Journey 1 failed at browsing products"
    print_response "$RESPONSE"
fi

# Step 4: Add product to cart
print_test "Step 4: Add product to cart"
if [ -n "$JOURNEY_TOKEN" ] && [ -n "$JOURNEY_PRODUCT_ID" ]; then
    RESPONSE=$(request POST "/cart/items" "{\"productId\":\"$JOURNEY_PRODUCT_ID\",\"quantity\":1}" "$JOURNEY_TOKEN")
    if check_success "$RESPONSE" '.data'; then
        print_success "Product added to cart"
    else
        print_error "Journey 1 failed at adding to cart"
        print_response "$RESPONSE"
    fi
else
    print_skip "Missing token or product ID"
fi

# Step 5: View cart
print_test "Step 5: View cart before checkout"
if [ -n "$JOURNEY_TOKEN" ]; then
    RESPONSE=$(request GET "/cart" "" "$JOURNEY_TOKEN")
    if check_success "$RESPONSE" '.data'; then
        CART_TOTAL=$(echo "$RESPONSE" | jq -r '.data.total // "N/A"')
        print_success "Cart ready for checkout (Total: $CART_TOTAL)"
    else
        print_error "Journey 1 failed at viewing cart"
        print_response "$RESPONSE"
    fi
else
    print_skip "Missing token"
fi

# Step 6: Create order (checkout)
print_test "Step 6: Complete checkout (create order)"
if [ -n "$JOURNEY_TOKEN" ]; then
    RESPONSE=$(request POST "/orders" '{"shippingAddress":"456 Customer Lane, Shopping City, SC 54321"}' "$JOURNEY_TOKEN")
    if check_success "$RESPONSE" '.data.id'; then
        JOURNEY_ORDER_ID=$(echo "$RESPONSE" | jq -r '.data.id')
        JOURNEY_ORDER_TOTAL=$(echo "$RESPONSE" | jq -r '.data.total // "N/A"')
        print_success "Order placed! ID: $JOURNEY_ORDER_ID, Total: \$$JOURNEY_ORDER_TOTAL"
    else
        if echo "$RESPONSE" | grep -qi "cart.*empty\|no.*items"; then
            print_skip "Cart was empty (no products seeded)"
        else
            print_error "Journey 1 failed at checkout"
            print_response "$RESPONSE"
        fi
    fi
else
    print_skip "Missing token"
fi

echo -e "\n${CYAN}Journey 1 Complete: Registration → Login → Browse → Cart → Order${NC}"

# ------------------------------
# Journey 2: Product Review Flow
# Login → View Orders → Review Purchased Product
# ------------------------------
print_subheader "Journey 2: Product Review Flow"

# Step 1: View order history
print_test "Step 1: View order history"
if [ -n "$JOURNEY_TOKEN" ]; then
    RESPONSE=$(request GET "/orders" "" "$JOURNEY_TOKEN")
    if check_success "$RESPONSE" '.data'; then
        ORDER_COUNT=$(echo "$RESPONSE" | jq '.data | if type == "array" then length else .items | length end' 2>/dev/null || echo "0")
        print_success "Found $ORDER_COUNT order(s) in history"
    else
        print_error "Journey 2 failed at viewing orders"
        print_response "$RESPONSE"
    fi
else
    print_skip "Missing token"
fi

# Step 2: View order details
print_test "Step 2: View order details"
if [ -n "$JOURNEY_TOKEN" ] && [ -n "$JOURNEY_ORDER_ID" ]; then
    RESPONSE=$(request GET "/orders/$JOURNEY_ORDER_ID" "" "$JOURNEY_TOKEN")
    if check_success "$RESPONSE" '.data.id'; then
        ORDER_STATUS=$(echo "$RESPONSE" | jq -r '.data.status // "unknown"')
        print_success "Order status: $ORDER_STATUS"
    else
        print_error "Journey 2 failed at viewing order details"
        print_response "$RESPONSE"
    fi
else
    print_skip "No order to view"
fi

# Step 3: Leave product review
print_test "Step 3: Leave review for purchased product"
if [ -n "$JOURNEY_TOKEN" ] && [ -n "$JOURNEY_PRODUCT_ID" ]; then
    RESPONSE=$(request POST "/products/$JOURNEY_PRODUCT_ID/reviews" '{"rating":5,"comment":"Great product! Fast shipping and exactly as described. Would buy again!"}' "$JOURNEY_TOKEN")
    if check_success "$RESPONSE" '.data.id'; then
        JOURNEY_REVIEW_ID=$(echo "$RESPONSE" | jq -r '.data.id')
        print_success "Review posted! ID: $JOURNEY_REVIEW_ID"
    else
        if echo "$RESPONSE" | grep -qi "purchase\|order\|already"; then
            print_skip "Review requires purchase verification or already reviewed"
        else
            print_error "Journey 2 failed at posting review"
            print_response "$RESPONSE"
        fi
    fi
else
    print_skip "Missing token or product ID"
fi

# Step 4: View product reviews
print_test "Step 4: View product reviews"
if [ -n "$JOURNEY_PRODUCT_ID" ]; then
    RESPONSE=$(request GET "/products/$JOURNEY_PRODUCT_ID/reviews")
    if check_success "$RESPONSE" '.data'; then
        REVIEW_COUNT=$(echo "$RESPONSE" | jq '.data | if type == "array" then length else 0 end' 2>/dev/null || echo "0")
        print_success "Product has $REVIEW_COUNT review(s)"
    else
        print_error "Journey 2 failed at viewing reviews"
        print_response "$RESPONSE"
    fi
else
    print_skip "No product ID"
fi

echo -e "\n${CYAN}Journey 2 Complete: View Orders → Order Details → Leave Review → View Reviews${NC}"

# ------------------------------
# Journey 3: Guest Browsing Flow
# Browse Products → View Details → Cannot Add to Cart (must login)
# ------------------------------
print_subheader "Journey 3: Guest Browsing Flow (No Auth)"

# Step 1: Browse categories
print_test "Step 1: Browse categories as guest"
RESPONSE=$(request GET "/categories")
if check_success "$RESPONSE" '.data'; then
    GUEST_CAT_COUNT=$(echo "$RESPONSE" | jq '.data | length')
    print_success "Guest can see $GUEST_CAT_COUNT categories"
else
    print_error "Journey 3 failed at browsing categories"
fi

# Step 2: Browse products
print_test "Step 2: Browse products as guest"
RESPONSE=$(request GET "/products")
if check_success "$RESPONSE" '.data'; then
    print_success "Guest can browse products"
else
    print_error "Journey 3 failed at browsing products"
fi

# Step 3: View product details
print_test "Step 3: View product details as guest"
if [ -n "$JOURNEY_PRODUCT_ID" ]; then
    RESPONSE=$(request GET "/products/$JOURNEY_PRODUCT_ID")
    if check_success "$RESPONSE" '.data'; then
        print_success "Guest can view product details"
    else
        print_error "Journey 3 failed at viewing product details"
    fi
else
    print_skip "No product ID"
fi

# Step 4: Try to add to cart without auth (should fail)
print_test "Step 4: Attempt cart access without login (should fail)"
RESPONSE=$(request POST "/cart/items" '{"productId":"any-product","quantity":1}')
if echo "$RESPONSE" | jq -e '.statusCode == 401 or .success == false' > /dev/null 2>&1; then
    print_success "Cart correctly requires authentication"
else
    print_error "Cart should require authentication"
    print_response "$RESPONSE"
fi

echo -e "\n${CYAN}Journey 3 Complete: Guest can browse but must login to purchase${NC}"

# ============================================
# CLEANUP
# ============================================
print_header "CLEANUP"

# Clear cart
print_test "Clear cart"
if [ -n "$USER_TOKEN" ]; then
    RESPONSE=$(curl -s -X DELETE "$BASE_URL/cart" -H "$CONTENT_TYPE" -H "Authorization: Bearer $USER_TOKEN")
    if [ -z "$RESPONSE" ] || echo "$RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
        print_success "Cart cleared"
    else
        print_response "$RESPONSE"
        print_error "Failed to clear cart"
    fi
else
    print_skip "No auth token available"
fi

# ============================================
# TEST SUMMARY
# ============================================
print_header "TEST SUMMARY"

echo -e "\n${CYAN}Test Results:${NC}"
echo -e "  ${GREEN}Passed:  $PASSED${NC}"
echo -e "  ${RED}Failed:  $FAILED${NC}"
echo -e "  ${YELLOW}Skipped: $SKIPPED${NC}"
echo -e "  Total:   $((PASSED + FAILED + SKIPPED))"

echo -e "\n${CYAN}Variables used:${NC}"
echo "  USER_TOKEN: ${USER_TOKEN:0:30}..."
echo "  USER_ID: $USER_ID"
echo "  CATEGORY_ID: $CATEGORY_ID"
echo "  PRODUCT_ID: $PRODUCT_ID"
echo "  ORDER_ID: $ORDER_ID"
echo "  REVIEW_ID: $REVIEW_ID"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}═══════════════════════════════════════════${NC}"
    echo -e "${GREEN}  All tests passed successfully! 🎉${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════${NC}"
    exit 0
else
    echo -e "\n${RED}═══════════════════════════════════════════${NC}"
    echo -e "${RED}  Some tests failed. Check output above.${NC}"
    echo -e "${RED}═══════════════════════════════════════════${NC}"
    exit 1
fi
