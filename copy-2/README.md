# Scheduling App - MVP Implementation

A comprehensive scheduling and booking web application similar to Calendly, built with modern technologies.

## 🚀 Features Implemented

### ✅ Core Features (MVP)
- **User Authentication**: Email/password login with JWT tokens
- **OAuth Integration**: Google and Microsoft OAuth for seamless login
- **Meeting Types Management**: Create and configure different meeting types
- **Public Scheduling Pages**: Shareable booking pages for each user
- **Calendar Integration**: Google Calendar and Microsoft Office 365 sync
- **Email Notifications**: Booking confirmations and reminders
- **SMS Notifications**: Optional SMS reminders (Twilio integration)
- **Booking Management**: Create, reschedule, and cancel bookings
- **Dashboard**: User dashboard for managing bookings and settings
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

### 🔧 Technical Stack

**Backend:**
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport strategies
- **Queue System**: Bull with Redis for background jobs
- **Email Service**: SendGrid/SMTP support
- **SMS Service**: Twilio integration
- **API Documentation**: Swagger/OpenAPI

**Frontend:**
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **HTTP Client**: Axios
- **State Management**: React hooks

**Infrastructure:**
- **Containerization**: Docker and Docker Compose
- **Database**: PostgreSQL
- **Cache/Queue**: Redis
- **Environment**: Environment-based configuration

## 📋 Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- PostgreSQL (or use Docker)
- Redis (or use Docker)

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd scheduling-app
```

### 2. Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/scheduling_app

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Google OAuth & Calendar
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Microsoft OAuth & Calendar  
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret

# Email Service (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@yourapp.com

# SMS Service (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Install Dependencies
```bash
# Backend dependencies
npm install

# Frontend dependencies
cd frontend && npm install
```

### 4. Database Setup
```bash
# Using Docker Compose (recommended)
docker-compose up -d postgres redis

# Or manually setup PostgreSQL and Redis
```

### 5. Run the Application

**Development Mode:**
```bash
# Backend (Terminal 1)
npm run start:dev

# Frontend (Terminal 2)  
cd frontend && npm start
```

**Using Docker Compose:**
```bash
docker-compose up
```

## 📚 API Documentation

Once the application is running, visit:
- **API Documentation**: http://localhost:3000/api/docs
- **Frontend Application**: http://localhost:3001

## 🧪 Testing

```bash
# Run backend tests
npm test

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e

# Frontend tests
cd frontend && npm test
```

### Test Coverage

Current test coverage includes:
- ✅ Authentication controller tests
- ✅ User service tests
- ✅ Basic unit tests for core services
- 🔄 Integration tests (in progress)
- 🔄 E2E tests (in progress)

## 📖 Usage Guide

### For Users (Hosts)

1. **Sign Up**: Create an account at `/register`
2. **Connect Calendar**: Link your Google or Microsoft calendar
3. **Create Meeting Types**: Define your available meeting types
4. **Share Your Link**: Share your scheduling link: `/schedule/your-username`

### For Guests

1. **Visit Scheduling Page**: Go to the host's scheduling link
2. **Select Meeting Type**: Choose from available meeting types
3. **Pick Time Slot**: Select from available time slots
4. **Book Meeting**: Fill in your details and confirm booking
5. **Receive Confirmation**: Get email confirmation with meeting details

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React)       │◄──►│   (NestJS)      │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Redis Queue   │
                       │   (Bull Jobs)   │
                       └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   External APIs │
                       │ • Google Cal    │
                       │ • Microsoft Cal │
                       │ • SendGrid      │
                       │ • Twilio        │
                       └─────────────────┘
```

## 🔐 Security Features

- **Password Hashing**: bcrypt with configurable rounds
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Configured CORS policies
- **Input Validation**: Comprehensive input validation
- **SQL Injection Protection**: TypeORM query builder protection

## 🚀 Deployment

### Production Deployment

1. **Build the Application**:
```bash
npm run build
cd frontend && npm run build
```

2. **Set Production Environment Variables**
3. **Deploy using Docker**:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables for Production

Ensure all sensitive variables are properly set:
- Database connection strings
- JWT secrets (use strong, random keys)
- OAuth client credentials
- Email/SMS service credentials

## 📈 Monitoring & Logging

- **Application Logs**: Structured logging with NestJS
- **Database Monitoring**: PostgreSQL performance monitoring
- **Queue Monitoring**: Bull dashboard for job monitoring
- **Error Tracking**: Comprehensive error handling and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the API documentation at `/api/docs`
- Review the codebase documentation
- Create an issue in the repository

---

**Built with ❤️ using NestJS, React, and modern web technologies**
