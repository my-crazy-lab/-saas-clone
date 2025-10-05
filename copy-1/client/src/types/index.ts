// User types
export interface User {
  id: string
  name: string
  email: string
  role: 'USER' | 'ADMIN'
  createdAt: string
  updatedAt: string
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

export interface Survey {
  id: string
  title: string
  description?: string
  isPublic: boolean
  isActive: boolean
  theme?: SurveyTheme
  settings?: SurveySettings
  expiresAt?: string
  createdAt: string
  updatedAt: string
  userId: string
  user?: {
    id: string
    name: string
    email: string
  }
  questions?: Question[]
  _count?: {
    questions: number
    responses: number
  }
}

// Question types
export type QuestionType = 
  | 'MULTIPLE_CHOICE_SINGLE'
  | 'MULTIPLE_CHOICE_MULTIPLE'
  | 'LIKERT_SCALE'
  | 'SHORT_TEXT'
  | 'LONG_TEXT'
  | 'RATING'
  | 'NUMBER'
  | 'DATE'
  | 'TIME'
  | 'EMAIL'
  | 'URL'

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

export interface Question {
  id: string
  surveyId: string
  questionText: string
  type: QuestionType
  options?: QuestionOptions
  isRequired: boolean
  order: number
  conditionalLogic?: ConditionalLogic
  createdAt: string
  updatedAt: string
}

// Response types
export interface Answer {
  id: string
  responseId: string
  questionId: string
  answerText?: string
  answerJson?: any
  score?: number
  createdAt: string
  updatedAt: string
  question?: Question
}

export interface Response {
  id: string
  surveyId: string
  userId?: string
  isComplete: boolean
  metadata?: any
  submittedAt: string
  updatedAt: string
  user?: {
    id: string
    name: string
    email: string
  }
  answers: Answer[]
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
  data: any
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  details?: Array<{
    field: string
    message: string
  }>
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Form types
export interface CreateSurveyForm {
  title: string
  description?: string
  isPublic?: boolean
  theme?: SurveyTheme
  settings?: SurveySettings
  expiresAt?: string
}

export interface CreateQuestionForm {
  questionText: string
  type: QuestionType
  options?: QuestionOptions
  isRequired?: boolean
  order: number
  conditionalLogic?: ConditionalLogic
}

export interface SubmitResponseForm {
  answers: Array<{
    questionId: string
    answerText?: string
    answerJson?: any
    score?: number
  }>
  metadata?: {
    userAgent?: string
    device?: string
    startTime?: string
    endTime?: string
  }
}

// UI State types
export interface LoadingState {
  isLoading: boolean
  error?: string
}

export interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// Drag and Drop types
export interface DragItem {
  id: string
  type: string
  index: number
}

// Theme types
export interface ThemeConfig {
  colors: {
    primary: string
    secondary: string
    success: string
    warning: string
    error: string
    background: string
    surface: string
    text: string
  }
  fonts: {
    primary: string
    secondary: string
  }
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
  }
}

// Chart types
export interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
  }>
}

// Word cloud types
export interface WordCloudData {
  text: string
  value: number
}
