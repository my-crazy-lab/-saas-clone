# Technical Documentation

## 🏗️ System Architecture

### Backend Architecture (NestJS)

The backend follows a modular architecture with clear separation of concerns:

```
src/
├── auth/                 # Authentication module
│   ├── guards/          # JWT and local auth guards
│   ├── strategies/      # Passport strategies
│   └── dto/            # Data transfer objects
├── users/               # User management
├── calendar/            # Calendar integration
├── meeting-types/       # Meeting type management
├── bookings/           # Booking management
├── notifications/      # Email/SMS notifications
├── scheduling/         # Scheduling logic
└── config/             # Configuration files
```

### Database Schema

#### Core Entities

**Users Table:**
```sql
- id (UUID, Primary Key)
- email (Unique)
- username (Unique)
- password (Hashed with bcrypt)
- firstName, lastName
- plan (FREE, PRO, ENTERPRISE)
- status (ACTIVE, INACTIVE, SUSPENDED)
- notification preferences
- timestamps
```

**Meeting Types Table:**
```sql
- id (UUID, Primary Key)
- userId (Foreign Key to Users)
- title, slug, description
- duration, bufferBefore, bufferAfter
- locationType (GOOGLE_MEET, ZOOM, etc.)
- availability settings
- notification settings
```

**Bookings Table:**
```sql
- id (UUID, Primary Key)
- hostId, meetingTypeId (Foreign Keys)
- guest information (name, email, phone, timezone)
- booking times (start, end, duration)
- status (CONFIRMED, CANCELLED, etc.)
- meeting details (URL, ID, password)
- secure tokens (reschedule, cancel)
- notification tracking
```

### API Endpoints

#### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/google` - Google OAuth
- `GET /api/v1/auth/microsoft` - Microsoft OAuth

#### Users
- `GET /api/v1/users/profile` - Get user profile
- `PATCH /api/v1/users/profile` - Update profile
- `GET /api/v1/users/:username` - Get public user info

#### Meeting Types
- `GET /api/v1/meeting-types` - List user's meeting types
- `POST /api/v1/meeting-types` - Create meeting type
- `GET /api/v1/meeting-types/:id` - Get meeting type
- `PATCH /api/v1/meeting-types/:id` - Update meeting type
- `DELETE /api/v1/meeting-types/:id` - Delete meeting type

#### Bookings
- `POST /api/v1/bookings` - Create booking (public)
- `GET /api/v1/bookings` - List user bookings
- `GET /api/v1/bookings/:id` - Get booking details
- `PATCH /api/v1/bookings/:id/cancel` - Cancel booking
- `PATCH /api/v1/bookings/:id/reschedule` - Reschedule booking

#### Calendar Integration
- `GET /api/v1/calendar/integrations` - List integrations
- `POST /api/v1/calendar/connect/google` - Connect Google Calendar
- `POST /api/v1/calendar/connect/microsoft` - Connect Microsoft Calendar
- `DELETE /api/v1/calendar/integrations/:id` - Disconnect calendar

## 🔐 Security Implementation

### Authentication Flow

1. **Registration/Login**: User provides credentials
2. **Password Hashing**: bcrypt with 12 rounds
3. **JWT Generation**: Signed token with user payload
4. **Token Validation**: JWT strategy validates requests
5. **OAuth Flow**: Google/Microsoft OAuth integration

### Security Measures

- **Rate Limiting**: 100 requests per minute per IP
- **CORS**: Configured for frontend domain
- **Helmet**: Security headers middleware
- **Input Validation**: Class-validator decorators
- **SQL Injection Protection**: TypeORM parameterized queries

## 📧 Notification System

### Email Service Architecture

```typescript
EmailService
├── SendGrid Integration (primary)
├── SMTP Fallback
├── Template Rendering
└── Calendar Invite (.ics) Generation
```

### SMS Service Architecture

```typescript
SmsService
├── Twilio Integration
├── Message Templates
└── Delivery Tracking
```

### Queue Processing

