import { Response } from 'express'
import { AuthenticatedRequest, ApiResponse } from '../types'
import { CreateQuestionInput, UpdateQuestionInput } from '../utils/validation'
import { AppError, asyncHandler } from '../middleware/errorHandler'
import prisma from '../utils/database'

export const createQuestion = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { surveyId } = req.params
  const questionData: CreateQuestionInput = req.body
  const userId = req.user!.id

  // Check if survey exists and belongs to user
  const survey = await prisma.survey.findFirst({
    where: {
      id: surveyId,
      userId,
    },
  })

  if (!survey) {
    throw new AppError('Survey not found', 404)
  }

  // Check if order is already taken
  const existingQuestion = await prisma.question.findFirst({
    where: {
      surveyId,
      order: questionData.order,
    },
  })

  if (existingQuestion) {
    // Shift other questions down
    await prisma.question.updateMany({
      where: {
        surveyId,
        order: {
          gte: questionData.order,
        },
      },
      data: {
        order: {
          increment: 1,
        },
      },
    })
  }

  const question = await prisma.question.create({
    data: {
      ...questionData,
      surveyId,
    },
  })

  res.status(201).json({
    success: true,
    data: question,
    message: 'Question created successfully',
  } as ApiResponse)
})

export const getQuestions = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { surveyId } = req.params
  const userId = req.user!.id

  // Check if survey exists and belongs to user
  const survey = await prisma.survey.findFirst({
    where: {
      id: surveyId,
      userId,
    },
  })

  if (!survey) {
    throw new AppError('Survey not found', 404)
  }

  const questions = await prisma.question.findMany({
    where: { surveyId },
    orderBy: { order: 'asc' },
  })

  res.json({
    success: true,
    data: questions,
  } as ApiResponse)
})

export const getQuestion = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { surveyId, id } = req.params
  const userId = req.user!.id

  // Check if survey exists and belongs to user
  const survey = await prisma.survey.findFirst({
    where: {
      id: surveyId,
      userId,
    },
  })

  if (!survey) {
    throw new AppError('Survey not found', 404)
  }

  const question = await prisma.question.findFirst({
    where: {
      id,
      surveyId,
    },
  })

  if (!question) {
    throw new AppError('Question not found', 404)
  }

  res.json({
    success: true,
    data: question,
  } as ApiResponse)
})

export const updateQuestion = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { surveyId, id } = req.params
  const updateData: UpdateQuestionInput = req.body
  const userId = req.user!.id

  // Check if survey exists and belongs to user
  const survey = await prisma.survey.findFirst({
    where: {
      id: surveyId,
      userId,
    },
  })

  if (!survey) {
    throw new AppError('Survey not found', 404)
  }

  // Check if question exists
  const existingQuestion = await prisma.question.findFirst({
    where: {
      id,
      surveyId,
    },
  })

  if (!existingQuestion) {
    throw new AppError('Question not found', 404)
  }

  // Handle order change
  if (updateData.order && updateData.order !== existingQuestion.order) {
    const oldOrder = existingQuestion.order
    const newOrder = updateData.order

    if (newOrder > oldOrder) {
      // Moving down - shift questions up
      await prisma.question.updateMany({
        where: {
          surveyId,
          order: {
            gt: oldOrder,
            lte: newOrder,
          },
        },
        data: {
          order: {
            decrement: 1,
          },
        },
      })
    } else {
      // Moving up - shift questions down
      await prisma.question.updateMany({
        where: {
          surveyId,
          order: {
            gte: newOrder,
            lt: oldOrder,
          },
        },
        data: {
          order: {
            increment: 1,
          },
        },
      })
    }
  }

  const question = await prisma.question.update({
    where: { id },
    data: updateData,
  })

  res.json({
    success: true,
    data: question,
    message: 'Question updated successfully',
  } as ApiResponse)
})

export const deleteQuestion = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { surveyId, id } = req.params
  const userId = req.user!.id

  // Check if survey exists and belongs to user
  const survey = await prisma.survey.findFirst({
    where: {
      id: surveyId,
      userId,
    },
  })

  if (!survey) {
    throw new AppError('Survey not found', 404)
  }

  // Check if question exists
  const existingQuestion = await prisma.question.findFirst({
    where: {
      id,
      surveyId,
    },
  })

  if (!existingQuestion) {
    throw new AppError('Question not found', 404)
  }

  // Delete question
  await prisma.question.delete({
    where: { id },
  })

  // Shift remaining questions up
  await prisma.question.updateMany({
    where: {
      surveyId,
      order: {
        gt: existingQuestion.order,
      },
    },
    data: {
      order: {
        decrement: 1,
      },
    },
  })

  res.json({
    success: true,
    message: 'Question deleted successfully',
  } as ApiResponse)
})

export const reorderQuestions = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { surveyId } = req.params
  const { questionIds }: { questionIds: string[] } = req.body
  const userId = req.user!.id

  // Check if survey exists and belongs to user
  const survey = await prisma.survey.findFirst({
    where: {
      id: surveyId,
      userId,
    },
  })

  if (!survey) {
    throw new AppError('Survey not found', 404)
  }

  // Update question orders
  const updatePromises = questionIds.map((questionId, index) =>
    prisma.question.update({
      where: { id: questionId },
      data: { order: index + 1 },
    })
  )

  await Promise.all(updatePromises)

  const questions = await prisma.question.findMany({
    where: { surveyId },
    orderBy: { order: 'asc' },
  })

  res.json({
    success: true,
    data: questions,
    message: 'Questions reordered successfully',
  } as ApiResponse)
})
