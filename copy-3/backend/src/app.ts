import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import config from './config/env';

// Routes
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import accountRoutes from './routes/accounts';
import webhookRoutes from './routes/webhooks';

// Middleware
import { apiLimiter, authLimiter, webhookLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use('/webhooks', express.raw({ type: 'application/json' })); // Raw body for webhooks
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// API routes with rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/dashboard', apiLimiter, dashboardRoutes);
app.use('/api/accounts', apiLimiter, accountRoutes);
app.use('/webhooks', webhookLimiter, webhookRoutes);

// API documentation endpoint
app.get('/docs', (_req, res) => {
  res.json({
    success: true,
    message: 'SaaS Analytics Dashboard API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register a new user',
        'POST /api/auth/login': 'Login user',
        'GET /api/auth/profile': 'Get user profile (requires auth)'
      },
      dashboard: {
        'GET /api/dashboard': 'Get dashboard data (requires auth)',
        'GET /api/dashboard/metrics': 'Get metrics data (requires auth)'
      },
      accounts: {
        'GET /api/accounts': 'Get connected accounts (requires auth)',
        'POST /api/accounts/connect': 'Connect payment account (requires auth)',
        'DELETE /api/accounts/:id': 'Disconnect account (requires auth)',
        'POST /api/accounts/:id/sync': 'Sync account data (requires auth)',
        'GET /api/accounts/:id/subscriptions': 'Get account subscriptions (requires auth)'
      },
      webhooks: {
        'POST /webhooks/stripe': 'Stripe webhook endpoint',
        'POST /webhooks/paypal': 'PayPal webhook endpoint'
      }
    }
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
