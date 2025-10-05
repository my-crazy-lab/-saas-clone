import { Request } from 'express'
import { User } from '@prisma/client'

// Extend Express Request type to include user
export interface AuthenticatedRequest extends Request {
  user?: User
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// Survey types
export interface SurveyTheme {
  primaryColor: string
  backgroundColor: string
  textColor: string
  fontFamily: string
  logoUrl?: string
}

export interface SurveySettings {
  allowAnonymous: boolean
  showProgressBar: boolean
  randomizeQuestions: boolean
  allowMultipleSubmissions: boolean
  requireLogin: boolean
}

export interface QuestionOptions {
  choices?: string[]
  scale?: number
  labels?: string[]
  maxRating?: number
  icon?: string
  placeholder?: string
  maxLength?: number
  minLength?: number
  min?: number
  max?: number
  step?: number
}

export interface ConditionalLogic {
  condition: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
  value: any
  action: 'show' | 'hide' | 'skip_to'
  targetQuestionId?: string
}

// Analytics types
export interface SurveyAnalytics {
  totalResponses: number
  completionRate: number
  averageCompletionTime: number
  responsesByDate: Array<{
    date: string
    count: number
  }>
  questionAnalytics: QuestionAnalytics[]
}

export interface QuestionAnalytics {
  questionId: string
  questionText: string
  type: string
  totalAnswers: number
  skipRate: number
  data: any // Specific to question type
}

// Email types
export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export interface EmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  attachments?: Array<{
    filename: string
    content: Buffer
    contentType: string
  }>
}

// File upload types
export interface UploadedFile {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  size: number
  destination: string
  filename: string
  path: string
}

// Validation schemas
export interface CreateSurveyRequest {
  title: string
  description?: string
  isPublic?: boolean
  theme?: SurveyTheme
  settings?: SurveySettings
  expiresAt?: string
}

export interface UpdateSurveyRequest extends Partial<CreateSurveyRequest> {
  isActive?: boolean
}

export interface CreateQuestionRequest {
  questionText: string
  type: string
  options?: QuestionOptions
  isRequired?: boolean
  order: number
  conditionalLogic?: ConditionalLogic
}

export interface UpdateQuestionRequest extends Partial<CreateQuestionRequest> {}

export interface SubmitResponseRequest {
  answers: Array<{
    questionId: string
    answerText?: string
    answerJson?: any
    score?: number
  }>
  metadata?: {
    userAgent?: string
    ipAddress?: string
    device?: string
    startTime?: string
    endTime?: string
  }
}

// Pagination types
export interface PaginationOptions {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}
