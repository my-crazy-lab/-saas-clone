import { Response } from 'express'
import { AuthenticatedRequest, ApiResponse, SurveyAnalytics, QuestionAnalytics } from '../types'
import { AppError, asyncHandler } from '../middleware/errorHandler'
import prisma from '../utils/database'

export const getSurveyAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

  // Get basic stats
  const [totalResponses, completedResponses, responses] = await Promise.all([
    prisma.response.count({
      where: { surveyId },
    }),
    prisma.response.count({
      where: {
        surveyId,
        isComplete: true,
      },
    }),
    prisma.response.findMany({
      where: { surveyId },
      select: {
        id: true,
        submittedAt: true,
        isComplete: true,
        metadata: true,
      },
      orderBy: { submittedAt: 'asc' },
    }),
  ])

  const completionRate = totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0

  // Calculate average completion time (if metadata available)
  const responsesWithTime = responses.filter(r => 
    r.metadata && 
    typeof r.metadata === 'object' && 
    'startTime' in r.metadata && 
    'endTime' in r.metadata
  )

  let averageCompletionTime = 0
  if (responsesWithTime.length > 0) {
    const totalTime = responsesWithTime.reduce((sum, response) => {
      const metadata = response.metadata as any
      const startTime = new Date(metadata.startTime).getTime()
      const endTime = new Date(metadata.endTime).getTime()
      return sum + (endTime - startTime)
    }, 0)
    averageCompletionTime = totalTime / responsesWithTime.length / 1000 // Convert to seconds
  }

  // Group responses by date
  const responsesByDate = responses.reduce((acc, response) => {
    const date = response.submittedAt.toISOString().split('T')[0]!
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const responsesByDateArray = Object.entries(responsesByDate).map(([date, count]) => ({
    date,
    count,
  }))

  // Get question analytics
  const questionAnalytics: QuestionAnalytics[] = []

  for (const question of survey.questions) {
    const answers = await prisma.answer.findMany({
      where: { questionId: question.id },
      include: {
        response: {
          select: {
            isComplete: true,
          },
        },
      },
    })

    const totalAnswers = answers.length
    const totalPossibleAnswers = completedResponses
    const skipRate = totalPossibleAnswers > 0 ? ((totalPossibleAnswers - totalAnswers) / totalPossibleAnswers) * 100 : 0

    let data: any = {}

    switch (question.type) {
      case 'MULTIPLE_CHOICE_SINGLE':
      case 'MULTIPLE_CHOICE_MULTIPLE':
        const choiceCounts: Record<string, number> = {}
        answers.forEach(answer => {
          if (answer.answerJson && typeof answer.answerJson === 'object') {
            const json = answer.answerJson as any
            if (json.value) {
              choiceCounts[json.value] = (choiceCounts[json.value] || 0) + 1
            } else if (json.values && Array.isArray(json.values)) {
              json.values.forEach((value: string) => {
                choiceCounts[value] = (choiceCounts[value] || 0) + 1
              })
            }
          }
        })
        data = { choiceCounts }
        break

      case 'LIKERT_SCALE':
      case 'RATING':
        const ratings = answers
          .map(a => a.score)
          .filter(score => score !== null) as number[]
        
        const average = ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0
        const distribution: Record<number, number> = {}
        
        ratings.forEach(rating => {
          distribution[rating] = (distribution[rating] || 0) + 1
        })

        data = {
          average: Math.round(average * 100) / 100,
          distribution,
          total: ratings.length,
        }
        break

      case 'SHORT_TEXT':
      case 'LONG_TEXT':
        const textAnswers = answers
          .map(a => a.answerText)
          .filter(text => text && text.trim().length > 0)

        // Simple word frequency for word cloud
        const wordFreq: Record<string, number> = {}
        textAnswers.forEach(text => {
          const words = text!.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 2)

          words.forEach(word => {
            wordFreq[word] = (wordFreq[word] || 0) + 1
          })
        })

        // Get top 50 words
        const topWords = Object.entries(wordFreq)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 50)
          .map(([text, value]) => ({ text, value }))

        data = {
          totalAnswers: textAnswers.length,
          averageLength: textAnswers.length > 0 
            ? Math.round(textAnswers.reduce((sum, text) => sum + text!.length, 0) / textAnswers.length)
            : 0,
          wordCloud: topWords,
        }
        break

      case 'NUMBER':
        const numbers = answers
          .map(a => a.score)
          .filter(score => score !== null) as number[]

        if (numbers.length > 0) {
          const sorted = [...numbers].sort((a, b) => a - b)
          const sum = numbers.reduce((a, b) => a + b, 0)
          const average = sum / numbers.length
          const median = sorted.length % 2 === 0
            ? (sorted[sorted.length / 2 - 1]! + sorted[sorted.length / 2]!) / 2
            : sorted[Math.floor(sorted.length / 2)]!

          data = {
            average: Math.round(average * 100) / 100,
            median,
            min: Math.min(...numbers),
            max: Math.max(...numbers),
            total: numbers.length,
          }
        }
        break

      default:
        data = { totalAnswers }
    }

    questionAnalytics.push({
      questionId: question.id,
      questionText: question.questionText,
      type: question.type,
      totalAnswers,
      skipRate: Math.round(skipRate * 100) / 100,
      data,
    })
  }

  const analytics: SurveyAnalytics = {
    totalResponses,
    completionRate: Math.round(completionRate * 100) / 100,
    averageCompletionTime: Math.round(averageCompletionTime),
    responsesByDate: responsesByDateArray,
    questionAnalytics,
  }

  res.json({
    success: true,
    data: analytics,
  } as ApiResponse)
})

export const getQuestionAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { surveyId, questionId } = req.params
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

  // Get question
  const question = await prisma.question.findFirst({
    where: {
      id: questionId,
      surveyId,
    },
  })

  if (!question) {
    throw new AppError('Question not found', 404)
  }

  // Get all answers for this question
  const answers = await prisma.answer.findMany({
    where: { questionId },
    include: {
      response: {
        select: {
          id: true,
          submittedAt: true,
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      response: {
        submittedAt: 'desc',
      },
    },
  })

  res.json({
    success: true,
    data: {
      question,
      answers,
      totalAnswers: answers.length,
    },
  } as ApiResponse)
})
