# Deployment Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker (optional)

## Environment Setup

### Backend Environment Variables

Create `backend/.env` with the following variables:

```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# Redis
REDIS_URL="redis://host:port"

# JWT
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"
JWT_EXPIRES_IN="7d"

# Server
PORT=8000
NODE_ENV="production"

# Stripe
STRIPE_SECRET_KEY="sk_live_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_live_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_stripe_webhook_secret"

# PayPal
PAYPAL_CLIENT_ID="your_paypal_client_id"
PAYPAL_CLIENT_SECRET="your_paypal_client_secret"
PAYPAL_ENVIRONMENT="production"

# CORS
CORS_ORIGIN="https://yourdomain.com"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Environment Variables

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
```

## Database Setup

1. Create PostgreSQL database:
```sql
CREATE DATABASE saas_analytics;
CREATE USER saas_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE saas_analytics TO saas_user;
```

2. Run database migrations:
```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

## Docker Deployment

### Using Docker Compose

1. Update `docker-compose.yml` for production:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: saas_analytics
      POSTGRES_USER: saas_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      DATABASE_URL: postgresql://saas_user:${POSTGRES_PASSWORD}@postgres:5432/saas_analytics
      REDIS_URL: redis://redis:6379
      NODE_ENV: production
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    environment:
      NEXT_PUBLIC_API_URL: https://api.yourdomain.com
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

2. Create production Dockerfiles:

**backend/Dockerfile.prod:**
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 8000

CMD ["npm", "start"]
```

**frontend/Dockerfile.prod:**
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
```

## Manual Deployment

### Backend Deployment

1. Install dependencies:
```bash
cd backend
npm ci --only=production
```

2. Build the application:
```bash
npm run build
```

3. Run database migrations:
```bash
npx prisma migrate deploy
npx prisma generate
```

4. Start the server:
```bash
npm start
```

### Frontend Deployment

1. Install dependencies:
```bash
cd frontend
npm ci
```

2. Build the application:
```bash
npm run build
```

3. Start the server:
```bash
npm start
```

## Cloud Deployment Options

### Vercel (Frontend)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Railway/Render (Backend)

1. Connect your GitHub repository
2. Set environment variables
3. Configure build and start commands:
   - Build: `cd backend && npm ci && npm run build && npx prisma generate`
   - Start: `cd backend && npm start`

### AWS/DigitalOcean (Full Stack)

1. Set up EC2/Droplet instance
2. Install Docker and Docker Compose
3. Clone repository and configure environment
4. Run with Docker Compose
5. Set up reverse proxy with Nginx
6. Configure SSL with Let's Encrypt

## SSL Configuration

### Nginx Configuration

Create `nginx.conf`:
```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }

    upstream frontend {
        server frontend:3000;
    }

    server {
        listen 80;
        server_name yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /webhooks/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## Monitoring and Logging

### Health Checks

The backend includes a health check endpoint:
```
GET /health
```

### Logging

- Backend logs are written to stdout/stderr
- Use log aggregation services like LogDNA, Papertrail, or ELK stack
- Monitor error rates and response times

### Monitoring

Set up monitoring for:
- Application uptime
- Database connections
- Redis connections
- API response times
- Error rates

## Security Checklist

- [ ] Use strong JWT secrets (minimum 32 characters)
- [ ] Enable HTTPS in production
- [ ] Set secure CORS origins
- [ ] Use production database credentials
- [ ] Enable rate limiting
- [ ] Set up proper firewall rules
- [ ] Keep dependencies updated
- [ ] Use environment variables for secrets
- [ ] Enable database connection pooling
- [ ] Set up backup strategies

## Backup Strategy

### Database Backups

Set up automated PostgreSQL backups:
```bash
# Daily backup script
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Upload to cloud storage
aws s3 cp backup_$(date +%Y%m%d).sql s3://your-backup-bucket/
```

### Redis Backups

Redis automatically creates RDB snapshots. Configure backup retention in redis.conf.

## Scaling Considerations

- Use connection pooling for database
- Implement Redis clustering for high availability
- Use load balancers for multiple backend instances
- Consider CDN for static assets
- Monitor and scale based on metrics
