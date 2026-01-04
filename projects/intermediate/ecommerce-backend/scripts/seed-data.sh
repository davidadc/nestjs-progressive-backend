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

# Function to get a single value from SQL query
get_sql_value() {
    docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -t -A -c "$1"
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

# Generate bcrypt hash for "Password123!" using Node.js
# This ensures we have a valid hash that works with the API
print_info "Generating password hashes..."

# Use Node.js to generate proper bcrypt hash
PASSWORD_HASH=$(node -e "
const bcrypt = require('bcrypt');
const hash = bcrypt.hashSync('Password123!', 10);
console.log(hash);
" 2>/dev/null)

if [ -z "$PASSWORD_HASH" ]; then
    print_error "Failed to generate password hash. Using fallback."
    # Fallback hash for "Password123!" (pre-generated)
    PASSWORD_HASH='$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm'
fi

# Create admin user
run_sql "
INSERT INTO users (email, password, name, role, addresses) VALUES
    ('admin@example.com', '$PASSWORD_HASH', 'Admin User', 'admin', '[]'),
    ('customer@example.com', '$PASSWORD_HASH', 'Test Customer', 'customer', '[]')
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role;
"
print_success "Admin user seeded: admin@example.com / Password123!"
print_success "Customer user seeded: customer@example.com / Password123!"

# ============================================
# SEED CATEGORIES
# ============================================
print_header "SEEDING CATEGORIES"

run_sql "
INSERT INTO categories (name, slug, description) VALUES
    ('Electronics', 'electronics', 'Electronic devices and gadgets'),
    ('Clothing', 'clothing', 'Fashion and apparel'),
    ('Books', 'books', 'Books and educational materials'),
    ('Home & Garden', 'home-garden', 'Home decor and garden supplies'),
    ('Sports & Outdoors', 'sports-outdoors', 'Sports equipment and outdoor gear')
ON CONFLICT (slug) DO NOTHING;
"
print_success "5 categories seeded"

# Get category IDs for products
CAT_ELECTRONICS=$(get_sql_value "SELECT id FROM categories WHERE slug='electronics';")
CAT_CLOTHING=$(get_sql_value "SELECT id FROM categories WHERE slug='clothing';")
CAT_BOOKS=$(get_sql_value "SELECT id FROM categories WHERE slug='books';")
CAT_HOME=$(get_sql_value "SELECT id FROM categories WHERE slug='home-garden';")
CAT_SPORTS=$(get_sql_value "SELECT id FROM categories WHERE slug='sports-outdoors';")

# ============================================
# SEED PRODUCTS
# ============================================
print_header "SEEDING PRODUCTS"

if [ -n "$CAT_ELECTRONICS" ]; then
    run_sql "
    INSERT INTO products (name, description, price, stock, category_id, is_active) VALUES
        -- Electronics
        ('MacBook Pro 14', 'Apple MacBook Pro with M3 chip, 16GB RAM, 512GB SSD', 1999.99, 50, '$CAT_ELECTRONICS', true),
        ('iPhone 15 Pro', 'Apple iPhone 15 Pro, 256GB, Natural Titanium', 1199.99, 100, '$CAT_ELECTRONICS', true),
        ('Sony WH-1000XM5', 'Premium noise-canceling wireless headphones', 349.99, 75, '$CAT_ELECTRONICS', true),
        ('iPad Air', 'Apple iPad Air, 256GB, Space Gray', 749.99, 60, '$CAT_ELECTRONICS', true),
        ('Discontinued Item', 'This product is no longer available', 9.99, 0, '$CAT_ELECTRONICS', false)
    ON CONFLICT DO NOTHING;
    "
    print_success "5 electronics products seeded"
else
    print_error "Electronics category not found"
fi

if [ -n "$CAT_CLOTHING" ]; then
    run_sql "
    INSERT INTO products (name, description, price, stock, category_id, is_active) VALUES
        ('Classic Cotton T-Shirt', '100% organic cotton, available in multiple colors', 29.99, 200, '$CAT_CLOTHING', true),
        ('Slim Fit Jeans', 'Premium denim jeans, comfortable stretch fit', 79.99, 150, '$CAT_CLOTHING', true),
        ('Winter Parka', 'Waterproof winter jacket with faux fur hood', 199.99, 40, '$CAT_CLOTHING', true)
    ON CONFLICT DO NOTHING;
    "
    print_success "3 clothing products seeded"
else
    print_error "Clothing category not found"
fi

if [ -n "$CAT_BOOKS" ]; then
    run_sql "
    INSERT INTO products (name, description, price, stock, category_id, is_active) VALUES
        ('Clean Code', 'A Handbook of Agile Software Craftsmanship by Robert C. Martin', 44.99, 100, '$CAT_BOOKS', true),
        ('Design Patterns', 'Elements of Reusable Object-Oriented Software', 54.99, 80, '$CAT_BOOKS', true)
    ON CONFLICT DO NOTHING;
    "
    print_success "2 book products seeded"
else
    print_error "Books category not found"
fi

if [ -n "$CAT_HOME" ]; then
    run_sql "
    INSERT INTO products (name, description, price, stock, category_id, is_active) VALUES
        ('Smart LED Desk Lamp', 'Adjustable brightness and color temperature', 69.99, 90, '$CAT_HOME', true),
        ('Indoor Plant Set', 'Set of 3 low-maintenance indoor plants', 49.99, 30, '$CAT_HOME', true)
    ON CONFLICT DO NOTHING;
    "
    print_success "2 home products seeded"
else
    print_error "Home category not found"
fi

if [ -n "$CAT_SPORTS" ]; then
    run_sql "
    INSERT INTO products (name, description, price, stock, category_id, is_active) VALUES
        ('Yoga Mat Premium', 'Non-slip yoga mat, 6mm thickness', 39.99, 120, '$CAT_SPORTS', true),
        ('Adjustable Dumbbell Set', 'Adjustable weight from 5-50 lbs', 299.99, 25, '$CAT_SPORTS', true)
    ON CONFLICT DO NOTHING;
    "
    print_success "2 sports products seeded"
else
    print_error "Sports category not found"
fi

# ============================================
# SUMMARY
# ============================================
print_header "SEED SUMMARY"

echo -e "\nSeeded data counts:"
run_sql "SELECT 'Users' as entity, COUNT(*) as count FROM users UNION ALL SELECT 'Categories', COUNT(*) FROM categories UNION ALL SELECT 'Products', COUNT(*) FROM products;" 2>/dev/null | grep -E "Users|Categories|Products"

echo -e "\n${GREEN}Database seeding completed!${NC}"
echo -e "${YELLOW}Test credentials:${NC}"
echo -e "  Admin:    admin@example.com / Password123!"
echo -e "  Customer: customer@example.com / Password123!"
echo -e "${YELLOW}Run the test script: ./scripts/test-api.sh${NC}"
