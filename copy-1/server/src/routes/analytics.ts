import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { validateParams } from '../middleware/validation'
import { z } from 'zod'
import {
  getSurveyAnalytics,
  getQuestionAnalytics,
} from '../controllers/analyticsController'

const router = Router()

// All routes require authentication
router.use(authenticate)

const surveyIdParamSchema = z.object({
  surveyId: z.string().cuid(),
})

const questionParamSchema = z.object({
  surveyId: z.string().cuid(),
  questionId: z.string().cuid(),
})

router.get('/:surveyId', validateParams(surveyIdParamSchema), getSurveyAnalytics)
router.get('/:surveyId/questions/:questionId', validateParams(questionParamSchema), getQuestionAnalytics)

export default router
