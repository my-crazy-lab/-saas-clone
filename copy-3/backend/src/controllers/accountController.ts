import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { StripeService } from '../services/stripeService';
import { PayPalService } from '../services/paypalService';
import prisma from '../config/database';
import { PaymentProvider } from '@prisma/client';

export class AccountController {
  static connectAccountValidation = [
    body('provider').isIn(['STRIPE', 'PAYPAL']),
    body('authCode').notEmpty().trim(),
  ];

  static async getAccounts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const accounts = await prisma.account.findMany({
        where: { userId },
        select: {
          id: true,
          provider: true,
          providerId: true,
          connectedAt: true,
          isActive: true,
          _count: {
            select: {
              subscriptions: true
            }
          }
        }
      });

      const response: ApiResponse = {
        success: true,
        data: accounts
      };

      res.json(response);
    } catch (error) {
      console.error('Error getting accounts:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async connectAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const userId = req.user!.id;
      const { provider, authCode } = req.body;

      let service: StripeService | PayPalService;

      switch (provider) {
        case 'STRIPE':
          service = new StripeService();
          break;
        case 'PAYPAL':
          service = new PayPalService();
          break;
        default:
          res.status(400).json({
            success: false,
            error: 'Invalid provider'
          });
          return;
      }

      await service.connectAccount(userId, authCode);

      const response: ApiResponse = {
        success: true,
        message: `${provider} account connected successfully`
      };

      res.json(response);
    } catch (error) {
      console.error('Error connecting account:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to connect account'
      });
    }
  }

  static async disconnectAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { accountId } = req.params;

      const account = await prisma.account.findFirst({
        where: {
          id: accountId,
          userId
        }
      });

      if (!account) {
        res.status(404).json({
          success: false,
          error: 'Account not found'
        });
        return;
      }

      await prisma.account.update({
        where: { id: accountId },
        data: { isActive: false }
      });

      const response: ApiResponse = {
        success: true,
        message: 'Account disconnected successfully'
      };

      res.json(response);
    } catch (error) {
      console.error('Error disconnecting account:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async syncAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { accountId } = req.params;

      const account = await prisma.account.findFirst({
        where: {
          id: accountId,
          userId,
          isActive: true
        }
      });

      if (!account) {
        res.status(404).json({
          success: false,
          error: 'Account not found or inactive'
        });
        return;
      }

      let service: StripeService | PayPalService;

      switch (account.provider) {
        case PaymentProvider.STRIPE:
          service = new StripeService();
          break;
        case PaymentProvider.PAYPAL:
          service = new PayPalService();
          break;
        default:
          res.status(400).json({
            success: false,
            error: 'Invalid provider'
          });
          return;
      }

      await service.syncSubscriptions(accountId);

      const response: ApiResponse = {
        success: true,
        message: 'Account synced successfully'
      };

      res.json(response);
    } catch (error) {
      console.error('Error syncing account:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to sync account'
      });
    }
  }

  static async getSubscriptions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { accountId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const account = await prisma.account.findFirst({
        where: {
          id: accountId,
          userId
        }
      });

      if (!account) {
        res.status(404).json({
          success: false,
          error: 'Account not found'
        });
        return;
      }

      const [subscriptions, total] = await Promise.all([
        prisma.subscription.findMany({
          where: { accountId },
          include: {
            _count: {
              select: {
                transactions: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        }),
        prisma.subscription.count({
          where: { accountId }
        })
      ]);

      const response: ApiResponse = {
        success: true,
        data: {
          subscriptions,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1
          }
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Error getting subscriptions:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}
