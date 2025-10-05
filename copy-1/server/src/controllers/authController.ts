import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { generateToken } from '../utils/jwt'
import { AuthenticatedRequest, ApiResponse } from '../types'
import { RegisterInput, LoginInput } from '../utils/validation'
import { AppError, asyncHandler } from '../middleware/errorHandler'
import prisma from '../utils/database'

export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, email, password }: RegisterInput = req.body

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    throw new AppError('User already exists with this email', 400)
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12)

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  })

  // Generate token
  const token = generateToken(user as any)

  res.status(201).json({
    success: true,
    data: {
      user,
      token,
    },
    message: 'User registered successfully',
  } as ApiResponse)
})

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password }: LoginInput = req.body

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    throw new AppError('Invalid email or password', 401)
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password)

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401)
  }

  // Generate token
  const token = generateToken(user)

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user

  res.json({
    success: true,
    data: {
      user: userWithoutPassword,
      token,
    },
    message: 'Login successful',
  } as ApiResponse)
})

export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          surveys: true,
          responses: true,
        },
      },
    },
  })

  if (!user) {
    throw new AppError('User not found', 404)
  }

  res.json({
    success: true,
    data: user,
  } as ApiResponse)
})

export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { name } = req.body
  const userId = req.user!.id

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { name },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  res.json({
    success: true,
    data: updatedUser,
    message: 'Profile updated successfully',
  } as ApiResponse)
})

export const changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body
  const userId = req.user!.id

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new AppError('User not found', 404)
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)

  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', 400)
  }

  // Hash new password
  const hashedNewPassword = await bcrypt.hash(newPassword, 12)

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword },
  })

  res.json({
    success: true,
    message: 'Password changed successfully',
  } as ApiResponse)
})

export const refreshToken = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!

  // Generate new token
  const token = generateToken(user)

  res.json({
    success: true,
    data: { token },
    message: 'Token refreshed successfully',
  } as ApiResponse)
})
