import axios from 'axios';
import config from '../config/env';
import prisma from '../config/database';
import { PaymentProvider, SubscriptionStatus, BillingCycle, TransactionType } from '@prisma/client';

interface PayPalTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface PayPalSubscription {
  id: string;
  status: string;
  plan_id: string;
  start_time: string;
  billing_info: {
    outstanding_balance: {
      currency_code: string;
      value: string;
    };
  };
  subscriber: {
    payer_id: string;
  };
}

export class PayPalService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.paypal.environment === 'sandbox' 
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';
  }

  private async getAccessToken(): Promise<string> {
    try {
      const auth = Buffer.from(`${config.paypal.clientId}:${config.paypal.clientSecret}`).toString('base64');
      
      const response = await axios.post(
        `${this.baseUrl}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return response.data.access_token;
    } catch (error) {
      console.error('Error getting PayPal access token:', error);
      throw new Error('Failed to get PayPal access token');
    }
  }

  async connectAccount(userId: string, authCode: string): Promise<void> {
    try {
      // In a real implementation, you would exchange the auth code for access tokens
      // For now, we'll simulate storing the connection
      await prisma.account.upsert({
        where: {
          userId_provider: {
            userId,
            provider: PaymentProvider.PAYPAL
          }
        },
        update: {
          isActive: true,
          connectedAt: new Date()
        },
        create: {
          userId,
          provider: PaymentProvider.PAYPAL,
          providerId: 'paypal_merchant_id', // This would be the actual PayPal merchant ID
          accessToken: 'encrypted_access_token', // This would be encrypted
          refreshToken: 'encrypted_refresh_token', // This would be encrypted
          isActive: true
        }
      });
    } catch (error) {
      console.error('Error connecting PayPal account:', error);
      throw new Error('Failed to connect PayPal account');
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

      const accessToken = await this.getAccessToken();
      
      // Fetch subscriptions from PayPal
      const response = await axios.get(
        `${this.baseUrl}/v1/billing/subscriptions`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            page_size: 20,
            page: 1
          }
        }
      );

      const subscriptions = response.data.subscriptions || [];

      for (const subscription of subscriptions) {
        await this.processSubscription(accountId, subscription);
      }
    } catch (error) {
      console.error('Error syncing PayPal subscriptions:', error);
      throw new Error('Failed to sync subscriptions');
    }
  }

  private async processSubscription(accountId: string, paypalSubscription: PayPalSubscription): Promise<void> {
    const status = this.mapPayPalStatus(paypalSubscription.status);
    
    const subscriptionData = {
      accountId,
      customerId: paypalSubscription.subscriber.payer_id,
      planId: paypalSubscription.plan_id,
      planName: 'PayPal Plan', // PayPal doesn't provide plan names in subscription object
      startDate: new Date(paypalSubscription.start_time),
      endDate: null, // PayPal subscriptions don't have end dates unless cancelled
      status,
      price: parseFloat(paypalSubscription.billing_info?.outstanding_balance?.value || '0'),
      currency: paypalSubscription.billing_info?.outstanding_balance?.currency_code || 'USD',
      billingCycle: BillingCycle.MONTHLY // Default, would need to fetch from plan details
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
        data: {
          id: paypalSubscription.id,
          ...subscriptionData
        }
      });
    }

    // Sync related transactions
    await this.syncSubscriptionTransactions(paypalSubscription.id, paypalSubscription.id);
  }

  private async syncSubscriptionTransactions(subscriptionId: string, paypalSubscriptionId: string): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios.get(
        `${this.baseUrl}/v1/billing/subscriptions/${paypalSubscriptionId}/transactions`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            start_time: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // Last 90 days
            end_time: new Date().toISOString()
          }
        }
      );

      const transactions = response.data.transactions || [];

      for (const transaction of transactions) {
        if (transaction.status === 'COMPLETED') {
          // Find existing transaction
          const existingTransaction = await prisma.transaction.findFirst({
            where: {
              providerTxnId: transaction.id
            }
          });

          const transactionData = {
            subscriptionId,
            type: TransactionType.CHARGE,
            amount: parseFloat(transaction.amount_with_breakdown.gross_amount.value),
            currency: transaction.amount_with_breakdown.gross_amount.currency_code,
            date: new Date(transaction.time),
            description: 'PayPal subscription payment',
            providerTxnId: transaction.id
          };

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
      console.error('Error syncing PayPal subscription transactions:', error);
    }
  }

  private mapPayPalStatus(paypalStatus: string): SubscriptionStatus {
    switch (paypalStatus.toUpperCase()) {
      case 'ACTIVE':
        return SubscriptionStatus.ACTIVE;
      case 'CANCELLED':
        return SubscriptionStatus.CANCELED;
      case 'SUSPENDED':
        return SubscriptionStatus.PAST_DUE;
      case 'EXPIRED':
        return SubscriptionStatus.CANCELED;
      default:
        return SubscriptionStatus.ACTIVE;
    }
  }

  async handleWebhook(payload: any): Promise<void> {
    try {
      const eventType = payload.event_type;
      
      switch (eventType) {
        case 'BILLING.SUBSCRIPTION.CREATED':
        case 'BILLING.SUBSCRIPTION.UPDATED':
        case 'BILLING.SUBSCRIPTION.CANCELLED':
          await this.handleSubscriptionEvent(payload);
          break;
        case 'PAYMENT.SALE.COMPLETED':
          await this.handlePaymentEvent(payload);
          break;
        default:
          console.log(`Unhandled PayPal event type: ${eventType}`);
      }
    } catch (error) {
      console.error('Error handling PayPal webhook:', error);
      throw error;
    }
  }

  private async handleSubscriptionEvent(payload: any): Promise<void> {
    const subscription = payload.resource;
    
    // Find the account associated with this subscription
    const account = await prisma.account.findFirst({
      where: {
        provider: PaymentProvider.PAYPAL,
        isActive: true
      }
    });

    if (account) {
      await this.processSubscription(account.id, subscription);
    }
  }

  private async handlePaymentEvent(payload: any): Promise<void> {
    const payment = payload.resource;
    
    if (payment.billing_agreement_id) {
      const subscription = await prisma.subscription.findFirst({
        where: {
          customerId: payment.billing_agreement_id,
          account: {
            provider: PaymentProvider.PAYPAL
          }
        }
      });

      if (subscription) {
        await this.syncSubscriptionTransactions(subscription.id, payment.billing_agreement_id);
      }
    }
  }
}