- **Bull Queues**: Redis-backed job processing
- **Notification Processor**: Handles email/SMS jobs
- **Retry Logic**: Automatic retry on failures
- **Scheduling**: Delayed job execution for reminders

## 🗓️ Calendar Integration

### Google Calendar Integration

**OAuth Flow:**
1. Redirect to Google OAuth consent screen
2. Exchange authorization code for tokens
3. Store encrypted tokens in database
4. Refresh tokens automatically when expired

**API Operations:**
- **Free/Busy Query**: Check availability
- **Event Creation**: Create calendar events
- **Google Meet**: Auto-generate meeting links
- **Event Updates**: Modify existing events

### Microsoft Calendar Integration

**OAuth Flow:**
1. Microsoft Graph OAuth consent
2. Token exchange and storage
3. Automatic token refresh

**API Operations:**
- **Calendar View**: Query availability
- **Event Management**: CRUD operations
- **Teams Integration**: Auto-generate Teams meetings

## 🎯 Booking Engine

### Availability Calculation

```typescript
getAvailableSlots(meetingType, date) {
  1. Get availability windows for the day
  2. Query calendar free/busy information
  3. Check existing bookings
  4. Apply buffer times
  5. Filter past time slots
  6. Return available slots
}
```

### Conflict Prevention

- **Database Constraints**: Unique constraints on time slots
- **Optimistic Locking**: Version-based conflict detection
- **Transaction Isolation**: Atomic booking operations
- **Race Condition Handling**: Proper error handling

## 🚀 Performance Optimizations

### Database Optimizations

- **Indexes**: Strategic indexing on frequently queried columns
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Optimized TypeORM queries
- **Caching**: Redis caching for frequently accessed data

### API Optimizations

- **Pagination**: Limit large result sets
- **Eager Loading**: Optimize database relations
- **Response Compression**: Gzip compression
- **Rate Limiting**: Prevent API abuse

## 🔧 Configuration Management

### Environment Variables

```env
# Core Configuration
NODE_ENV=development|production
PORT=3000
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Authentication
JWT_SECRET=secure-random-key
JWT_EXPIRES_IN=7d

# OAuth Credentials
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...

# External Services
SENDGRID_API_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
```

### Configuration Validation

- **Class-validator**: Validate environment variables
- **Type Safety**: TypeScript configuration interfaces
- **Default Values**: Sensible defaults for development

## 📊 Monitoring & Logging

### Logging Strategy

- **Structured Logging**: JSON format for production
- **Log Levels**: DEBUG, INFO, WARN, ERROR
- **Request Logging**: HTTP request/response logging
- **Error Tracking**: Comprehensive error logging

### Health Checks

- **Database Health**: Connection status monitoring
- **Redis Health**: Queue system monitoring
- **External APIs**: Third-party service health

## 🧪 Testing Strategy

### Unit Tests

- **Service Tests**: Business logic testing
- **Controller Tests**: HTTP endpoint testing
- **Utility Tests**: Helper function testing

### Integration Tests

- **Database Tests**: Repository integration
- **API Tests**: End-to-end API testing
- **External Service Mocking**: Mock third-party APIs

### Test Coverage Goals

- **Minimum Coverage**: 80% code coverage
- **Critical Paths**: 100% coverage for booking flow
- **Edge Cases**: Comprehensive error scenario testing

## 🚀 Deployment Architecture

### Production Setup

```yaml
# docker-compose.prod.yml
services:
  api:
    build: .
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis
  
  postgres:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
```

### Scaling Considerations

- **Horizontal Scaling**: Multiple API instances
- **Database Scaling**: Read replicas for heavy queries
- **Queue Scaling**: Multiple worker processes
- **CDN Integration**: Static asset delivery

## 🔄 Migration Strategy

### Database Migrations

```bash
# Generate migration
npm run migration:generate -- MigrationName

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

### Data Seeding

- **Development Seeds**: Test data for development
- **Production Seeds**: Initial configuration data
- **User Migration**: Scripts for data migration

---

This technical documentation provides a comprehensive overview of the system architecture, implementation details, and operational considerations for the scheduling application.
