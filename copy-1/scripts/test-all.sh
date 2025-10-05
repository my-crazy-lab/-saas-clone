#!/bin/bash

# Survey Builder - Comprehensive Test Runner
# This script runs all tests and generates coverage reports

set -e  # Exit on any error

echo "🧪 Survey Builder - Running All Tests"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check if dependencies are installed
print_status "Checking dependencies..."
if [ ! -d "node_modules" ] || [ ! -d "server/node_modules" ] || [ ! -d "client/node_modules" ]; then
    print_warning "Dependencies not found. Installing..."
    npm run install:all
fi

# Create test results directory
mkdir -p test-results

# Run server tests
print_status "Running server tests..."
cd server

if npm test -- --coverage --coverageReporters=json-summary --coverageReporters=text > ../test-results/server-tests.log 2>&1; then
    print_success "Server tests passed"
    
    # Extract coverage summary
    if [ -f "coverage/coverage-summary.json" ]; then
        node -e "
            const coverage = require('./coverage/coverage-summary.json');
            const total = coverage.total;
            console.log('Server Coverage:');
            console.log('  Statements: ' + total.statements.pct + '%');
            console.log('  Branches: ' + total.branches.pct + '%');
            console.log('  Functions: ' + total.functions.pct + '%');
            console.log('  Lines: ' + total.lines.pct + '%');
        "
    fi
else
    print_error "Server tests failed"
    echo "Check test-results/server-tests.log for details"
    SERVER_TESTS_FAILED=1
fi

cd ..

# Run client tests
print_status "Running client tests..."
cd client

if npm test -- --coverage --coverageReporters=json-summary --coverageReporters=text --watchAll=false > ../test-results/client-tests.log 2>&1; then
    print_success "Client tests passed"
    
    # Extract coverage summary
    if [ -f "coverage/coverage-summary.json" ]; then
        node -e "
            const coverage = require('./coverage/coverage-summary.json');
            const total = coverage.total;
            console.log('Client Coverage:');
            console.log('  Statements: ' + total.statements.pct + '%');
            console.log('  Branches: ' + total.branches.pct + '%');
            console.log('  Functions: ' + total.functions.pct + '%');
            console.log('  Lines: ' + total.lines.pct + '%');
        "
    fi
else
    print_error "Client tests failed"
    echo "Check test-results/client-tests.log for details"
    CLIENT_TESTS_FAILED=1
fi

cd ..

# Run build tests
print_status "Testing builds..."

# Test server build
print_status "Building server..."
cd server
if npm run build > ../test-results/server-build.log 2>&1; then
    print_success "Server build successful"
else
    print_error "Server build failed"
    echo "Check test-results/server-build.log for details"
    SERVER_BUILD_FAILED=1
fi
cd ..

# Test client build
print_status "Building client..."
cd client
if npm run build > ../test-results/client-build.log 2>&1; then
    print_success "Client build successful"
else
    print_error "Client build failed"
    echo "Check test-results/client-build.log for details"
    CLIENT_BUILD_FAILED=1
fi
cd ..

# Generate combined coverage report
print_status "Generating combined coverage report..."
cat > test-results/coverage-summary.md << EOF
# Test Coverage Summary

## Server Coverage
$(cd server && [ -f coverage/coverage-summary.json ] && node -e "
const coverage = require('./coverage/coverage-summary.json');
const total = coverage.total;
console.log('- **Statements:** ' + total.statements.pct + '%');
console.log('- **Branches:** ' + total.branches.pct + '%');
console.log('- **Functions:** ' + total.functions.pct + '%');
console.log('- **Lines:** ' + total.lines.pct + '%');
" || echo "Coverage data not available")

## Client Coverage
$(cd client && [ -f coverage/coverage-summary.json ] && node -e "
const coverage = require('./coverage/coverage-summary.json');
const total = coverage.total;
console.log('- **Statements:** ' + total.statements.pct + '%');
console.log('- **Branches:** ' + total.branches.pct + '%');
console.log('- **Functions:** ' + total.functions.pct + '%');
console.log('- **Lines:** ' + total.lines.pct + '%');
" || echo "Coverage data not available")

## Test Results
- Server Tests: $([ -z "$SERVER_TESTS_FAILED" ] && echo "✅ PASSED" || echo "❌ FAILED")
- Client Tests: $([ -z "$CLIENT_TESTS_FAILED" ] && echo "✅ PASSED" || echo "❌ FAILED")
- Server Build: $([ -z "$SERVER_BUILD_FAILED" ] && echo "✅ PASSED" || echo "❌ FAILED")
- Client Build: $([ -z "$CLIENT_BUILD_FAILED" ] && echo "✅ PASSED" || echo "❌ FAILED")

Generated on: $(date)
EOF

# Summary
echo ""
echo "======================================"
echo "🏁 Test Summary"
echo "======================================"

if [ -z "$SERVER_TESTS_FAILED" ] && [ -z "$CLIENT_TESTS_FAILED" ] && [ -z "$SERVER_BUILD_FAILED" ] && [ -z "$CLIENT_BUILD_FAILED" ]; then
    print_success "All tests and builds passed! 🎉"
    echo ""
    echo "📊 Coverage reports available at:"
    echo "   - Server: server/coverage/lcov-report/index.html"
    echo "   - Client: client/coverage/lcov-report/index.html"
    echo ""
    echo "📋 Test results saved to test-results/"
    exit 0
else
    print_error "Some tests or builds failed:"
    [ ! -z "$SERVER_TESTS_FAILED" ] && echo "   ❌ Server tests"
    [ ! -z "$CLIENT_TESTS_FAILED" ] && echo "   ❌ Client tests"
    [ ! -z "$SERVER_BUILD_FAILED" ] && echo "   ❌ Server build"
    [ ! -z "$CLIENT_BUILD_FAILED" ] && echo "   ❌ Client build"
    echo ""
    echo "📋 Check test-results/ directory for detailed logs"
    exit 1
fi
