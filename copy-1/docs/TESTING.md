# Testing Guide

## Overview

This project uses comprehensive testing strategies to ensure code quality and reliability:

- **Backend:** Jest + Supertest for API testing
- **Frontend:** Jest + React Testing Library for component testing
- **Database:** In-memory SQLite for test isolation
- **Coverage:** Comprehensive test coverage reporting

## Running Tests

### All Tests
```bash
# Run all tests (server + client)
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Server Tests Only
```bash
cd server
npm test
npm run test:watch
npm run test:coverage
```

### Client Tests Only
```bash
cd client
npm test
npm run test:watch
npm run test:coverage
```

## Test Structure

### Backend Tests (`server/tests/`)

```
server/tests/
├── setup.ts              # Test configuration and database setup
├── auth.test.ts          # Authentication endpoints
├── survey.test.ts        # Survey CRUD operations
├── question.test.ts      # Question management
├── response.test.ts      # Response submission and retrieval
├── analytics.test.ts     # Analytics endpoints
└── public.test.ts        # Public survey endpoints
```

### Frontend Tests (`client/tests/`)

```
client/tests/
├── setup.ts              # Test configuration and mocks
├── LoginPage.test.tsx    # Login component tests
├── RegisterPage.test.tsx # Registration component tests
├── SurveyBuilder.test.tsx # Survey builder component tests
├── Dashboard.test.tsx    # Dashboard component tests
└── services/             # Service layer tests
    ├── authService.test.ts
    ├── surveyService.test.ts
    └── analyticsService.test.ts
```

## Backend Testing

### Test Setup

The test setup (`server/tests/setup.ts`) provides:
- Database connection management
- Test data cleanup between tests
- Shared Prisma client instance

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

beforeAll(async () => {
  await prisma.$connect()
})

afterAll(async () => {
  await prisma.$disconnect()
})

beforeEach(async () => {
  // Clean up data before each test
  await prisma.answer.deleteMany()
  await prisma.response.deleteMany()
  await prisma.question.deleteMany()
  await prisma.survey.deleteMany()
  await prisma.user.deleteMany()
})
```

### API Testing Examples

#### Authentication Tests
```typescript
describe('Authentication', () => {
  it('should register a new user', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    }

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201)

    expect(response.body.success).toBe(true)
    expect(response.body.data.user.email).toBe(userData.email)
    expect(response.body.data.token).toBeDefined()
  })
})
```

#### Survey Tests
```typescript
describe('Survey Management', () => {
  let token: string

  beforeEach(async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      })
    
    token = response.body.data.token
  })

  it('should create a new survey', async () => {
    const surveyData = {
      title: 'Customer Satisfaction Survey',
      description: 'Help us improve our services',
      isPublic: true
    }

    const response = await request(app)
      .post('/api/surveys')
      .set('Authorization', `Bearer ${token}`)
      .send(surveyData)
      .expect(201)

    expect(response.body.success).toBe(true)
    expect(response.body.data.title).toBe(surveyData.title)
  })
})
```

### Database Testing

Tests use a clean database state for each test:

```typescript
beforeEach(async () => {
  // Clean up all data in reverse dependency order
  await prisma.answer.deleteMany()
  await prisma.response.deleteMany()
  await prisma.question.deleteMany()
  await prisma.survey.deleteMany()
  await prisma.user.deleteMany()
})
```

## Frontend Testing

### Test Setup

The test setup (`client/tests/setup.ts`) provides:
- DOM environment setup with jsdom
- Mock implementations for browser APIs
- Global test utilities

```typescript
import '@testing-library/jest-dom'

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock as any
```

### Component Testing Examples

#### Login Page Tests
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from '../src/pages/auth/LoginPage'

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('LoginPage', () => {
  it('renders login form', () => {
    renderWithProviders(<LoginPage />)

    expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    renderWithProviders(<LoginPage />)

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument()
      expect(screen.getByText('Password is required')).toBeInTheDocument()
    })
  })
})
```

### Service Testing

Test service layer functions independently:

```typescript
import { authService } from '../src/services/authService'

