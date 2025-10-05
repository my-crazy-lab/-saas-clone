# Deployment Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Environment Setup

### Backend (.env)
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/survey_builder?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV="production"

# CORS
CORS_ORIGIN="https://your-frontend-domain.com"

# Email (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="noreply@surveybuilder.com"
FROM_NAME="Survey Builder"

# Security
BCRYPT_ROUNDS=12
```

### Frontend (.env)
```bash
VITE_API_BASE_URL=https://your-api-domain.com/api
VITE_APP_NAME="Survey Builder"
VITE_APP_VERSION="1.0.0"
```

## Local Development

1. **Install dependencies:**
```bash
npm run install:all
```

2. **Set up database:**
```bash
cd server
npx prisma migrate dev
npx prisma db seed
```

3. **Start development servers:**
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Production Deployment

### Option 1: Docker Deployment

1. **Create docker-compose.yml:**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: survey_builder
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./server
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/survey_builder
      JWT_SECRET: your-production-secret
      NODE_ENV: production
      PORT: 3001
    ports:
      - "3001:3001"
    depends_on:
      - postgres

  frontend:
    build: ./client
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

2. **Build and run:**
```bash
docker-compose up -d
```

### Option 2: Manual Deployment

#### Backend Deployment

1. **Build the application:**
```bash
cd server
npm install --production
npm run build
```

2. **Set up database:**
```bash
npx prisma migrate deploy
npx prisma db seed
```

3. **Start the server:**
```bash
npm start
```

#### Frontend Deployment

1. **Build the application:**
```bash
cd client
npm install
npm run build
```

2. **Deploy to static hosting:**
   - Upload `dist/` folder to your hosting provider
   - Configure your web server to serve the SPA

### Option 3: Platform Deployments

#### Vercel (Frontend)

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy:**
```bash
cd client
vercel --prod
```

#### Heroku (Backend)

1. **Create Heroku app:**
```bash
heroku create your-app-name
```

2. **Add PostgreSQL addon:**
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

3. **Set environment variables:**
```bash
heroku config:set JWT_SECRET=your-secret
heroku config:set NODE_ENV=production
```

4. **Deploy:**
```bash
git push heroku main
```

5. **Run migrations:**
```bash
heroku run npx prisma migrate deploy
heroku run npx prisma db seed
```

#### Railway

1. **Connect your GitHub repository**
2. **Set environment variables in Railway dashboard**
3. **Deploy automatically on push**

#### DigitalOcean App Platform

1. **Create new app from GitHub repository**
2. **Configure build and run commands**
3. **Set environment variables**
4. **Deploy**

## Database Setup

### PostgreSQL Setup

1. **Install PostgreSQL:**
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql
```

2. **Create database:**
```sql
CREATE DATABASE survey_builder;
CREATE USER survey_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE survey_builder TO survey_user;
```

3. **Update connection string:**
```bash
DATABASE_URL="postgresql://survey_user:your_password@localhost:5432/survey_builder"
```

### Database Migrations

```bash
# Generate migration
npx prisma migrate dev --name init

# Deploy to production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

## SSL/HTTPS Setup

### Using Let's Encrypt with Nginx

1. **Install Certbot:**
```bash
sudo apt-get install certbot python3-certbot-nginx
```

2. **Obtain certificate:**
```bash
sudo certbot --nginx -d your-domain.com
```

3. **Configure Nginx:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring and Logging

### PM2 (Process Manager)

1. **Install PM2:**
```bash
npm install -g pm2
```

2. **Create ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'survey-builder-api',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}
```

3. **Start application:**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Health Checks

The API includes a health check endpoint:
```
GET /health
```

Response:
```json
{
  "success": true,
  "message": "Survey Builder API is running",
  "timestamp": "2023-01-01T00:00:00.000Z",
  "environment": "production"
}
```

## Backup and Recovery

### Database Backup

```bash
# Create backup
pg_dump survey_builder > backup.sql

# Restore backup
psql survey_builder < backup.sql
```

### Automated Backups

Create a cron job for regular backups:
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * pg_dump survey_builder > /backups/survey_builder_$(date +\%Y\%m\%d).sql
```

## Security Considerations

1. **Use strong JWT secrets**
2. **Enable HTTPS in production**
3. **Set up proper CORS origins**
4. **Use environment variables for secrets**
5. **Enable rate limiting**
6. **Keep dependencies updated**
7. **Use a reverse proxy (Nginx/Apache)**
8. **Set up firewall rules**
9. **Regular security audits**

## Performance Optimization

1. **Enable gzip compression**
2. **Use CDN for static assets**
3. **Implement caching strategies**
4. **Optimize database queries**
5. **Use connection pooling**
6. **Monitor application performance**

## Troubleshooting

### Common Issues

1. **Database connection errors:**
   - Check DATABASE_URL format
   - Verify database is running
   - Check network connectivity

2. **CORS errors:**
   - Verify CORS_ORIGIN setting
   - Check frontend URL configuration

3. **JWT token issues:**
   - Verify JWT_SECRET is set
   - Check token expiration

4. **Build failures:**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify environment variables
