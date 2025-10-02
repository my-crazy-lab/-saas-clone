# Deployment Guide

## 🚀 Production Deployment

### Prerequisites

- Docker and Docker Compose
- Domain name with SSL certificate
- PostgreSQL database (managed service recommended)
- Redis instance (managed service recommended)
- Email service (SendGrid account)
- SMS service (Twilio account - optional)
- OAuth applications (Google, Microsoft)

### 1. Environment Setup

Create production environment file:

```bash
cp .env.example .env.production
```

Configure production variables:

```env
# Application
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://yourdomain.com

# Database (use managed PostgreSQL service)
DATABASE_URL=postgresql://user:password@host:5432/scheduling_app

# Redis (use managed Redis service)
REDIS_URL=redis://user:password@host:6379

# Security
JWT_SECRET=your-super-secure-random-jwt-secret-256-bits
BCRYPT_ROUNDS=12

# OAuth Applications
GOOGLE_CLIENT_ID=your-production-google-client-id
GOOGLE_CLIENT_SECRET=your-production-google-client-secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/v1/auth/google/callback

MICROSOFT_CLIENT_ID=your-production-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-production-microsoft-client-secret
MICROSOFT_REDIRECT_URI=https://yourdomain.com/api/v1/auth/microsoft/callback

# Email Service
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@yourdomain.com

# SMS Service (optional)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100
```

### 2. OAuth Application Setup

#### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Calendar API and Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://yourdomain.com/api/v1/auth/google/callback`
6. Add authorized JavaScript origins:
   - `https://yourdomain.com`

#### Microsoft OAuth Setup

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to Azure Active Directory > App registrations
3. Create new registration
4. Add redirect URI:
   - `https://yourdomain.com/api/v1/auth/microsoft/callback`
5. Grant Microsoft Graph permissions:
   - `User.Read`
   - `Calendars.ReadWrite`

### 3. Database Setup

#### Using Managed PostgreSQL (Recommended)

**AWS RDS:**
```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier scheduling-app-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.3 \
  --allocated-storage 20 \
  --db-name scheduling_app \
  --master-username postgres \
  --master-user-password your-secure-password
```

**Google Cloud SQL:**
```bash
# Create Cloud SQL PostgreSQL instance
gcloud sql instances create scheduling-app-prod \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1
```

#### Database Migration

```bash
# Run migrations
npm run migration:run

# Seed initial data (if needed)
npm run seed:run
```

### 4. Docker Production Build

Create production Dockerfile:

```dockerfile
# Dockerfile.prod
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 3000
CMD ["node", "dist/main"]
```

Create production docker-compose:

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.prod
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    restart: unless-stopped
    depends_on:
      - redis
    networks:
      - app-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    restart: unless-stopped
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - app-network

volumes:
  redis_data:

networks:
  app-network:
    driver: bridge
```

### 5. Frontend Production Build

Create frontend production Dockerfile:

```dockerfile
# frontend/Dockerfile.prod
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine AS production

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
```

### 6. Nginx Configuration

Create nginx configuration:

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    upstream api {
        server api:3000;
    }

    server {
        listen 80;
        server_name yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        ssl_certificate /etc/ssl/certs/fullchain.pem;
        ssl_certificate_key /etc/ssl/certs/privkey.pem;

        # Frontend
        location / {
            root /usr/share/nginx/html;
            index index.html index.htm;
            try_files $uri $uri/ /index.html;
        }

        # API
        location /api/ {
            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### 7. SSL Certificate Setup

#### Using Let's Encrypt (Certbot)

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 8. Deployment Commands

```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Update deployment
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --force-recreate
```

### 9. Health Checks & Monitoring

#### Health Check Endpoint

The application includes a health check endpoint:
- `GET /api/v1/health` - Returns application health status

#### Monitoring Setup

**Using Docker Health Checks:**

```yaml
# Add to docker-compose.prod.yml
services:
  api:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### 10. Backup Strategy

#### Database Backups

```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql
aws s3 cp backup_$DATE.sql s3://your-backup-bucket/
```

#### Application Data Backups

- User uploaded files (if any)
- Configuration files
- SSL certificates

### 11. Security Checklist

- [ ] Use HTTPS everywhere
- [ ] Strong JWT secrets (256-bit random)
- [ ] Database credentials secured
- [ ] OAuth secrets secured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers enabled (Helmet)
- [ ] Regular security updates
- [ ] Firewall configured
- [ ] Database access restricted

### 12. Performance Optimization

#### Application Level

- Enable gzip compression
- Optimize database queries
- Implement caching strategies
- Use CDN for static assets

#### Infrastructure Level

- Use managed services (RDS, ElastiCache)
- Implement load balancing
- Set up auto-scaling
- Monitor resource usage

### 13. Troubleshooting

#### Common Issues

**Database Connection Issues:**
```bash
# Check database connectivity
docker-compose exec api npm run typeorm:check

# View database logs
docker-compose logs postgres
```

**Redis Connection Issues:**
```bash
# Check Redis connectivity
docker-compose exec redis redis-cli ping

# View Redis logs
docker-compose logs redis
```

**OAuth Issues:**
- Verify redirect URIs match exactly
- Check OAuth application status
- Validate client credentials

### 14. Rollback Strategy

```bash
# Quick rollback to previous version
docker-compose -f docker-compose.prod.yml down
docker tag your-app:previous your-app:latest
docker-compose -f docker-compose.prod.yml up -d
```

### 15. Maintenance

#### Regular Tasks

- Monitor application logs
- Check database performance
- Update dependencies
- Renew SSL certificates
- Review security logs
- Backup verification

#### Scheduled Maintenance

- Weekly: Security updates
- Monthly: Dependency updates
- Quarterly: Performance review
- Annually: Security audit

---

This deployment guide provides comprehensive instructions for deploying the scheduling application to production with proper security, monitoring, and maintenance considerations.
