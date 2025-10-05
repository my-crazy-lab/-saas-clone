import { Router } from 'express';
import { WebhookController } from '../controllers/webhookController';

const router = Router();

// Webhook endpoints (no authentication required)
router.post('/stripe', WebhookController.handleStripeWebhook);
router.post('/paypal', WebhookController.handlePayPalWebhook);

export default router;