// Mock axios
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('AuthService', () => {
  it('should login user successfully', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: {
          user: { id: '1', name: 'Test User', email: 'test@example.com' },
          token: 'test-token'
        }
      }
    }

    mockedAxios.post.mockResolvedValue(mockResponse)

    const result = await authService.login({
      email: 'test@example.com',
      password: 'password123'
    })

    expect(result.user.email).toBe('test@example.com')
    expect(result.token).toBe('test-token')
  })
})
```

## Test Categories

### Unit Tests
- Test individual functions and components in isolation
- Mock external dependencies
- Fast execution
- High coverage

### Integration Tests
- Test API endpoints with database
- Test component interactions
- Verify data flow between layers
- More realistic scenarios

### End-to-End Tests (Future)
- Test complete user workflows
- Use real browser environment
- Test across multiple pages
- Verify full application functionality

## Mocking Strategies

### Backend Mocks
```typescript
// Mock external services
jest.mock('../src/services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}))

// Mock environment variables
process.env.JWT_SECRET = 'test-secret'
process.env.NODE_ENV = 'test'
```

### Frontend Mocks
```typescript
// Mock React Router
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

// Mock Zustand stores
jest.mock('../src/stores/authStore')
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>
```

## Coverage Requirements

### Target Coverage
- **Statements:** > 80%
- **Branches:** > 75%
- **Functions:** > 80%
- **Lines:** > 80%

### Coverage Reports
```bash
# Generate HTML coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

### Coverage Configuration

**Jest Configuration (`jest.config.js`):**
```javascript
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
  },
}
```

## Best Practices

### Test Organization
1. **Describe blocks** for grouping related tests
2. **Clear test names** that describe expected behavior
3. **Setup and teardown** for consistent test state
4. **Test isolation** - each test should be independent

### Test Data
1. **Minimal test data** - only what's needed for the test
2. **Factory functions** for creating test objects
3. **Realistic data** that matches production scenarios
4. **Edge cases** - test boundary conditions

### Assertions
1. **Specific assertions** - test exact expected values
2. **Multiple assertions** when testing complex objects
3. **Error testing** - verify error conditions
4. **Async testing** - properly handle promises and async operations

### Performance
1. **Fast tests** - optimize for quick feedback
2. **Parallel execution** - run tests concurrently when possible
3. **Selective testing** - run only affected tests during development
4. **Test timeouts** - prevent hanging tests

## Continuous Integration

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: survey_builder_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
```

## Debugging Tests

### Debug Individual Tests
```bash
# Run specific test file
npm test -- auth.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should login"

# Run tests in debug mode
npm test -- --detectOpenHandles --forceExit
```

### Debug Frontend Tests
```bash
# Run with verbose output
npm test -- --verbose

# Debug in browser
npm test -- --debug
```

### Common Issues

1. **Async test failures** - Use `waitFor` for async operations
2. **Memory leaks** - Properly clean up event listeners and timers
3. **Mock issues** - Clear mocks between tests
4. **Database state** - Ensure proper cleanup between tests

## Writing New Tests

### Checklist for New Features
- [ ] Unit tests for new functions/components
- [ ] Integration tests for API endpoints
- [ ] Error handling tests
- [ ] Edge case tests
- [ ] Update existing tests if needed
- [ ] Verify coverage meets requirements

### Test Template

```typescript
describe('FeatureName', () => {
  // Setup
  beforeEach(() => {
    // Initialize test state
  })

  afterEach(() => {
    // Cleanup
  })

  describe('happy path', () => {
    it('should handle normal case', () => {
      // Test implementation
    })
  })

  describe('error cases', () => {
    it('should handle invalid input', () => {
      // Test error handling
    })
  })

  describe('edge cases', () => {
    it('should handle boundary conditions', () => {
      // Test edge cases
    })
  })
})
```
