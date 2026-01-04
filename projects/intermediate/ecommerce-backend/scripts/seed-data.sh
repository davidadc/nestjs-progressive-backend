#!/bin/bash

# E-commerce Database Seed Script
# This script populates the database with test data for API testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database connection settings
DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-5432}"
DB_USER="${DATABASE_USER:-admin}"
DB_PASSWORD="${DATABASE_PASSWORD:-admin}"
DB_NAME="${DATABASE_NAME:-ecommerce_db}"

# Docker container name
CONTAINER_NAME="${POSTGRES_CONTAINER:-nestjs-postgres}"

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# Function to execute SQL via docker
run_sql() {
    docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "$1"
}

# Function to execute SQL file via docker
run_sql_file() {
    docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME < "$1"
}

print_header "E-COMMERCE DATABASE SEEDING"

# Check if docker container is running
if ! docker ps | grep -q $CONTAINER_NAME; then
    print_error "PostgreSQL container '$CONTAINER_NAME' is not running!"
    print_info "Start it with: docker-compose up -d"
    exit 1
fi

print_info "Connected to database: $DB_NAME"

# ============================================
# CLEAR EXISTING DATA
# ============================================
print_header "CLEARING EXISTING DATA"

print_info "Truncating tables..."
run_sql "TRUNCATE TABLE reviews, order_items, orders, cart_items, carts, products, categories, users CASCADE;" 2>/dev/null || true
print_success "Tables cleared"

# ============================================
# SEED USERS
# ============================================
print_header "SEEDING USERS"

# Password hash for "Password123!" generated with bcrypt (cost 10)
# In a real scenario, you'd generate these properly
USER_PASSWORD_HASH='$2b$10$rQZKQYxvzPtqnXqKqXqXqOKQYxvzPtqnXqKqXqXqOKQYxvzPtqnXq'

# For testing, we'll use the API to register users instead of direct SQL
# This ensures passwords are hashed correctly
print_info "Users will be created via API during test script execution"
print_success "User seeding deferred to API tests"

# ============================================
# SEED CATEGORIES
# ============================================
print_header "SEEDING CATEGORIES"

run_sql "
INSERT INTO categories (id, name, description, \"createdAt\", \"updatedAt\") VALUES
    ('cat-electronics', 'Electronics', 'Electronic devices and gadgets', NOW(), NOW()),
    ('cat-clothing', 'Clothing', 'Fashion and apparel', NOW(), NOW()),
    ('cat-books', 'Books', 'Books and educational materials', NOW(), NOW()),
    ('cat-home', 'Home & Garden', 'Home decor and garden supplies', NOW(), NOW()),
    ('cat-sports', 'Sports & Outdoors', 'Sports equipment and outdoor gear', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
"
print_success "5 categories seeded"

# ============================================
# SEED PRODUCTS
# ============================================
print_header "SEEDING PRODUCTS"

run_sql "
INSERT INTO products (id, name, description, price, stock, sku, \"isActive\", \"categoryId\", \"createdAt\", \"updatedAt\") VALUES
    -- Electronics
    ('prod-laptop', 'MacBook Pro 14\"', 'Apple MacBook Pro with M3 chip, 16GB RAM, 512GB SSD', 1999.99, 50, 'ELEC-MBP14-001', true, 'cat-electronics', NOW(), NOW()),
    ('prod-phone', 'iPhone 15 Pro', 'Apple iPhone 15 Pro, 256GB, Natural Titanium', 1199.99, 100, 'ELEC-IP15P-001', true, 'cat-electronics', NOW(), NOW()),
    ('prod-headphones', 'Sony WH-1000XM5', 'Premium noise-canceling wireless headphones', 349.99, 75, 'ELEC-SNYWH5-001', true, 'cat-electronics', NOW(), NOW()),
    ('prod-tablet', 'iPad Air', 'Apple iPad Air, 256GB, Space Gray', 749.99, 60, 'ELEC-IPAIR-001', true, 'cat-electronics', NOW(), NOW()),

    -- Clothing
    ('prod-tshirt', 'Classic Cotton T-Shirt', '100% organic cotton, available in multiple colors', 29.99, 200, 'CLTH-TSHRT-001', true, 'cat-clothing', NOW(), NOW()),
    ('prod-jeans', 'Slim Fit Jeans', 'Premium denim jeans, comfortable stretch fit', 79.99, 150, 'CLTH-JEANS-001', true, 'cat-clothing', NOW(), NOW()),
    ('prod-jacket', 'Winter Parka', 'Waterproof winter jacket with faux fur hood', 199.99, 40, 'CLTH-PARKA-001', true, 'cat-clothing', NOW(), NOW()),

    -- Books
    ('prod-book1', 'Clean Code', 'A Handbook of Agile Software Craftsmanship by Robert C. Martin', 44.99, 100, 'BOOK-CLEAN-001', true, 'cat-books', NOW(), NOW()),
    ('prod-book2', 'Design Patterns', 'Elements of Reusable Object-Oriented Software', 54.99, 80, 'BOOK-DESGN-001', true, 'cat-books', NOW(), NOW()),

    -- Home & Garden
    ('prod-lamp', 'Smart LED Desk Lamp', 'Adjustable brightness and color temperature', 69.99, 90, 'HOME-LAMP-001', true, 'cat-home', NOW(), NOW()),
    ('prod-plant', 'Indoor Plant Set', 'Set of 3 low-maintenance indoor plants', 49.99, 30, 'HOME-PLANT-001', true, 'cat-home', NOW(), NOW()),

    -- Sports
    ('prod-yoga', 'Yoga Mat Premium', 'Non-slip yoga mat, 6mm thickness', 39.99, 120, 'SPRT-YOGA-001', true, 'cat-sports', NOW(), NOW()),
    ('prod-dumbell', 'Adjustable Dumbbell Set', 'Adjustable weight from 5-50 lbs', 299.99, 25, 'SPRT-DUMB-001', true, 'cat-sports', NOW(), NOW()),

    -- Inactive product for testing
    ('prod-old', 'Discontinued Item', 'This product is no longer available', 9.99, 0, 'DISC-OLD-001', false, 'cat-electronics', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
"
print_success "14 products seeded"

# ============================================
# SUMMARY
# ============================================
print_header "SEED SUMMARY"

echo -e "\nSeeded data counts:"
run_sql "SELECT 'Categories' as entity, COUNT(*) as count FROM categories UNION ALL SELECT 'Products', COUNT(*) FROM products;" 2>/dev/null | grep -E "Categories|Products"

echo -e "\n${GREEN}Database seeding completed!${NC}"
echo -e "${YELLOW}Note: Users, carts, orders, and reviews will be created during API tests.${NC}"
echo -e "${YELLOW}Run the test script: ./scripts/test-api.sh${NC}"
