#!/bin/bash

# File Upload API - Seed Data Script
# Creates test users and uploads sample files for testing

set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"
API_URL="$BASE_URL/api/v1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test users (avoid special chars that bash might interpret)
USER1_EMAIL="testuser1@example.com"
USER1_PASSWORD="Password123"
USER2_EMAIL="testuser2@example.com"
USER2_PASSWORD="Password456"

# Token storage
USER1_TOKEN=""
USER2_TOKEN=""

# File IDs storage
declare -a UPLOADED_FILE_IDS

print_header() {
    echo -e "\n${BLUE}============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Check if server is running
check_server() {
    print_header "Checking Server Status"

    if curl -s "$BASE_URL" > /dev/null 2>&1; then
        print_success "Server is running at $BASE_URL"
        return 0
    else
        print_error "Server is not running at $BASE_URL"
        print_info "Please start the server with: pnpm run start:dev"
        exit 1
    fi
}

# Register a user (returns token)
register_user() {
    local email=$1
    local password=$2

    print_info "Registering user: $email"

    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$email\", \"password\": \"$password\"}")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "201" ]; then
        token=$(echo "$body" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
        print_success "User registered: $email"
        echo "$token"
    elif [ "$http_code" = "409" ] || [ "$http_code" = "400" ]; then
        # User already exists, try to login
        print_info "User already exists, logging in..."
        login_user "$email" "$password"
    else
        print_error "Failed to register user: $email (HTTP $http_code)"
        echo "$body"
        return 1
    fi
}

# Login a user (returns token)
login_user() {
    local email=$1
    local password=$2

    print_info "Logging in user: $email"

    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$email\", \"password\": \"$password\"}")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        token=$(echo "$body" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
        print_success "User logged in: $email"
        echo "$token"
    else
        print_error "Failed to login user: $email (HTTP $http_code)"
        echo "$body"
        return 1
    fi
}

