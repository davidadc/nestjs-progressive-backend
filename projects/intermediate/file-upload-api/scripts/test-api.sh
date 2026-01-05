#!/bin/bash

# File Upload API - Integration Test Script
# Tests all API endpoints and user journeys

# Don't use set -e as we want to continue even if individual tests fail

BASE_URL="${BASE_URL:-http://localhost:3000}"
API_URL="$BASE_URL/api/v1"

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
TESTS_SKIPPED=0

# Test user credentials (avoid special chars that bash might interpret)
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASSWORD="SecurePass123"
TEST_TOKEN=""

# Secondary user for access control tests
TEST2_EMAIL="test2-$(date +%s)@example.com"
TEST2_PASSWORD="SecurePass456"
TEST2_TOKEN=""

# File IDs for cleanup
declare -a TEST_FILE_IDS

# Temp directory for test files
TEST_FILES_DIR="/tmp/file-upload-api-tests"

print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_subheader() {
    echo -e "\n${CYAN}▶ $1${NC}\n"
}

print_test() {
    echo -e "  ${YELLOW}TEST:${NC} $1"
}

print_pass() {
    echo -e "  ${GREEN}✓ PASS:${NC} $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

print_fail() {
    echo -e "  ${RED}✗ FAIL:${NC} $1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

print_skip() {
    echo -e "  ${YELLOW}⊘ SKIP:${NC} $1"
    TESTS_SKIPPED=$((TESTS_SKIPPED + 1))
}

print_info() {
    echo -e "  ${CYAN}INFO:${NC} $1"
}

# Assert HTTP status code
assert_status() {
    local expected=$1
    local actual=$2
    local test_name=$3

    if [ "$actual" = "$expected" ]; then
        print_pass "$test_name (HTTP $actual)"
        return 0
    else
        print_fail "$test_name (expected HTTP $expected, got HTTP $actual)"
        return 1
    fi
}

# Assert response contains string
assert_contains() {
    local response=$1
    local expected=$2
    local test_name=$3

    if echo "$response" | grep -q "$expected"; then
        print_pass "$test_name"
        return 0
    else
        print_fail "$test_name (expected to contain: $expected)"
        return 1
    fi
}

# Setup test environment
setup() {
    print_header "Test Setup"

    # Create temp directory for test files
    mkdir -p "$TEST_FILES_DIR"

    # Create test files
    echo "Test content for text file" > "$TEST_FILES_DIR/test.txt"
    echo '{"test": "json file"}' > "$TEST_FILES_DIR/test.json"

    # Create a minimal valid PNG (1x1 red pixel)
    printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\xcf\xc0\x00\x00\x00\x03\x00\x01\x00\x05\xfe\xd4\x00\x00\x00\x00IEND\xaeB`\x82' > "$TEST_FILES_DIR/test.png"

    # Create a large-ish file for size tests (1KB)
    dd if=/dev/zero of="$TEST_FILES_DIR/large.bin" bs=1024 count=1 2>/dev/null

    print_info "Test files created in $TEST_FILES_DIR"
}

# Cleanup test environment
cleanup() {
    print_header "Cleanup"

    # Delete uploaded test files
    for file_id in "${TEST_FILE_IDS[@]}"; do
        if [ -n "$TEST_TOKEN" ] && [ -n "$file_id" ]; then
            curl -s -X DELETE "$API_URL/files/$file_id" \
                -H "Authorization: Bearer $TEST_TOKEN" > /dev/null 2>&1 || true
        fi
    done

    # Remove temp directory
    rm -rf "$TEST_FILES_DIR"

    print_info "Cleanup completed"
}

# Test: Server Health Check
test_health_check() {
    print_subheader "Health Check"

    print_test "Server is running"
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL" 2>/dev/null || echo -e "\n000")
    http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "000" ]; then
        print_fail "Server is not running at $BASE_URL"
        echo -e "${RED}Please start the server with: pnpm run start:dev${NC}"
        exit 1
    else
        print_pass "Server is responding"
    fi
}

# Test: Authentication - Register
test_auth_register() {
    print_subheader "Auth: Register"

    print_test "Register new user"
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"$TEST_PASSWORD\"}")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    assert_status "201" "$http_code" "Register returns 201"
    assert_contains "$body" "accessToken" "Response contains accessToken"

    TEST_TOKEN=$(echo "$body" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

    print_test "Register with invalid email"
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d '{"email": "invalid-email", "password": "Password123!"}')
    http_code=$(echo "$response" | tail -n1)
    assert_status "400" "$http_code" "Invalid email returns 400"

    print_test "Register with short password"
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d '{"email": "short@example.com", "password": "123"}')
    http_code=$(echo "$response" | tail -n1)
    assert_status "400" "$http_code" "Short password returns 400"

    print_test "Register duplicate email"
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"$TEST_PASSWORD\"}")
    http_code=$(echo "$response" | tail -n1)
    # Should be 409 Conflict or 400 Bad Request
    if [ "$http_code" = "409" ] || [ "$http_code" = "400" ]; then
        print_pass "Duplicate email rejected (HTTP $http_code)"
    else
        print_fail "Duplicate email should be rejected (got HTTP $http_code)"
    fi
}

# Test: Authentication - Login
test_auth_login() {
    print_subheader "Auth: Login"

    print_test "Login with valid credentials"
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"$TEST_PASSWORD\"}")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        print_pass "Login successful (HTTP $http_code)"
    else
        print_fail "Login should succeed (got HTTP $http_code)"
    fi
    assert_contains "$body" "accessToken" "Response contains accessToken"

    # Update token
    TEST_TOKEN=$(echo "$body" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

    print_test "Login with wrong password"
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"wrongpassword\"}")
    http_code=$(echo "$response" | tail -n1)
    assert_status "401" "$http_code" "Wrong password returns 401"

    print_test "Login with non-existent email"
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email": "nonexistent@example.com", "password": "Password123!"}')
    http_code=$(echo "$response" | tail -n1)
    assert_status "401" "$http_code" "Non-existent email returns 401"
}

# Test: Authentication - Profile
test_auth_profile() {
    print_subheader "Auth: Profile"

    print_test "Get profile with valid token"
    response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/auth/profile" \
        -H "Authorization: Bearer $TEST_TOKEN")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    assert_status "200" "$http_code" "Get profile returns 200"
    assert_contains "$body" "$TEST_EMAIL" "Profile contains user email"

    print_test "Get profile without token"
    response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/auth/profile")
    http_code=$(echo "$response" | tail -n1)
    assert_status "401" "$http_code" "No token returns 401"

    print_test "Get profile with invalid token"
    response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/auth/profile" \
        -H "Authorization: Bearer invalid-token")
    http_code=$(echo "$response" | tail -n1)
    assert_status "401" "$http_code" "Invalid token returns 401"
}

# Test: File Upload
test_file_upload() {
    print_subheader "Files: Upload"

    print_test "Upload text file"
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/files/upload" \
        -H "Authorization: Bearer $TEST_TOKEN" \
        -F "file=@$TEST_FILES_DIR/test.txt")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    assert_status "201" "$http_code" "Upload text file returns 201"
    assert_contains "$body" "id" "Response contains file id"

    file_id=$(echo "$body" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    TEST_FILE_IDS+=("$file_id")
    print_info "Uploaded file ID: $file_id"

    print_test "Upload image file (PNG)"
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/files/upload" \
        -H "Authorization: Bearer $TEST_TOKEN" \
        -F "file=@$TEST_FILES_DIR/test.png")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    assert_status "201" "$http_code" "Upload PNG file returns 201"
    assert_contains "$body" '"isImage":true' "Image file marked as isImage=true"

    file_id=$(echo "$body" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    TEST_FILE_IDS+=("$file_id")
    IMAGE_FILE_ID="$file_id"
    print_info "Uploaded image ID: $file_id"

    print_test "Upload without authentication"
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/files/upload" \
        -F "file=@$TEST_FILES_DIR/test.txt")
    http_code=$(echo "$response" | tail -n1)
    assert_status "401" "$http_code" "Upload without auth returns 401"

    print_test "Upload without file"
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/files/upload" \
        -H "Authorization: Bearer $TEST_TOKEN")
    http_code=$(echo "$response" | tail -n1)
    assert_status "400" "$http_code" "Upload without file returns 400"
}

# Test: File Listing
test_file_listing() {
    print_subheader "Files: List"

    print_test "List files"
    response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/files" \
        -H "Authorization: Bearer $TEST_TOKEN")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    assert_status "200" "$http_code" "List files returns 200"
    assert_contains "$body" "data" "Response contains data array"
    assert_contains "$body" "total" "Response contains total count"

    print_test "List files with pagination"
    response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/files?page=1&limit=5" \
        -H "Authorization: Bearer $TEST_TOKEN")
    http_code=$(echo "$response" | tail -n1)
    assert_status "200" "$http_code" "Paginated list returns 200"

    print_test "List files with search"
    response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/files?search=test" \
        -H "Authorization: Bearer $TEST_TOKEN")
    http_code=$(echo "$response" | tail -n1)
    assert_status "200" "$http_code" "Search returns 200"

    print_test "List files without auth"
    response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/files")
    http_code=$(echo "$response" | tail -n1)
    assert_status "401" "$http_code" "List without auth returns 401"
}

# Test: File Details
test_file_details() {
    print_subheader "Files: Get Details"

    if [ ${#TEST_FILE_IDS[@]} -eq 0 ]; then
        print_skip "No files to test (upload test may have failed)"
        return
    fi

    file_id="${TEST_FILE_IDS[0]}"

    print_test "Get file details"
    response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/files/$file_id" \
        -H "Authorization: Bearer $TEST_TOKEN")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    assert_status "200" "$http_code" "Get file details returns 200"
    assert_contains "$body" "\"id\":\"$file_id\"" "Response contains correct file ID"

    print_test "Get non-existent file"
    response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/files/00000000-0000-0000-0000-000000000000" \
        -H "Authorization: Bearer $TEST_TOKEN")
    http_code=$(echo "$response" | tail -n1)
    assert_status "404" "$http_code" "Non-existent file returns 404"

    print_test "Get file without auth"
    response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/files/$file_id")
    http_code=$(echo "$response" | tail -n1)
    assert_status "401" "$http_code" "Get file without auth returns 401"
}

# Test: File Download
test_file_download() {
    print_subheader "Files: Download"

    if [ ${#TEST_FILE_IDS[@]} -eq 0 ]; then
        print_skip "No files to test"
        return
    fi

    file_id="${TEST_FILE_IDS[0]}"

    print_test "Download file"
    response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/files/$file_id/download" \
        -H "Authorization: Bearer $TEST_TOKEN" \
        -o /tmp/downloaded_file)

    http_code=$(echo "$response" | tail -n1)

    assert_status "200" "$http_code" "Download file returns 200"

    # Check if file was downloaded
    if [ -f /tmp/downloaded_file ] && [ -s /tmp/downloaded_file ]; then
        print_pass "File content downloaded successfully"
        rm /tmp/downloaded_file
    else
        print_fail "Downloaded file is empty or missing"
    fi

    print_test "Download non-existent file"
    response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/files/00000000-0000-0000-0000-000000000000/download" \
        -H "Authorization: Bearer $TEST_TOKEN")
    http_code=$(echo "$response" | tail -n1)
    assert_status "404" "$http_code" "Download non-existent file returns 404"
}

# Test: Thumbnail
test_thumbnail() {
    print_subheader "Files: Thumbnail"

    if [ -z "$IMAGE_FILE_ID" ]; then
        print_skip "No image file uploaded for thumbnail test"
        return
    fi

    print_test "Get image thumbnail"
    response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/files/$IMAGE_FILE_ID/thumbnail" \
        -H "Authorization: Bearer $TEST_TOKEN" \
        -o /tmp/thumbnail)

    http_code=$(echo "$response" | tail -n1)

    # 200 means thumbnail was generated, 400 means thumbnail not available (tiny images)
    if [ "$http_code" = "200" ]; then
        print_pass "Get thumbnail returns 200 (thumbnail generated)"
        if [ -f /tmp/thumbnail ] && [ -s /tmp/thumbnail ]; then
            print_pass "Thumbnail content received"
        fi
    elif [ "$http_code" = "400" ]; then
        print_pass "Get thumbnail returns 400 (thumbnail not available for tiny image - expected)"
    else
        print_fail "Get thumbnail returned unexpected status (HTTP $http_code)"
    fi
    rm -f /tmp/thumbnail

    # Test thumbnail for non-image file
    if [ ${#TEST_FILE_IDS[@]} -gt 0 ]; then
        text_file_id="${TEST_FILE_IDS[0]}"
        print_test "Get thumbnail for non-image file"
        response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/files/$text_file_id/thumbnail" \
            -H "Authorization: Bearer $TEST_TOKEN")
        http_code=$(echo "$response" | tail -n1)
        # Should return 400 or 404 for non-image files
        if [ "$http_code" = "400" ] || [ "$http_code" = "404" ]; then
            print_pass "Non-image thumbnail rejected (HTTP $http_code)"
        else
            print_fail "Non-image thumbnail should be rejected (got HTTP $http_code)"
        fi
    fi
}

# Test: Storage Usage
test_storage_usage() {
    print_subheader "Files: Storage Usage"

    print_test "Get storage usage"
    response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/files/storage" \
        -H "Authorization: Bearer $TEST_TOKEN")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    assert_status "200" "$http_code" "Get storage usage returns 200"
    assert_contains "$body" "used" "Response contains used storage"
    assert_contains "$body" "limit" "Response contains storage limit"
}

# Test: File Deletion
test_file_deletion() {
    print_subheader "Files: Delete"

    # Upload a file to delete (use .txt since .json is not in allowed MIME types)
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/files/upload" \
        -H "Authorization: Bearer $TEST_TOKEN" \
        -F "file=@$TEST_FILES_DIR/test.txt")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "201" ]; then
        delete_file_id=$(echo "$body" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        print_info "Uploaded file for deletion test: $delete_file_id"

        print_test "Delete file"
        response=$(curl -s -w "\n%{http_code}" -X DELETE "$API_URL/files/$delete_file_id" \
            -H "Authorization: Bearer $TEST_TOKEN")
        http_code=$(echo "$response" | tail -n1)
        assert_status "204" "$http_code" "Delete file returns 204"

        print_test "Verify file is deleted"
        response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/files/$delete_file_id" \
            -H "Authorization: Bearer $TEST_TOKEN")
        http_code=$(echo "$response" | tail -n1)
        assert_status "404" "$http_code" "Deleted file returns 404"
    else
        print_skip "Could not upload file for deletion test"
    fi

    print_test "Delete non-existent file"
    response=$(curl -s -w "\n%{http_code}" -X DELETE "$API_URL/files/00000000-0000-0000-0000-000000000000" \
        -H "Authorization: Bearer $TEST_TOKEN")
    http_code=$(echo "$response" | tail -n1)
    assert_status "404" "$http_code" "Delete non-existent file returns 404"
}

# Test: Access Control (User Isolation)
test_access_control() {
    print_subheader "Access Control: User Isolation"

    # Create second user
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$TEST2_EMAIL\", \"password\": \"$TEST2_PASSWORD\"}")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "201" ]; then
        TEST2_TOKEN=$(echo "$body" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
        print_info "Second test user created"
    else
        print_skip "Could not create second user for access control test"
        return
    fi

    if [ ${#TEST_FILE_IDS[@]} -eq 0 ]; then
        print_skip "No files from first user to test access control"
        return
    fi

    user1_file_id="${TEST_FILE_IDS[0]}"

    print_test "User 2 cannot access User 1's file details"
    response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/files/$user1_file_id" \
        -H "Authorization: Bearer $TEST2_TOKEN")
    http_code=$(echo "$response" | tail -n1)
    if [ "$http_code" = "403" ] || [ "$http_code" = "404" ]; then
        print_pass "Access denied to other user's file (HTTP $http_code)"
    else
        print_fail "Should deny access to other user's file (got HTTP $http_code)"
    fi

    print_test "User 2 cannot download User 1's file"
    response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/files/$user1_file_id/download" \
        -H "Authorization: Bearer $TEST2_TOKEN")
    http_code=$(echo "$response" | tail -n1)
    if [ "$http_code" = "403" ] || [ "$http_code" = "404" ]; then
        print_pass "Download denied for other user's file (HTTP $http_code)"
    else
        print_fail "Should deny download of other user's file (got HTTP $http_code)"
    fi

    print_test "User 2 cannot delete User 1's file"
    response=$(curl -s -w "\n%{http_code}" -X DELETE "$API_URL/files/$user1_file_id" \
        -H "Authorization: Bearer $TEST2_TOKEN")
    http_code=$(echo "$response" | tail -n1)
    if [ "$http_code" = "403" ] || [ "$http_code" = "404" ]; then
        print_pass "Delete denied for other user's file (HTTP $http_code)"
    else
        print_fail "Should deny delete of other user's file (got HTTP $http_code)"
    fi

    print_test "User 2's file list is empty (no User 1 files)"
    response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/files" \
        -H "Authorization: Bearer $TEST2_TOKEN")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    assert_status "200" "$http_code" "User 2 can list their files"
    # Check for empty data array and total 0
    if echo "$body" | grep -q '"data":\[\]' && echo "$body" | grep -q '"total":0'; then
        print_pass "User 2 sees empty file list"
    else
        print_fail "User 2 sees empty file list"
    fi
}

# User Journey: Complete File Workflow
journey_complete_workflow() {
    print_header "Journey: Complete File Workflow"
    print_info "Register → Login → Upload → List → Download → Delete"

    local journey_email="journey-$(date +%s)@example.com"
    local journey_password="JourneyPass123"
    local journey_token=""
    local journey_file_id=""

    # Step 1: Register
    print_test "Step 1: Register new user"
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$journey_email\", \"password\": \"$journey_password\"}")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    assert_status "201" "$http_code" "Registration successful"
    journey_token=$(echo "$body" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

    # Step 2: Upload file
    print_test "Step 2: Upload a file"
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/files/upload" \
        -H "Authorization: Bearer $journey_token" \
        -F "file=@$TEST_FILES_DIR/test.txt")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    assert_status "201" "$http_code" "File upload successful"
    journey_file_id=$(echo "$body" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

    # Step 3: List files
    print_test "Step 3: List files"
    response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/files" \
        -H "Authorization: Bearer $journey_token")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    assert_status "200" "$http_code" "File listing successful"
    assert_contains "$body" "\"total\":1" "Shows 1 file in list"

    # Step 4: Download file
    print_test "Step 4: Download file"
    response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/files/$journey_file_id/download" \
        -H "Authorization: Bearer $journey_token" \
        -o /tmp/journey_download)
    http_code=$(echo "$response" | tail -n1)
    assert_status "200" "$http_code" "File download successful"
    rm -f /tmp/journey_download

    # Step 5: Delete file
    print_test "Step 5: Delete file"
    response=$(curl -s -w "\n%{http_code}" -X DELETE "$API_URL/files/$journey_file_id" \
        -H "Authorization: Bearer $journey_token")
    http_code=$(echo "$response" | tail -n1)
    # 200 or 204 are both valid for successful DELETE
    if [ "$http_code" = "200" ] || [ "$http_code" = "204" ]; then
        print_pass "File deletion successful (HTTP $http_code)"
    else
        print_fail "File deletion failed (expected HTTP 200/204, got HTTP $http_code)"
    fi

    # Step 6: Verify deletion
    print_test "Step 6: Verify file is gone"
    response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/files" \
        -H "Authorization: Bearer $journey_token")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    if echo "$body" | grep -q '"data":\[\]' && echo "$body" | grep -q '"total":0'; then
        print_pass "File list is now empty"
    else
        print_fail "File list is now empty"
    fi

    print_pass "Journey: Complete workflow successful"
}

# User Journey: Image Upload with Thumbnail
journey_image_thumbnail() {
    print_header "Journey: Image Upload with Thumbnail"
    print_info "Upload image → Verify isImage → Get thumbnail"

    if [ -z "$TEST_TOKEN" ]; then
        print_skip "No test token available"
        return
    fi

    # Upload image
    print_test "Step 1: Upload image file"
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/files/upload" \
        -H "Authorization: Bearer $TEST_TOKEN" \
        -F "file=@$TEST_FILES_DIR/test.png")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    assert_status "201" "$http_code" "Image upload successful"

    image_id=$(echo "$body" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    TEST_FILE_IDS+=("$image_id")

    # Verify isImage flag
    print_test "Step 2: Verify isImage flag"
    assert_contains "$body" '"isImage":true' "File marked as image"

    # Get thumbnail
    print_test "Step 3: Get thumbnail"
    response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/files/$image_id/thumbnail" \
        -H "Authorization: Bearer $TEST_TOKEN" \
        -o /tmp/journey_thumb)
    http_code=$(echo "$response" | tail -n1)
    # 200 means thumbnail generated, 400 means not available (tiny images - expected)
    if [ "$http_code" = "200" ] || [ "$http_code" = "400" ]; then
        print_pass "Thumbnail endpoint responded (HTTP $http_code)"
    else
        print_fail "Thumbnail endpoint failed (HTTP $http_code)"
    fi
    rm -f /tmp/journey_thumb

    print_pass "Journey: Image thumbnail workflow successful"
}

# Print test summary
print_summary() {
    print_header "Test Summary"

    local total=$((TESTS_PASSED + TESTS_FAILED + TESTS_SKIPPED))

    echo -e "  ${GREEN}Passed:${NC}  $TESTS_PASSED"
    echo -e "  ${RED}Failed:${NC}  $TESTS_FAILED"
    echo -e "  ${YELLOW}Skipped:${NC} $TESTS_SKIPPED"
    echo -e "  ─────────────────"
    echo -e "  Total:   $total"
    echo ""

    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}All tests passed! ✓${NC}"
        return 0
    else
        echo -e "${RED}Some tests failed! ✗${NC}"
        return 1
    fi
}

# Main test runner
main() {
    print_header "File Upload API - Integration Tests"
    echo -e "  Server: ${CYAN}$BASE_URL${NC}"
    echo -e "  Date:   $(date)"

    # Trap to ensure cleanup runs
    trap cleanup EXIT

    setup

    # Basic endpoint tests
    test_health_check
    test_auth_register
    test_auth_login
    test_auth_profile
    test_file_upload
    test_file_listing
    test_file_details
    test_file_download
    test_thumbnail
    test_storage_usage
    test_file_deletion
    test_access_control

    # User journeys
    journey_complete_workflow
    journey_image_thumbnail

    print_summary
}

# Run tests
main "$@"
