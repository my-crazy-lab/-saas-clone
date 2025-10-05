import { Router } from 'express';
import { AccountController } from '../controllers/accountController';
import { authenticate, requireAdminOrViewer } from '../middleware/auth';

const router = Router();

// All account routes require authentication
router.use(authenticate);
router.use(requireAdminOrViewer);

// Get all connected accounts
router.get('/', AccountController.getAccounts);

// Connect a new payment account
router.post('/connect', AccountController.connectAccountValidation, AccountController.connectAccount);

// Disconnect an account
router.delete('/:accountId', AccountController.disconnectAccount);

// Sync account data
router.post('/:accountId/sync', AccountController.syncAccount);

// Get subscriptions for an account
router.get('/:accountId/subscriptions', AccountController.getSubscriptions);

export default router;
