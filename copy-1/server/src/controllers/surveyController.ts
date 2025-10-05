import { Response } from 'express'
import { AuthenticatedRequest, ApiResponse, PaginatedResponse } from '../types'
import { CreateSurveyInput, UpdateSurveyInput, PaginationInput } from '../utils/validation'
import { AppError, asyncHandler } from '../middleware/errorHandler'
import prisma from '../utils/database'

export const createSurvey = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const surveyData: CreateSurveyInput = req.body
  const userId = req.user!.id

  const survey = await prisma.survey.create({
    data: {
      ...surveyData,
      userId,
      expiresAt: surveyData.expiresAt ? new Date(surveyData.expiresAt) : null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          questions: true,
          responses: true,
        },
      },
    },
  })

  res.status(201).json({
    success: true,
    data: survey,
    message: 'Survey created successfully',
  } as ApiResponse)
})

export const getSurveys = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { page, limit, sortBy, sortOrder }: PaginationInput = req.query as any
  const userId = req.user!.id

  const skip = (page - 1) * limit
  const orderBy = sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' }

  const [surveys, total] = await Promise.all([
    prisma.survey.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: orderBy as any,
      include: {
        _count: {
          select: {
            questions: true,
            responses: true,
          },
        },
      },
    }),
    prisma.survey.count({
      where: { userId },
    }),
  ])

  const totalPages = Math.ceil(total / limit)

  res.json({
    success: true,
    data: surveys,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  } as PaginatedResponse<typeof surveys[0]>)
})

export const getSurvey = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params
  const userId = req.user!.id

  const survey = await prisma.survey.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      questions: {
        orderBy: { order: 'asc' },
      },
      _count: {
        select: {
          responses: true,
        },
      },
    },
  })

  if (!survey) {
    throw new AppError('Survey not found', 404)
  }

  res.json({
    success: true,
    data: survey,
  } as ApiResponse)
})

export const updateSurvey = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params
  const updateData: UpdateSurveyInput = req.body
  const userId = req.user!.id

  // Check if survey exists and belongs to user
  const existingSurvey = await prisma.survey.findFirst({
    where: {
      id,
      userId,
    },
  })

  if (!existingSurvey) {
    throw new AppError('Survey not found', 404)
  }

  const survey = await prisma.survey.update({
    where: { id },
    data: {
      ...updateData,
      expiresAt: updateData.expiresAt ? new Date(updateData.expiresAt) : undefined,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          questions: true,
          responses: true,
        },
      },
    },
  })

  res.json({
    success: true,
    data: survey,
    message: 'Survey updated successfully',
  } as ApiResponse)
})

export const deleteSurvey = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params
  const userId = req.user!.id

  // Check if survey exists and belongs to user
  const existingSurvey = await prisma.survey.findFirst({
    where: {
      id,
      userId,
    },
  })

  if (!existingSurvey) {
    throw new AppError('Survey not found', 404)
  }

  await prisma.survey.delete({
    where: { id },
  })

  res.json({
    success: true,
    message: 'Survey deleted successfully',
  } as ApiResponse)
})

export const duplicateSurvey = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params
  const userId = req.user!.id

  // Get original survey with questions
  const originalSurvey = await prisma.survey.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      questions: {
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!originalSurvey) {
    throw new AppError('Survey not found', 404)
  }

  // Create duplicate survey
  const duplicatedSurvey = await prisma.survey.create({
    data: {
      title: `${originalSurvey.title} (Copy)`,
      description: originalSurvey.description,
      isPublic: originalSurvey.isPublic,
      isActive: false, // Start as inactive
      theme: originalSurvey.theme as any,
      settings: originalSurvey.settings as any,
      userId,
      questions: {
        create: originalSurvey.questions.map(question => ({
          questionText: question.questionText,
          type: question.type,
          options: question.options as any,
          isRequired: question.isRequired,
          order: question.order,
          conditionalLogic: question.conditionalLogic as any,
        })),
      },
    },
    include: {
      questions: {
        orderBy: { order: 'asc' },
      },
      _count: {
        select: {
          questions: true,
          responses: true,
        },
      },
    },
  })

  res.status(201).json({
    success: true,
    data: duplicatedSurvey,
    message: 'Survey duplicated successfully',
  } as ApiResponse)
})
