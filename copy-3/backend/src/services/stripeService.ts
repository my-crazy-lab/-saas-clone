import Stripe from 'stripe';
import config from '../config/env';
import prisma from '../config/database';
import { PaymentProvider, SubscriptionStatus, BillingCycle, TransactionType } from '@prisma/client';

export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(config.stripe.secretKey, {
      apiVersion: '2025-09-30.clover',
    });
  }

  async connectAccount(userId: string, authCode: string): Promise<void> {
    try {
      // In a real implementation, you would exchange the auth code for access tokens
      // For now, we'll simulate storing the connection
      await prisma.account.upsert({
        where: {
          userId_provider: {
            userId,
            provider: PaymentProvider.STRIPE
          }
        },
        update: {
          isActive: true,
          connectedAt: new Date()
        },
        create: {
          userId,
          provider: PaymentProvider.STRIPE,
          providerId: 'stripe_account_id', // This would be the actual Stripe account ID
          accessToken: 'encrypted_access_token', // This would be encrypted
          refreshToken: 'encrypted_refresh_token', // This would be encrypted
          isActive: true
        }
      });
    } catch (error) {
      console.error('Error connecting Stripe account:', error);
      throw new Error('Failed to connect Stripe account');
    }
  }

  async syncSubscriptions(accountId: string): Promise<void> {
    try {
      const account = await prisma.account.findUnique({
        where: { id: accountId }
      });

      if (!account || !account.isActive) {
        throw new Error('Account not found or inactive');
      }

      // Fetch subscriptions from Stripe
      const subscriptions = await this.stripe.subscriptions.list({
        limit: 100,
        status: 'all'
      });

      for (const subscription of subscriptions.data) {
        await this.processSubscription(accountId, subscription);
      }
    } catch (error) {
      console.error('Error syncing Stripe subscriptions:', error);
      throw new Error('Failed to sync subscriptions');
    }
  }

  private async processSubscription(accountId: string, stripeSubscription: Stripe.Subscription): Promise<void> {
    const status = this.mapStripeStatus(stripeSubscription.status);
    const billingCycle = this.mapBillingCycle(stripeSubscription.items.data[0]?.price?.recurring?.interval);
    
    const subscriptionData = {
      accountId,
      customerId: stripeSubscription.customer as string,
      planId: stripeSubscription.items.data[0]?.price?.id || '',
      planName: stripeSubscription.items.data[0]?.price?.nickname || 'Unknown Plan',
      startDate: new Date(stripeSubscription.start_date * 1000),
      endDate: stripeSubscription.ended_at ? new Date(stripeSubscription.ended_at * 1000) : null,
      status,
      price: (stripeSubscription.items.data[0]?.price?.unit_amount || 0) / 100,
      currency: stripeSubscription.currency.toUpperCase(),
      billingCycle
    };

    // Find existing subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        accountId,
        customerId: subscriptionData.customerId,
        planId: subscriptionData.planId
      }
    });

    if (existingSubscription) {
      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: subscriptionData
      });
    } else {
      await prisma.subscription.create({
        data: subscriptionData
      });
    }

    // Sync related transactions
    await this.syncSubscriptionTransactions(stripeSubscription.id, stripeSubscription.id);
  }

  private async syncSubscriptionTransactions(subscriptionId: string, stripeSubscriptionId: string): Promise<void> {
    try {
      const invoices = await this.stripe.invoices.list({
        subscription: stripeSubscriptionId,
        limit: 100
      });

      for (const invoice of invoices.data) {
        if (invoice.status === 'paid') {
          const transactionData = {
            subscriptionId,
            type: TransactionType.CHARGE,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency.toUpperCase(),
            date: new Date(invoice.status_transitions.paid_at! * 1000),
            description: invoice.description || 'Subscription payment',
            providerTxnId: invoice.id
          };

          // Find existing transaction
          const existingTransaction = await prisma.transaction.findFirst({
            where: {
              providerTxnId: invoice.id
            }
          });

          if (existingTransaction) {
            await prisma.transaction.update({
              where: { id: existingTransaction.id },
              data: transactionData
            });
          } else {
            await prisma.transaction.create({
              data: transactionData
            });
          }
        }
      }
    } catch (error) {
      console.error('Error syncing subscription transactions:', error);
    }
  }

  private mapStripeStatus(stripeStatus: string): SubscriptionStatus {
    switch (stripeStatus) {
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'canceled':
        return SubscriptionStatus.CANCELED;
      case 'past_due':
        return SubscriptionStatus.PAST_DUE;
      case 'unpaid':
        return SubscriptionStatus.UNPAID;
      case 'trialing':
        return SubscriptionStatus.TRIALING;
      default:
        return SubscriptionStatus.ACTIVE;
    }
  }

  private mapBillingCycle(interval?: string): BillingCycle {
    switch (interval) {
      case 'month':
        return BillingCycle.MONTHLY;
      case 'year':
        return BillingCycle.YEARLY;
      case 'week':
        return BillingCycle.WEEKLY;
      case 'day':
        return BillingCycle.DAILY;
      default:
        return BillingCycle.MONTHLY;
    }
  }

  async handleWebhook(payload: string, signature: string): Promise<void> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        config.stripe.webhookSecret
      );

      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          await this.handleSubscriptionEvent(event);
          break;
        case 'invoice.payment_succeeded':
        case 'invoice.payment_failed':
          await this.handleInvoiceEvent(event);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error handling Stripe webhook:', error);
      throw error;
    }
  }

  private async handleSubscriptionEvent(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription;
    
    // Find the account associated with this subscription
    const account = await prisma.account.findFirst({
      where: {
        provider: PaymentProvider.STRIPE,
        isActive: true
      }
    });

    if (account) {
      await this.processSubscription(account.id, subscription);
    }
  }

  private async handleInvoiceEvent(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;
    
    if ((invoice as any).subscription) {
      const subscription = await prisma.subscription.findFirst({
        where: {
          customerId: invoice.customer as string,
          account: {
            provider: PaymentProvider.STRIPE
          }
        }
      });

      if (subscription) {
        await this.syncSubscriptionTransactions(subscription.id, (invoice as any).subscription as string);
      }
    }
  }
}
