import { z } from 'zod'
import { QuestionType } from '@prisma/client'

// User validation schemas
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Survey validation schemas
export const surveyThemeSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  textColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  fontFamily: z.string().min(1, 'Font family is required'),
  logoUrl: z.string().url().optional(),
})

export const surveySettingsSchema = z.object({
  allowAnonymous: z.boolean().default(true),
  showProgressBar: z.boolean().default(true),
  randomizeQuestions: z.boolean().default(false),
  allowMultipleSubmissions: z.boolean().default(false),
  requireLogin: z.boolean().default(false),
})

export const createSurveySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  isPublic: z.boolean().default(true),
  theme: surveyThemeSchema.optional(),
  settings: surveySettingsSchema.optional(),
  expiresAt: z.string().datetime().optional(),
})

export const updateSurveySchema = createSurveySchema.partial().extend({
  isActive: z.boolean().optional(),
})

// Question validation schemas
export const questionOptionsSchema = z.object({
  choices: z.array(z.string()).optional(),
  scale: z.number().min(2).max(10).optional(),
  labels: z.array(z.string()).optional(),
  maxRating: z.number().min(1).max(10).optional(),
  icon: z.string().optional(),
  placeholder: z.string().optional(),
  maxLength: z.number().min(1).optional(),
  minLength: z.number().min(0).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
})

export const conditionalLogicSchema = z.object({
  condition: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than']),
  value: z.any(),
  action: z.enum(['show', 'hide', 'skip_to']),
  targetQuestionId: z.string().optional(),
})

export const createQuestionSchema = z.object({
  questionText: z.string().min(1, 'Question text is required').max(500, 'Question text too long'),
  type: z.nativeEnum(QuestionType),
  options: questionOptionsSchema.optional(),
  isRequired: z.boolean().default(false),
  order: z.number().min(1),
  conditionalLogic: conditionalLogicSchema.optional(),
})

export const updateQuestionSchema = createQuestionSchema.partial()

// Response validation schemas
export const answerSchema = z.object({
  questionId: z.string().cuid(),
  answerText: z.string().optional(),
  answerJson: z.any().optional(),
  score: z.number().optional(),
})

export const responseMetadataSchema = z.object({
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  device: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
})

export const submitResponseSchema = z.object({
  answers: z.array(answerSchema).min(1, 'At least one answer is required'),
  metadata: responseMetadataSchema.optional(),
})

// Pagination validation schema
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Email validation schema
export const emailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1, 'Subject is required'),
  html: z.string().optional(),
  text: z.string().optional(),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateSurveyInput = z.infer<typeof createSurveySchema>
export type UpdateSurveyInput = z.infer<typeof updateSurveySchema>
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>
export type SubmitResponseInput = z.infer<typeof submitResponseSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
