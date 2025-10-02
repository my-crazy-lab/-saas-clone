#!/bin/bash

# Local Development Setup Script
echo "🚀 Setting up Scheduling App for local development..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env file with your actual configuration values"
else
    echo "✅ .env file already exists"
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Start Docker services (PostgreSQL and Redis)
echo "🐳 Starting Docker services..."
docker-compose up -d postgres redis

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if PostgreSQL is ready
echo "🔍 Checking PostgreSQL connection..."
until docker-compose exec -T postgres pg_isready -U postgres; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done
echo "✅ PostgreSQL is ready"

# Check if Redis is ready
echo "🔍 Checking Redis connection..."
until docker-compose exec -T redis redis-cli ping | grep -q PONG; do
    echo "Waiting for Redis..."
    sleep 2
done
echo "✅ Redis is ready"

# Build the application
echo "🔨 Building the application..."
npm run build

echo ""
echo "🎉 Setup complete! You can now start the application:"
echo ""
echo "Backend (Terminal 1):"
echo "  npm run start:dev"
echo ""
echo "Frontend (Terminal 2):"
echo "  cd frontend && npm start"
echo ""
echo "Or use Docker Compose:"
echo "  docker-compose up"
echo ""
echo "📚 Documentation:"
echo "  - API Docs: http://localhost:3000/api/docs"
echo "  - Frontend: http://localhost:3001"
echo ""
echo "⚠️  Don't forget to:"
echo "  1. Update .env with your OAuth credentials"
echo "  2. Configure email/SMS services if needed"
echo "  3. Run database migrations if required"
