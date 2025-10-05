# Survey Builder - Local Development Setup

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)
- **PostgreSQL** (version 14 or higher)
- **Git**

## Quick Start

1. **Clone the repository:**
```bash
git clone <repository-url>
cd survey-builder
```

2. **Install dependencies:**
```bash
npm run install:all
```

3. **Set up environment variables:**
```bash
# Copy environment files
cp server/.env.example server/.env
cp client/.env.example client/.env
```

4. **Configure database:**
   - Create a PostgreSQL database named `survey_builder`
   - Update the `DATABASE_URL` in `server/.env`

5. **Set up database:**
```bash
cd server
npx prisma migrate dev
npx prisma db seed
```

6. **Start development servers:**
```bash
# From root directory
npm run dev
```

The application will be available at:
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3001
- **API Documentation:** http://localhost:3001/api/docs

## Detailed Setup Instructions

### 1. Database Setup

#### Option A: Local PostgreSQL Installation

**On macOS (using Homebrew):**
```bash
brew install postgresql
brew services start postgresql
createdb survey_builder
```

**On Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb survey_builder
```

**On Windows:**
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Install and start the service
3. Use pgAdmin or command line to create database

#### Option B: Docker PostgreSQL

```bash
docker run --name survey-builder-db \
  -e POSTGRES_DB=survey_builder \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:14
```

### 2. Environment Configuration

#### Server Environment (`server/.env`)

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/survey_builder?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=3001
NODE_ENV="development"

# CORS Configuration
CORS_ORIGIN="http://localhost:5173"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email Configuration (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="noreply@surveybuilder.com"
FROM_NAME="Survey Builder"

# Security
BCRYPT_ROUNDS=10
```

#### Client Environment (`client/.env`)

```bash
VITE_API_BASE_URL=http://localhost:3001/api
VITE_APP_NAME="Survey Builder"
VITE_APP_VERSION="1.0.0"
```

### 3. Database Migration and Seeding

```bash
cd server

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed database with demo data
npm run db:seed

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

### 4. Development Commands

#### Root Directory Commands

```bash
# Install all dependencies (server + client)
npm run install:all

# Start both development servers
npm run dev

# Build both applications
npm run build

# Run tests for both applications
npm run test
```

#### Server Commands

```bash
cd server

# Start development server with hot reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start production server
npm start

# Run tests
npm test
npm run test:watch
npm run test:coverage

# Database commands
npm run db:migrate
npm run db:seed
npm run db:generate
npm run db:studio

# Linting
npm run lint
npm run lint:fix
```

#### Client Commands

```bash
cd client

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test
npm run test:watch
npm run test:coverage

# Linting
npm run lint
npm run lint:fix
```

## Demo Data

The seeded database includes:

### Demo Users
- **Admin User:**
  - Email: `admin@surveybuilder.com`
  - Password: `admin123`
  - Role: ADMIN

- **Regular User:**
  - Email: `user@surveybuilder.com`
  - Password: `user123`
  - Role: USER

### Sample Survey
- Customer Satisfaction Survey with multiple question types
- Includes sample responses for testing analytics

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run server tests only
cd server && npm test

# Run client tests only
cd client && npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Structure

**Server Tests:**
- `tests/setup.ts` - Test configuration and database setup
- `tests/auth.test.ts` - Authentication endpoints
- `tests/survey.test.ts` - Survey CRUD operations
- `tests/question.test.ts` - Question management
- `tests/response.test.ts` - Response submission and retrieval

**Client Tests:**
- `tests/setup.ts` - Test configuration and mocks
- `tests/LoginPage.test.tsx` - Login component tests
- `tests/SurveyBuilder.test.tsx` - Survey builder component tests

## Troubleshooting

### Common Issues

1. **Database Connection Error:**
   - Verify PostgreSQL is running
   - Check DATABASE_URL format
   - Ensure database exists

2. **Port Already in Use:**
   - Change PORT in server/.env
   - Update VITE_API_BASE_URL in client/.env

3. **CORS Errors:**
   - Verify CORS_ORIGIN in server/.env matches client URL
   - Check if both servers are running

4. **JWT Token Issues:**
   - Ensure JWT_SECRET is set in server/.env
   - Clear browser localStorage if needed

5. **Build Errors:**
   - Delete node_modules and reinstall: `rm -rf node_modules && npm install`
   - Clear TypeScript cache: `npx tsc --build --clean`

### Debugging

1. **Enable Debug Logging:**
```bash
# Server
DEBUG=* npm run dev

# Client
VITE_DEBUG=true npm run dev
```

2. **Database Debugging:**
```bash
# View database schema
npx prisma studio

# Reset database
npm run db:reset

# View migration status
npx prisma migrate status
```

3. **API Testing:**
```bash
# Test API endpoints
curl -X GET http://localhost:3001/health

# Test with authentication
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## IDE Setup

### VS Code Extensions

Recommended extensions for optimal development experience:

- **Prisma** - Database schema syntax highlighting
- **TypeScript Importer** - Auto import TypeScript modules
- **ES7+ React/Redux/React-Native snippets** - React code snippets
- **Tailwind CSS IntelliSense** - Tailwind class autocomplete
- **REST Client** - Test API endpoints directly in VS Code

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  }
}
```

## Performance Tips

1. **Development:**
   - Use `npm run dev` for hot reload
   - Keep Prisma Studio open for database inspection
   - Use browser dev tools for debugging

2. **Database:**
   - Use database indexes for better query performance
   - Monitor query performance with Prisma logging
   - Regular database maintenance

3. **Frontend:**
   - Use React DevTools for component debugging
   - Monitor bundle size with `npm run build`
   - Optimize images and assets

## Next Steps

After successful setup:

1. **Explore the Application:**
   - Login with demo credentials
   - Create a new survey
   - Add different question types
   - Test survey distribution features

2. **Development Workflow:**
   - Make changes to code
   - Write tests for new features
   - Run tests before committing
   - Use Git for version control

3. **Customization:**
   - Modify theme colors in Tailwind config
   - Add new question types
   - Extend API endpoints
   - Customize email templates

For deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).
For API documentation, see [API.md](./API.md).
