# Local Development Guide

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Docker & Docker Compose** - [Download here](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download here](https://git-scm.com/)

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd scheduling-app

# Run the setup script
chmod +x scripts/setup-local.sh
./scripts/setup-local.sh
```

### 2. Environment Configuration

Update your `.env` file with the following:

```env
# Database (Docker will handle this)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/scheduling_app

# Redis (Docker will handle this)
REDIS_URL=redis://localhost:6379

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secure-jwt-secret-256-bits-long

# Frontend URL
FRONTEND_URL=http://localhost:3001

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/v1/auth/google/callback

# Microsoft OAuth (get from Azure Portal)
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_REDIRECT_URI=http://localhost:3000/api/v1/auth/microsoft/callback

# Email Service (optional - for notifications)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@yourapp.com

# SMS Service (optional - for SMS reminders)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Start Development Servers

**Option A: Using Docker Compose (Recommended)**
```bash
# Start all services
docker-compose up

# Or start in background
docker-compose up -d

# View logs
docker-compose logs -f
```

**Option B: Manual Setup**
```bash
# Terminal 1: Start database and Redis
docker-compose up -d postgres redis

# Terminal 2: Start backend
npm run start:dev

# Terminal 3: Start frontend
cd frontend && npm start
```

### 4. Access the Application

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs

## 🛠️ Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e
```

### Database Operations

```bash
# Generate migration
npm run migration:generate -- MigrationName

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert

# Seed database (if seeds exist)
npm run seed:run
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Kill process using port 3001
lsof -ti:3001 | xargs kill -9
```

#### 2. Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres

# View PostgreSQL logs
docker-compose logs postgres
```

#### 3. Redis Connection Issues
```bash
# Check if Redis is running
docker-compose ps redis

# Test Redis connection
docker-compose exec redis redis-cli ping

# Restart Redis
docker-compose restart redis
```

#### 4. Frontend Build Issues
```bash
# Clear node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install

# Clear React cache
npm start -- --reset-cache
```

#### 5. Backend Build Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear NestJS cache
rm -rf dist
npm run build
```

### Environment-Specific Issues

#### macOS
```bash
# If you get permission errors with Docker
sudo chown -R $(whoami) ~/.docker

# If ports are blocked by firewall
sudo pfctl -f /etc/pf.conf
```

#### Windows
```bash
# Use PowerShell or Git Bash
# Make sure Docker Desktop is running
# Use 'docker compose' instead of 'docker-compose'
```

#### Linux
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# If systemd issues
sudo systemctl start docker
```

## 📊 Monitoring & Debugging

### Application Logs

```bash
# Backend logs
npm run start:dev

# Frontend logs
cd frontend && npm start

# Docker logs
docker-compose logs -f api
docker-compose logs -f frontend
```

### Database Inspection

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d scheduling_app

# Common queries
\dt                    # List tables
\d users              # Describe users table
SELECT * FROM users;  # Query users
```

### Redis Inspection

```bash
# Connect to Redis
docker-compose exec redis redis-cli

# Common commands
KEYS *                # List all keys
GET key_name         # Get value
FLUSHALL            # Clear all data
```

## 🧪 Testing Guide

### Unit Tests

```bash
# Run specific test file
npm test -- users.service.spec.ts

# Run tests for specific module
npm test -- --testPathPattern=auth

# Run tests with coverage for specific file
npm test -- --coverage --testPathPattern=users.service
```

### Integration Tests

```bash
# Run E2E tests
npm run test:e2e

# Run specific E2E test
npm run test:e2e -- --testNamePattern="Authentication"
```

### Manual Testing

1. **User Registration**
   - Go to http://localhost:3001/register
   - Create a new account
   - Verify email confirmation (check logs)

2. **OAuth Testing**
   - Try Google OAuth login
   - Try Microsoft OAuth login
   - Check token storage

3. **Meeting Types**
   - Create a meeting type
   - Set availability windows
   - Test public booking page

4. **Booking Flow**
   - Visit public scheduling page
   - Book a meeting
   - Check email notifications
   - Test reschedule/cancel

## 🚀 Production Preparation

### Build for Production

```bash
# Build backend
npm run build

# Build frontend
cd frontend && npm run build

# Test production build
npm run start:prod
```

### Environment Variables

Ensure all production environment variables are set:

- Strong JWT secrets
- Production database URLs
- Real OAuth credentials
- Email/SMS service credentials
- Proper CORS settings

### Security Checklist

- [ ] JWT secrets are secure and random
- [ ] Database credentials are secure
- [ ] OAuth applications are configured for production domains
- [ ] CORS is configured for production domains
- [ ] Rate limiting is enabled
- [ ] HTTPS is enforced
- [ ] Security headers are enabled

## 📚 Additional Resources

### Documentation
- [NestJS Documentation](https://docs.nestjs.com/)
- [React Documentation](https://reactjs.org/docs/)
- [TypeORM Documentation](https://typeorm.io/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### OAuth Setup Guides
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [Microsoft OAuth Setup](https://docs.microsoft.com/en-us/azure/active-directory/develop/)

### Third-Party Services
- [SendGrid Email API](https://docs.sendgrid.com/)
- [Twilio SMS API](https://www.twilio.com/docs/sms)

---

## 🆘 Getting Help

If you encounter issues:

1. Check this troubleshooting guide
2. Review application logs
3. Check Docker container status
4. Verify environment variables
5. Create an issue in the repository

**Happy coding! 🎉**
