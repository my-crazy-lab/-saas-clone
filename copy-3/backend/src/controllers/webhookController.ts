import { Request, Response } from 'express';
import { StripeService } from '../services/stripeService';
import { PayPalService } from '../services/paypalService';
import { MetricsService } from '../services/metricsService';
import prisma from '../config/database';

export class WebhookController {
  static async handleStripeWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const payload = req.body;

      if (!signature) {
        res.status(400).json({
          success: false,
          error: 'Missing Stripe signature'
        });
        return;
      }

      const stripeService = new StripeService();
      await stripeService.handleWebhook(payload, signature);

      // Invalidate metrics cache for all users (in a real app, you'd be more specific)
      const accounts = await prisma.account.findMany({
        where: {
          provider: 'STRIPE',
          isActive: true
        },
        select: { userId: true }
      });

      for (const account of accounts) {
        await MetricsService.invalidateCache(account.userId);
      }

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully'
      });
    } catch (error) {
      console.error('Error handling Stripe webhook:', error);
      res.status(400).json({
        success: false,
        error: 'Webhook processing failed'
      });
    }
  }

  static async handlePayPalWebhook(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body;

      const paypalService = new PayPalService();
      await paypalService.handleWebhook(payload);

      // Invalidate metrics cache for all users (in a real app, you'd be more specific)
      const accounts = await prisma.account.findMany({
        where: {
          provider: 'PAYPAL',
          isActive: true
        },
        select: { userId: true }
      });

      for (const account of accounts) {
        await MetricsService.invalidateCache(account.userId);
      }

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully'
      });
    } catch (error) {
      console.error('Error handling PayPal webhook:', error);
      res.status(400).json({
        success: false,
        error: 'Webhook processing failed'
      });
    }
  }
}