# Create sample test files
create_sample_files() {
    print_header "Creating Sample Test Files"

    local test_dir="/tmp/file-upload-test-files"
    mkdir -p "$test_dir"

    # Create a simple text file
    echo "This is a sample text file for testing the File Upload API." > "$test_dir/sample.txt"
    print_success "Created: sample.txt"

    # Create a JSON file
    echo '{"name": "Test", "description": "Sample JSON file"}' > "$test_dir/sample.json"
    print_success "Created: sample.json"

    # Create a simple PNG image (1x1 pixel red)
    printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\xcf\xc0\x00\x00\x00\x03\x00\x01\x00\x05\xfe\xd4\x00\x00\x00\x00IEND\xaeB`\x82' > "$test_dir/sample.png"
    print_success "Created: sample.png"

    # Create a simple JPEG image (minimal valid JPEG)
    printf '\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\x27 ",#\x1c\x1c(7teletext-:teletext@teletext?teletext>teletext9teletext=teletext4teletext<teletext:teletext=teletext;teletext=teletext\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xc4\x00\xb5\x10\x00\x02\x01\x03\x03\x02\x04\x03\x05\x05\x04\x04\x00\x00\x01}\x01\x02\x03\x00\x04\x11\x05\x12!1A\x06\x13Qa\x07"q\x142\x81\x91\xa1\x08#B\xb1\xc1\x15R\xd1\xf0$3br\x82\t\n\x16\x17\x18\x19\x1a%&\x27()*456789:CDEFGHIJSTUVWXYZcdefghijstuvwxyz\x83\x84\x85\x86\x87\x88\x89\x8a\x92\x93\x94\x95\x96\x97\x98\x99\x9a\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xe1\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xf1\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xfb\xd5\xdb\xc7\xff\xd9' > "$test_dir/sample.jpg" 2>/dev/null || echo "Sample JPEG" > "$test_dir/sample.jpg"
    print_success "Created: sample.jpg"

    # Create a PDF file (minimal valid PDF)
    cat > "$test_dir/sample.pdf" << 'PDFEOF'
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT /F1 12 Tf 100 700 Td (Test PDF) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000206 00000 n
trailer
<< /Size 5 /Root 1 0 R >>
startxref
300
%%EOF
PDFEOF
    print_success "Created: sample.pdf"

    echo "$test_dir"
}

# Upload a file
upload_file() {
    local token=$1
    local file_path=$2
    local filename=$(basename "$file_path")

    print_info "Uploading file: $filename"

    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/files/upload" \
        -H "Authorization: Bearer $token" \
        -F "file=@$file_path")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "201" ]; then
        file_id=$(echo "$body" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        print_success "Uploaded: $filename (ID: $file_id)"
        UPLOADED_FILE_IDS+=("$file_id")
        echo "$file_id"
    else
        print_error "Failed to upload: $filename (HTTP $http_code)"
        echo "$body"
        return 1
    fi
}

# Create test users
create_test_users() {
    print_header "Creating Test Users"

    USER1_TOKEN=$(register_user "$USER1_EMAIL" "$USER1_PASSWORD")
    USER2_TOKEN=$(register_user "$USER2_EMAIL" "$USER2_PASSWORD")

    if [ -n "$USER1_TOKEN" ] && [ -n "$USER2_TOKEN" ]; then
        print_success "Both test users are ready"
    else
        print_error "Failed to create test users"
        exit 1
    fi
}

# Upload sample files for user 1
upload_sample_files() {
    print_header "Uploading Sample Files for User 1"

    local test_dir=$1

    for file in "$test_dir"/*; do
        if [ -f "$file" ]; then
            upload_file "$USER1_TOKEN" "$file"
        fi
    done

    print_success "Uploaded ${#UPLOADED_FILE_IDS[@]} files for User 1"
}

# Show storage usage
show_storage_usage() {
    print_header "Storage Usage"

    response=$(curl -s -X GET "$API_URL/files/storage" \
        -H "Authorization: Bearer $USER1_TOKEN")

    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
}

# List uploaded files
list_files() {
    print_header "Listing Files for User 1"

    response=$(curl -s -X GET "$API_URL/files" \
        -H "Authorization: Bearer $USER1_TOKEN")

    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
}

# Cleanup - delete all uploaded files
cleanup() {
    print_header "Cleanup - Deleting Test Data"

    if [ -z "$USER1_TOKEN" ]; then
        USER1_TOKEN=$(login_user "$USER1_EMAIL" "$USER1_PASSWORD")
    fi

    if [ -z "$USER1_TOKEN" ]; then
        print_error "Cannot login to cleanup"
        return 1
    fi

    # Get all files and delete them
    response=$(curl -s -X GET "$API_URL/files?limit=100" \
        -H "Authorization: Bearer $USER1_TOKEN")

    # Extract file IDs and delete each one
    file_ids=$(echo "$response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

    for file_id in $file_ids; do
        print_info "Deleting file: $file_id"
        curl -s -X DELETE "$API_URL/files/$file_id" \
            -H "Authorization: Bearer $USER1_TOKEN" > /dev/null
        print_success "Deleted: $file_id"
    done

    # Cleanup temp files
    rm -rf /tmp/file-upload-test-files
    print_success "Cleanup completed"
}

# Main seed function
seed() {
    print_header "File Upload API - Seed Data"

    check_server

    local test_dir=$(create_sample_files)

    create_test_users

    upload_sample_files "$test_dir"

    list_files

    show_storage_usage

    print_header "Seed Data Summary"
    echo -e "User 1: ${GREEN}$USER1_EMAIL${NC}"
    echo -e "User 2: ${GREEN}$USER2_EMAIL${NC}"
    echo -e "Files uploaded: ${GREEN}${#UPLOADED_FILE_IDS[@]}${NC}"
    echo ""
    echo "To login as User 1:"
    echo -e "  curl -X POST $API_URL/auth/login -H 'Content-Type: application/json' -d '{\"email\": \"$USER1_EMAIL\", \"password\": \"$USER1_PASSWORD\"}'"
    echo ""
    print_success "Seed data created successfully!"
}

# Show usage
usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  seed      Create test users and upload sample files (default)"
    echo "  cleanup   Delete all test data"
    echo "  help      Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  BASE_URL  Server URL (default: http://localhost:3000)"
}

# Main entry point
case "${1:-seed}" in
    seed)
        seed
        ;;
    cleanup)
        cleanup
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        print_error "Unknown command: $1"
        usage
        exit 1
        ;;
esac
