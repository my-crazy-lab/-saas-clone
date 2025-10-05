import { MetricsService } from '../../services/metricsService';
import { prisma } from '../setup';
import { PaymentProvider, SubscriptionStatus, BillingCycle, TransactionType } from '@prisma/client';

describe('MetricsService', () => {
  let userId: string;
  let accountId: string;

  beforeEach(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashedpassword',
        role: 'ADMIN',
      },
    });
    userId = user.id;

    // Create test account
    const account = await prisma.account.create({
      data: {
        userId,
        provider: PaymentProvider.STRIPE,
        providerId: 'stripe_account_123',
        isActive: true,
      },
    });
    accountId = account.id;
  });

  describe('calculateMRR', () => {
    it('should calculate MRR correctly for monthly subscriptions', async () => {
      // Create test subscriptions
      await prisma.subscription.createMany({
        data: [
          {
            accountId,
            customerId: 'cust_1',
            planId: 'plan_1',
            planName: 'Basic Plan',
            startDate: new Date('2024-01-01'),
            status: SubscriptionStatus.ACTIVE,
            price: 29.99,
            currency: 'USD',
            billingCycle: BillingCycle.MONTHLY,
          },
          {
            accountId,
            customerId: 'cust_2',
            planId: 'plan_2',
            planName: 'Pro Plan',
            startDate: new Date('2024-01-15'),
            status: SubscriptionStatus.ACTIVE,
            price: 99.99,
            currency: 'USD',
            billingCycle: BillingCycle.MONTHLY,
          },
        ],
      });

      const mrr = await MetricsService.calculateMRR(userId);
      expect(mrr).toBe(129.98); // 29.99 + 99.99
    });

    it('should normalize yearly subscriptions to monthly', async () => {
      await prisma.subscription.create({
        data: {
          accountId,
          customerId: 'cust_yearly',
          planId: 'plan_yearly',
          planName: 'Yearly Plan',
          startDate: new Date('2024-01-01'),
          status: SubscriptionStatus.ACTIVE,
          price: 1200, // $1200/year = $100/month
          currency: 'USD',
          billingCycle: BillingCycle.YEARLY,
        },
      });

      const mrr = await MetricsService.calculateMRR(userId);
      expect(mrr).toBe(100); // 1200 / 12
    });

    it('should exclude canceled subscriptions', async () => {
      await prisma.subscription.createMany({
        data: [
          {
            accountId,
            customerId: 'cust_active',
            planId: 'plan_active',
            planName: 'Active Plan',
            startDate: new Date('2024-01-01'),
            status: SubscriptionStatus.ACTIVE,
            price: 50,
            currency: 'USD',
            billingCycle: BillingCycle.MONTHLY,
          },
          {
            accountId,
            customerId: 'cust_canceled',
            planId: 'plan_canceled',
            planName: 'Canceled Plan',
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-02-01'),
            status: SubscriptionStatus.CANCELED,
            price: 30,
            currency: 'USD',
            billingCycle: BillingCycle.MONTHLY,
          },
        ],
      });

      const mrr = await MetricsService.calculateMRR(userId);
      expect(mrr).toBe(50); // Only active subscription
    });
  });

  describe('calculateChurnRate', () => {
    it('should calculate churn rate correctly', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      // Create subscriptions that were active at start of period
      await prisma.subscription.createMany({
        data: [
          {
            accountId,
            customerId: 'cust_1',
            planId: 'plan_1',
            planName: 'Plan 1',
            startDate: new Date('2023-12-01'),
            status: SubscriptionStatus.ACTIVE,
            price: 50,
            currency: 'USD',
            billingCycle: BillingCycle.MONTHLY,
          },
          {
            accountId,
            customerId: 'cust_2',
            planId: 'plan_2',
            planName: 'Plan 2',
            startDate: new Date('2023-12-01'),
            endDate: new Date('2024-01-15'), // Churned during period
            status: SubscriptionStatus.CANCELED,
            price: 30,
            currency: 'USD',
            billingCycle: BillingCycle.MONTHLY,
          },
          {
            accountId,
            customerId: 'cust_3',
            planId: 'plan_3',
            planName: 'Plan 3',
            startDate: new Date('2023-12-01'),
            status: SubscriptionStatus.ACTIVE,
            price: 70,
            currency: 'USD',
            billingCycle: BillingCycle.MONTHLY,
          },
        ],
      });

      const churnRate = await MetricsService.calculateChurnRate(userId, { startDate, endDate });
      expect(churnRate).toBeCloseTo(0.333, 2); // 1 churned out of 3 = 33.33%
    });
  });

  describe('getTotalRevenue', () => {
    it('should calculate total revenue from transactions', async () => {
      // Create subscription
      const subscription = await prisma.subscription.create({
        data: {
          accountId,
          customerId: 'cust_1',
          planId: 'plan_1',
          planName: 'Test Plan',
          startDate: new Date('2024-01-01'),
          status: SubscriptionStatus.ACTIVE,
          price: 50,
          currency: 'USD',
          billingCycle: BillingCycle.MONTHLY,
        },
      });

      // Create transactions
      await prisma.transaction.createMany({
        data: [
          {
            subscriptionId: subscription.id,
            type: TransactionType.CHARGE,
            amount: 50,
            currency: 'USD',
            date: new Date('2024-01-01'),
            description: 'Monthly charge',
          },
          {
            subscriptionId: subscription.id,
            type: TransactionType.CHARGE,
            amount: 50,
            currency: 'USD',
            date: new Date('2024-02-01'),
            description: 'Monthly charge',
          },
          {
            subscriptionId: subscription.id,
            type: TransactionType.REFUND,
            amount: 25,
            currency: 'USD',
            date: new Date('2024-02-15'),
            description: 'Partial refund',
          },
        ],
      });

      const totalRevenue = await MetricsService.getTotalRevenue(userId);
      expect(totalRevenue).toBe(100); // Only charges, not refunds

      const totalRefunds = await MetricsService.getTotalRefunds(userId);
      expect(totalRefunds).toBe(25);
    });
  });

  describe('getActiveUsers', () => {
    it('should count active subscriptions correctly', async () => {
      await prisma.subscription.createMany({
        data: [
          {
            accountId,
            customerId: 'cust_1',
            planId: 'plan_1',
            planName: 'Plan 1',
            startDate: new Date('2024-01-01'),
            status: SubscriptionStatus.ACTIVE,
            price: 50,
            currency: 'USD',
            billingCycle: BillingCycle.MONTHLY,
          },
          {
            accountId,
            customerId: 'cust_2',
            planId: 'plan_2',
            planName: 'Plan 2',
            startDate: new Date('2024-01-01'),
            status: SubscriptionStatus.ACTIVE,
            price: 30,
            currency: 'USD',
            billingCycle: BillingCycle.MONTHLY,
          },
          {
            accountId,
            customerId: 'cust_3',
            planId: 'plan_3',
            planName: 'Plan 3',
            startDate: new Date('2024-01-01'),
            status: SubscriptionStatus.CANCELED,
            price: 70,
            currency: 'USD',
            billingCycle: BillingCycle.MONTHLY,
          },
        ],
      });

      const activeUsers = await MetricsService.getActiveUsers(userId);
      expect(activeUsers).toBe(2); // Only active subscriptions
    });
  });

  describe('getAllMetrics', () => {
    it('should return all metrics together', async () => {
      // Create test data
      const subscription = await prisma.subscription.create({
        data: {
          accountId,
          customerId: 'cust_1',
          planId: 'plan_1',
          planName: 'Test Plan',
          startDate: new Date('2024-01-01'),
          status: SubscriptionStatus.ACTIVE,
          price: 100,
          currency: 'USD',
          billingCycle: BillingCycle.MONTHLY,
        },
      });

      await prisma.transaction.create({
        data: {
          subscriptionId: subscription.id,
          type: TransactionType.CHARGE,
          amount: 100,
          currency: 'USD',
          date: new Date('2024-01-01'),
          description: 'Monthly charge',
        },
      });

      const metrics = await MetricsService.getAllMetrics(userId);

      expect(metrics.mrr).toBe(100);
      expect(metrics.activeUsers).toBe(1);
      expect(metrics.totalRevenue).toBe(100);
      expect(metrics.totalRefunds).toBe(0);
      expect(typeof metrics.ltv).toBe('number');
      expect(typeof metrics.churn).toBe('number');
    });
  });
});
