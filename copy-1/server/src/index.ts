import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { errorHandler, notFound } from './middleware/errorHandler'

// Import routes
import authRoutes from './routes/auth'
import surveyRoutes from './routes/surveys'
import questionRoutes from './routes/questions'
import responseRoutes from './routes/responses'
import publicRoutes from './routes/public'
import analyticsRoutes from './routes/analytics'

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
})

app.use('/api/', limiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1)

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Survey Builder API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/surveys', surveyRoutes)
app.use('/api/surveys', questionRoutes) // Questions are nested under surveys
app.use('/api/surveys', responseRoutes) // Responses are nested under surveys
app.use('/api/analytics', analyticsRoutes)
app.use('/api/public', publicRoutes)

// API documentation endpoint
app.get('/api/docs', (_req, res) => {
  res.json({
    success: true,
    data: {
      title: 'Survey Builder API',
      version: '1.0.0',
      description: 'REST API for Survey Builder application',
      endpoints: {
        auth: {
          'POST /api/auth/register': 'Register a new user',
          'POST /api/auth/login': 'Login user',
          'GET /api/auth/profile': 'Get user profile',
          'PUT /api/auth/profile': 'Update user profile',
          'POST /api/auth/change-password': 'Change password',
          'POST /api/auth/refresh': 'Refresh JWT token',
        },
        surveys: {
          'POST /api/surveys': 'Create a new survey',
          'GET /api/surveys': 'Get user surveys (paginated)',
          'GET /api/surveys/:id': 'Get survey by ID',
          'PUT /api/surveys/:id': 'Update survey',
          'DELETE /api/surveys/:id': 'Delete survey',
          'POST /api/surveys/:id/duplicate': 'Duplicate survey',
        },
        questions: {
          'POST /api/surveys/:surveyId/questions': 'Create question',
          'GET /api/surveys/:surveyId/questions': 'Get survey questions',
          'GET /api/surveys/:surveyId/questions/:id': 'Get question by ID',
          'PUT /api/surveys/:surveyId/questions/:id': 'Update question',
          'DELETE /api/surveys/:surveyId/questions/:id': 'Delete question',
          'POST /api/surveys/:surveyId/questions/reorder': 'Reorder questions',
        },
        responses: {
          'POST /api/surveys/:surveyId/submit': 'Submit survey response (public)',
          'GET /api/surveys/:surveyId/responses': 'Get survey responses',
          'GET /api/surveys/:surveyId/responses/export': 'Export responses as CSV',
          'GET /api/surveys/:surveyId/responses/:id': 'Get response by ID',
          'DELETE /api/surveys/:surveyId/responses/:id': 'Delete response',
        },
        analytics: {
          'GET /api/analytics/:surveyId': 'Get survey analytics',
          'GET /api/analytics/:surveyId/questions/:questionId': 'Get question analytics',
        },
        public: {
          'GET /api/public/survey/:id': 'Get public survey',
          'GET /api/public/survey/:id/qr': 'Generate QR code',
          'GET /api/public/survey/:id/embed': 'Generate embed code',
          'GET /api/public/survey/:id/stats': 'Get public survey stats',
        },
      },
    },
  })
})

// 404 handler
app.use(notFound)

// Error handling middleware (must be last)
app.use(errorHandler)

// Export app for testing
export default app

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
    console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`)
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`)
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  })
}
