#!/bin/bash

# Survey Builder - Setup Verification Script
# This script verifies that the development environment is properly set up

set -e

echo "🔍 Survey Builder - Setup Verification"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

ERRORS=0

# Check Node.js version
print_status "Checking Node.js version..."
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -ge 18 ]; then
        print_success "Node.js $NODE_VERSION (✓ >= 18.0.0)"
    else
        print_error "Node.js $NODE_VERSION (✗ requires >= 18.0.0)"
        ERRORS=$((ERRORS + 1))
    fi
else
    print_error "Node.js not found"
    ERRORS=$((ERRORS + 1))
fi

# Check npm version
print_status "Checking npm version..."
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    print_success "npm $NPM_VERSION"
else
    print_error "npm not found"
    ERRORS=$((ERRORS + 1))
fi

# Check project structure
print_status "Checking project structure..."
REQUIRED_FILES=(
    "package.json"
    "server/package.json"
    "client/package.json"
    "server/prisma/schema.prisma"
    "server/.env"
    "client/.env"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "$file exists"
    else
        print_error "$file missing"
        ERRORS=$((ERRORS + 1))
    fi
done

# Check dependencies
print_status "Checking dependencies..."
DEPENDENCY_DIRS=(
    "node_modules"
    "server/node_modules"
    "client/node_modules"
)

for dir in "${DEPENDENCY_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        print_success "$dir exists"
    else
        print_warning "$dir missing (run 'npm run install:all')"
    fi
done

# Check environment variables
print_status "Checking environment variables..."

# Server environment
if [ -f "server/.env" ]; then
    if grep -q "DATABASE_URL=" server/.env; then
        print_success "DATABASE_URL configured"
    else
        print_error "DATABASE_URL not found in server/.env"
        ERRORS=$((ERRORS + 1))
    fi
    
    if grep -q "JWT_SECRET=" server/.env; then
        print_success "JWT_SECRET configured"
    else
        print_error "JWT_SECRET not found in server/.env"
        ERRORS=$((ERRORS + 1))
    fi
else
    print_error "server/.env not found"
    ERRORS=$((ERRORS + 1))
fi

# Client environment
if [ -f "client/.env" ]; then
    if grep -q "VITE_API_BASE_URL=" client/.env; then
        print_success "VITE_API_BASE_URL configured"
    else
        print_error "VITE_API_BASE_URL not found in client/.env"
        ERRORS=$((ERRORS + 1))
    fi
else
    print_error "client/.env not found"
    ERRORS=$((ERRORS + 1))
fi

# Check database connection (if PostgreSQL is available)
print_status "Checking database connection..."
if command -v psql >/dev/null 2>&1; then
    # Extract database URL from .env
    if [ -f "server/.env" ]; then
        DATABASE_URL=$(grep "DATABASE_URL=" server/.env | cut -d'=' -f2- | tr -d '"')
        if [[ $DATABASE_URL == postgresql://* ]]; then
            print_success "PostgreSQL connection string found"
            # Try to connect (this might fail if DB is not running, which is OK)
            if psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
                print_success "Database connection successful"
            else
                print_warning "Database connection failed (database may not be running)"
            fi
        elif [[ $DATABASE_URL == file:* ]]; then
            print_success "SQLite database configured"
        else
            print_warning "Unknown database type in DATABASE_URL"
        fi
    fi
else
    print_warning "PostgreSQL client not found (psql)"
fi

# Check Docker (optional)
print_status "Checking Docker (optional)..."
if command -v docker >/dev/null 2>&1; then
    DOCKER_VERSION=$(docker --version)
    print_success "Docker available: $DOCKER_VERSION"
    
    if command -v docker-compose >/dev/null 2>&1; then
        COMPOSE_VERSION=$(docker-compose --version)
        print_success "Docker Compose available: $COMPOSE_VERSION"
    else
        print_warning "Docker Compose not found"
    fi
else
    print_warning "Docker not found (optional for local PostgreSQL)"
fi

# Check build capability
print_status "Checking build capability..."
cd server
if npm run build >/dev/null 2>&1; then
    print_success "Server builds successfully"
else
    print_error "Server build failed"
    ERRORS=$((ERRORS + 1))
fi
cd ..

cd client
if npm run build >/dev/null 2>&1; then
    print_success "Client builds successfully"
else
    print_error "Client build failed"
    ERRORS=$((ERRORS + 1))
fi
cd ..

# Check test capability
print_status "Checking test capability..."
cd server
if npm test -- --passWithNoTests >/dev/null 2>&1; then
    print_success "Server tests can run"
else
    print_warning "Server tests may have issues"
fi
cd ..

cd client
if npm test -- --passWithNoTests --watchAll=false >/dev/null 2>&1; then
    print_success "Client tests can run"
else
    print_warning "Client tests may have issues"
fi
cd ..

# Summary
echo ""
echo "======================================"
echo "📋 Setup Verification Summary"
echo "======================================"

if [ $ERRORS -eq 0 ]; then
    print_success "Setup verification completed successfully! 🎉"
    echo ""
    echo "✅ Your development environment is ready!"
    echo ""
    echo "Next steps:"
    echo "1. Start database: docker-compose -f docker-compose.dev.yml up -d"
    echo "2. Run migrations: cd server && npx prisma migrate dev"
    echo "3. Seed database: cd server && npm run db:seed"
    echo "4. Start development: npm run dev"
    echo ""
    echo "📚 For detailed setup instructions, see docs/SETUP.md"
else
    print_error "Setup verification found $ERRORS error(s)"
    echo ""
    echo "❌ Please fix the errors above before proceeding"
    echo ""
    echo "📚 For help, see docs/SETUP.md"
    exit 1
fi
