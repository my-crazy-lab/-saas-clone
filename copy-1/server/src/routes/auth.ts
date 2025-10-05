import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { validateBody } from '../middleware/validation'
import { registerSchema, loginSchema } from '../utils/validation'
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
} from '../controllers/authController'

const router = Router()

// Public routes
router.post('/register', validateBody(registerSchema), register)
router.post('/login', validateBody(loginSchema), login)

// Protected routes
router.use(authenticate)
router.get('/profile', getProfile)
router.put('/profile', updateProfile)
router.post('/change-password', changePassword)
router.post('/refresh', refreshToken)

export default router
