import { Request, Response, NextFunction } from 'express'
import { ApiResponse } from '../types'

export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number = 500) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500
  let message = 'Internal server error'

  if (error instanceof AppError) {
    statusCode = error.statusCode
    message = error.message
  } else if (error.name === 'ValidationError') {
    statusCode = 400
    message = 'Validation error'
  } else if (error.name === 'CastError') {
    statusCode = 400
    message = 'Invalid ID format'
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid token'
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired'
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error)
  }

  const response: ApiResponse = {
    success: false,
    error: message,
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    (response as any).stack = error.stack
  }

  res.status(statusCode).json(response)
}

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
  } as ApiResponse)
}

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
