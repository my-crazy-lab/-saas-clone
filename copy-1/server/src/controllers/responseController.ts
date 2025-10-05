import { Request, Response } from 'express'
import { AuthenticatedRequest, ApiResponse, PaginatedResponse } from '../types'
import { SubmitResponseInput, PaginationInput } from '../utils/validation'
import { AppError, asyncHandler } from '../middleware/errorHandler'
import prisma from '../utils/database'

export const submitResponse = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { surveyId } = req.params
  const { answers, metadata }: SubmitResponseInput = req.body
  const userId = (req as AuthenticatedRequest).user?.id

  // Get survey with questions
  const survey = await prisma.survey.findFirst({
    where: {
      id: surveyId,
      isActive: true,
      OR: [
        { isPublic: true },
        { userId: userId || '' },
      ],
    },
    include: {
      questions: true,
    },
  })

  if (!survey) {
    throw new AppError('Survey not found or not accessible', 404)
  }

  // Check if survey has expired
  if (survey.expiresAt && survey.expiresAt < new Date()) {
    throw new AppError('Survey has expired', 400)
  }

  // Check if multiple submissions are allowed
  if (!(survey.settings as any)?.allowMultipleSubmissions && userId) {
    const existingResponse = await prisma.response.findFirst({
      where: {
        surveyId,
        userId,
      },
    })

    if (existingResponse) {
      throw new AppError('You have already submitted a response to this survey', 400)
    }
  }

  // Validate required questions
  const requiredQuestions = survey.questions.filter(q => q.isRequired)
  const answeredQuestionIds = answers.map(a => a.questionId)
  
  for (const requiredQuestion of requiredQuestions) {
    if (!answeredQuestionIds.includes(requiredQuestion.id)) {
      throw new AppError(`Question "${requiredQuestion.questionText}" is required`, 400)
    }
  }

  // Create response
  const response = await prisma.response.create({
    data: {
      surveyId,
      userId,
      isComplete: true,
      metadata: {
        ...metadata,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      },
      answers: {
        create: answers.map(answer => ({
          questionId: answer.questionId,
          answerText: answer.answerText,
          answerJson: answer.answerJson,
          score: answer.score,
        })),
      },
    },
    include: {
      answers: {
        include: {
          question: true,
        },
      },
    },
  })

  res.status(201).json({
    success: true,
    data: response,
    message: 'Response submitted successfully',
  } as ApiResponse)
})

export const getResponses = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { surveyId } = req.params
  const { page, limit, sortBy, sortOrder }: PaginationInput = req.query as any
  const userId = req.user!.id

  // Check if survey belongs to user
  const survey = await prisma.survey.findFirst({
    where: {
      id: surveyId,
      userId,
    },
  })

  if (!survey) {
    throw new AppError('Survey not found', 404)
  }

  const skip = (page - 1) * limit
  const orderBy = sortBy ? { [sortBy]: sortOrder } : { submittedAt: 'desc' }

  const [responses, total] = await Promise.all([
    prisma.response.findMany({
      where: { surveyId },
      skip,
      take: limit,
      orderBy: orderBy as any,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        answers: {
          include: {
            question: {
              select: {
                id: true,
                questionText: true,
                type: true,
              },
            },
          },
        },
      },
    }),
    prisma.response.count({
      where: { surveyId },
    }),
  ])

  const totalPages = Math.ceil(total / limit)

  res.json({
    success: true,
    data: responses,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  } as PaginatedResponse<typeof responses[0]>)
})

export const getResponse = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { surveyId, id } = req.params
  const userId = req.user!.id

  // Check if survey belongs to user
  const survey = await prisma.survey.findFirst({
    where: {
      id: surveyId,
      userId,
    },
  })

  if (!survey) {
    throw new AppError('Survey not found', 404)
  }

  const response = await prisma.response.findFirst({
    where: {
      id,
      surveyId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      answers: {
        include: {
          question: {
            select: {
              id: true,
              questionText: true,
              type: true,
              options: true,
            },
          },
        },
        orderBy: {
          question: {
            order: 'asc',
          },
        },
      },
    },
  })

  if (!response) {
    throw new AppError('Response not found', 404)
  }

  res.json({
    success: true,
    data: response,
  } as ApiResponse)
})

export const deleteResponse = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { surveyId, id } = req.params
  const userId = req.user!.id

  // Check if survey belongs to user
  const survey = await prisma.survey.findFirst({
    where: {
      id: surveyId,
      userId,
    },
  })

  if (!survey) {
    throw new AppError('Survey not found', 404)
  }

  const response = await prisma.response.findFirst({
    where: {
      id,
      surveyId,
    },
  })

  if (!response) {
    throw new AppError('Response not found', 404)
  }

  await prisma.response.delete({
    where: { id },
  })

  res.json({
    success: true,
    message: 'Response deleted successfully',
  } as ApiResponse)
})

export const exportResponses = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { surveyId } = req.params
  const userId = req.user!.id

  // Check if survey belongs to user
  const survey = await prisma.survey.findFirst({
    where: {
      id: surveyId,
      userId,
    },
    include: {
      questions: {
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!survey) {
    throw new AppError('Survey not found', 404)
  }

  const responses = await prisma.response.findMany({
    where: { surveyId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      answers: {
        include: {
          question: true,
        },
      },
    },
    orderBy: { submittedAt: 'desc' },
  })

  // Convert to CSV format
  const headers = [
    'Response ID',
    'Submitted At',
    'User Name',
    'User Email',
    ...survey.questions.map(q => q.questionText),
  ]

  const csvData = responses.map(response => {
    const row = [
      response.id,
      response.submittedAt.toISOString(),
      response.user?.name || 'Anonymous',
      response.user?.email || 'Anonymous',
    ]

    // Add answers in question order
    survey.questions.forEach(question => {
      const answer = response.answers.find(a => a.questionId === question.id)
      if (answer) {
        if (answer.answerText) {
          row.push(answer.answerText)
        } else if (answer.answerJson) {
          row.push(JSON.stringify(answer.answerJson))
        } else if (answer.score !== null) {
          row.push(answer.score.toString())
        } else {
          row.push('')
        }
      } else {
        row.push('')
      }
    })

    return row
  })

  const csv = [headers, ...csvData]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="${survey.title}-responses.csv"`)
  res.send(csv)
})
