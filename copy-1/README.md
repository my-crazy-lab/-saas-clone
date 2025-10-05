# Survey Builder Application

A comprehensive survey builder application with drag-and-drop interface, analytics dashboard, and multiple distribution options.

## Features

### Core Features
- **Survey Builder**: Drag-and-drop interface for creating surveys
- **Question Types**: Multiple choice, Likert scale, text inputs, ratings, and more
- **Conditional Logic**: Skip logic and branching based on responses
- **Survey Distribution**: Share via links, QR codes, embed codes, and email
- **Analytics Dashboard**: Charts, word clouds, and data visualization
- **Data Export**: CSV export functionality
- **User Management**: Authentication and role-based access

### Question Types Supported
- Multiple Choice (single/multiple selection)
- Likert Scale (1-5 rating)
- Short Text / Long Text
- Rating / Stars
- Number Input
- Date/Time Selection

## Technology Stack

### Frontend
- **React 18** with Vite
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React DnD** for drag-and-drop functionality
- **Chart.js** for analytics visualization
- **React Hook Form** for form handling

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **PostgreSQL** database
- **Prisma** ORM
- **JWT** authentication
- **Multer** for file uploads

### Development Tools
- **ESLint** and **Prettier** for code quality
- **Jest** and **React Testing Library** for testing
- **Docker** for containerization
- **GitHub Actions** for CI/CD

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Installation

1. Clone the repository and install dependencies:
```bash
npm run install:all
```

2. Set up environment variables:
```bash
# Copy environment files
cp server/.env.example server/.env
cp client/.env.example client/.env
```

3. Set up the database:
```bash
cd server
npx prisma migrate dev
npx prisma db seed
```

4. Start the development servers:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Alternative Database Setup Options

#### Option 1: Docker PostgreSQL (Recommended)
If you have Docker installed:
```bash
# Start PostgreSQL in Docker
docker-compose -f docker-compose.dev.yml up -d

# Then continue with step 3 above
```

#### Option 2: SQLite (Quick Demo)
For a quick demo without PostgreSQL:
```bash
# In server/.env, change DATABASE_URL to:
# DATABASE_URL="file:./dev.db"

# Then continue with step 3 above
```

#### Option 3: Cloud Database
Use a cloud PostgreSQL service like:
- **Supabase** (free tier available)
- **Railway** (free tier available)
- **Heroku Postgres** (free tier available)

Update the `DATABASE_URL` in `server/.env` with your cloud database connection string.

## Project Structure

```
survey-builder/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   ├── public/            # Static assets
│   └── tests/             # Frontend tests
├── server/                # Node.js backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utility functions
│   ├── prisma/            # Database schema and migrations
│   └── tests/             # Backend tests
└── docs/                  # Documentation
```

## API Documentation

The API documentation is available at `/api/docs` when running the development server.

## Testing

Run all tests:
```bash
npm test
```

Run specific test suites:
```bash
npm run test:server  # Backend tests
npm run test:client  # Frontend tests
```

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment
```bash
docker-compose up -d
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
