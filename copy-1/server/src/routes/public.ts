import { Router } from 'express'
import { validateParams } from '../middleware/validation'
import { z } from 'zod'
import {
  getPublicSurvey,
  generateQRCode,
  generateEmbedCode,
  getSurveyStats,
} from '../controllers/publicController'

const router = Router()

const idParamSchema = z.object({
  id: z.string().cuid(),
})

router.get('/survey/:id', validateParams(idParamSchema), getPublicSurvey)
router.get('/survey/:id/qr', validateParams(idParamSchema), generateQRCode)
router.get('/survey/:id/embed', validateParams(idParamSchema), generateEmbedCode)
router.get('/survey/:id/stats', validateParams(idParamSchema), getSurveyStats)

export default router
