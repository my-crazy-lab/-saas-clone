import { Router } from 'express'
import { authenticate, optionalAuth } from '../middleware/auth'
import { validateBody, validateParams, validateQuery } from '../middleware/validation'
import { submitResponseSchema, paginationSchema } from '../utils/validation'
import { z } from 'zod'
import {
  submitResponse,
  getResponses,
  getResponse,
  deleteResponse,
  exportResponses,
} from '../controllers/responseController'

const router = Router()

const surveyIdParamSchema = z.object({
  surveyId: z.string().cuid(),
})

const responseParamSchema = z.object({
  surveyId: z.string().cuid(),
  id: z.string().cuid(),
})

// Public route for submitting responses (with optional auth)
router.post('/:surveyId/submit', validateParams(surveyIdParamSchema), validateBody(submitResponseSchema), optionalAuth, submitResponse)

// Protected routes for survey owners
router.use(authenticate)
router.get('/:surveyId/responses', validateParams(surveyIdParamSchema), validateQuery(paginationSchema), getResponses)
router.get('/:surveyId/responses/export', validateParams(surveyIdParamSchema), exportResponses)
router.get('/:surveyId/responses/:id', validateParams(responseParamSchema), getResponse)
router.delete('/:surveyId/responses/:id', validateParams(responseParamSchema), deleteResponse)

export default router
