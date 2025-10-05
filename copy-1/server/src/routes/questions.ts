import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { validateBody, validateParams } from '../middleware/validation'
import { createQuestionSchema, updateQuestionSchema } from '../utils/validation'
import { z } from 'zod'
import {
  createQuestion,
  getQuestions,
  getQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
} from '../controllers/questionController'

const router = Router()

// All routes require authentication
router.use(authenticate)

const surveyIdParamSchema = z.object({
  surveyId: z.string().cuid(),
})

const questionParamSchema = z.object({
  surveyId: z.string().cuid(),
  id: z.string().cuid(),
})

const reorderSchema = z.object({
  questionIds: z.array(z.string().cuid()),
})

router.post('/:surveyId/questions', validateParams(surveyIdParamSchema), validateBody(createQuestionSchema), createQuestion)
router.get('/:surveyId/questions', validateParams(surveyIdParamSchema), getQuestions)
router.get('/:surveyId/questions/:id', validateParams(questionParamSchema), getQuestion)
router.put('/:surveyId/questions/:id', validateParams(questionParamSchema), validateBody(updateQuestionSchema), updateQuestion)
router.delete('/:surveyId/questions/:id', validateParams(questionParamSchema), deleteQuestion)
router.post('/:surveyId/questions/reorder', validateParams(surveyIdParamSchema), validateBody(reorderSchema), reorderQuestions)

export default router
