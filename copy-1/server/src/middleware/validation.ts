import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { ApiResponse } from '../types'

export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        } as ApiResponse)
        return
      }
      
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
      } as ApiResponse)
    }
  }
}

export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Convert string values to appropriate types for validation
      const query = { ...req.query }
      
      // Convert numeric strings
      Object.keys(query).forEach(key => {
        const value = query[key]
        if (typeof value === 'string' && !isNaN(Number(value))) {
          (query as any)[key] = Number(value)
        }
      })

      req.query = schema.parse(query)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        } as ApiResponse)
        return
      }
      
      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
      } as ApiResponse)
    }
  }
}

export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid URL parameters',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        } as ApiResponse)
        return
      }
      
      res.status(400).json({
        success: false,
        error: 'Invalid URL parameters',
      } as ApiResponse)
    }
  }
}
