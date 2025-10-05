import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { validateBody, validateQuery, validateParams } from '../middleware/validation'
import { createSurveySchema, updateSurveySchema, paginationSchema } from '../utils/validation'
import { z } from 'zod'
import {
  createSurvey,
  getSurveys,
  getSurvey,
  updateSurvey,
  deleteSurvey,
  duplicateSurvey,
} from '../controllers/surveyController'

const router = Router()

// All routes require authentication
router.use(authenticate)

const idParamSchema = z.object({
  id: z.string().cuid(),
})

router.post('/', validateBody(createSurveySchema), createSurvey)
router.get('/', validateQuery(paginationSchema), getSurveys)
router.get('/:id', validateParams(idParamSchema), getSurvey)
router.put('/:id', validateParams(idParamSchema), validateBody(updateSurveySchema), updateSurvey)
router.delete('/:id', validateParams(idParamSchema), deleteSurvey)
router.post('/:id/duplicate', validateParams(idParamSchema), duplicateSurvey)

export default router
