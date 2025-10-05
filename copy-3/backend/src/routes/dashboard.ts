import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController';
import { authenticate, requireAdminOrViewer } from '../middleware/auth';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);
router.use(requireAdminOrViewer);

// Dashboard data endpoint
router.get('/', DashboardController.dateRangeValidation, DashboardController.getDashboardData);

// Metrics endpoint
router.get('/metrics', DashboardController.dateRangeValidation, DashboardController.getMetrics);

export default router;
