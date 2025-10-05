import { Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'
import { AuthenticatedRequest, ApiResponse } from '../types'
import prisma from '../utils/database'

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Access token required',
      } as ApiResponse)
      return
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    const payload = verifyToken(token)

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found',
      } as ApiResponse)
      return
    }

    req.user = user as any
    next()
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    } as ApiResponse)
  }
}

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    } as ApiResponse)
    return
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      error: 'Admin access required',
    } as ApiResponse)
    return
  }

  next()
}

export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next()
      return
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (user) {
      req.user = user as any
    }

    next()
  } catch (error) {
    // Ignore auth errors for optional auth
    next()
  }
}
