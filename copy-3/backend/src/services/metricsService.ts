import prisma from '../config/database';
import redis from '../config/redis';
import { MetricsData, DateRange } from '../types';
import { SubscriptionStatus, BillingCycle, TransactionType } from '@prisma/client';

export class MetricsService {
  private static CACHE_TTL = 3600; // 1 hour in seconds

  static async calculateMRR(userId: string, dateRange?: DateRange): Promise<number> {
    try {
      const cacheKey = `mrr:${userId}:${dateRange?.startDate.toISOString() || 'all'}:${dateRange?.endDate.toISOString() || 'all'}`;
      
      // Try to get from cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        return parseFloat(cached);
      }

      const whereClause: any = {
        account: { userId },
        status: SubscriptionStatus.ACTIVE
      };

      if (dateRange) {
        whereClause.startDate = {
          gte: dateRange.startDate,
          lte: dateRange.endDate
        };
      }

      const subscriptions = await prisma.subscription.findMany({
        where: whereClause
      });

      let totalMRR = 0;

      for (const subscription of subscriptions) {
        const monthlyRevenue = this.normalizeToMonthlyRevenue(
          parseFloat(subscription.price.toString()),
          subscription.billingCycle
        );
        totalMRR += monthlyRevenue;
      }

      // Cache the result
      await redis.setex(cacheKey, this.CACHE_TTL, totalMRR.toString());

      return totalMRR;
    } catch (error) {
      console.error('Error calculating MRR:', error);
      throw new Error('Failed to calculate MRR');
    }
  }

  static async calculateChurnRate(userId: string, dateRange: DateRange): Promise<number> {
    try {
      const cacheKey = `churn:${userId}:${dateRange.startDate.toISOString()}:${dateRange.endDate.toISOString()}`;
      
      const cached = await redis.get(cacheKey);
      if (cached) {
        return parseFloat(cached);
      }

      // Get active subscriptions at the start of the period
      const activeAtStart = await prisma.subscription.count({
        where: {
          account: { userId },
          startDate: { lte: dateRange.startDate },
          OR: [
            { endDate: null },
            { endDate: { gte: dateRange.startDate } }
          ]
        }
      });

      // Get subscriptions that churned during the period
      const churned = await prisma.subscription.count({
        where: {
          account: { userId },
          status: SubscriptionStatus.CANCELED,
          endDate: {
            gte: dateRange.startDate,
            lte: dateRange.endDate
          }
        }
      });

      const churnRate = activeAtStart > 0 ? (churned / activeAtStart) : 0;

      await redis.setex(cacheKey, this.CACHE_TTL, churnRate.toString());

      return churnRate;
    } catch (error) {
      console.error('Error calculating churn rate:', error);
      throw new Error('Failed to calculate churn rate');
    }
  }

  static async calculateLTV(userId: string, dateRange?: DateRange): Promise<number> {
    try {
      const cacheKey = `ltv:${userId}:${dateRange?.startDate.toISOString() || 'all'}:${dateRange?.endDate.toISOString() || 'all'}`;
      
      const cached = await redis.get(cacheKey);
      if (cached) {
        return parseFloat(cached);
      }

      // Calculate average revenue per user (ARPU)
      const mrr = await this.calculateMRR(userId, dateRange);
      const activeUsers = await this.getActiveUsers(userId, dateRange);
      const arpu = activeUsers > 0 ? mrr / activeUsers : 0;

      // Calculate average customer lifespan (in months)
      // This is a simplified calculation - in reality, you'd want more sophisticated cohort analysis
      const avgLifespanQuery = await prisma.$queryRaw<Array<{ avg_lifespan: number }>>`
        SELECT AVG(
          CASE 
            WHEN s.end_date IS NULL THEN EXTRACT(EPOCH FROM (NOW() - s.start_date)) / (30 * 24 * 60 * 60)
            ELSE EXTRACT(EPOCH FROM (s.end_date - s.start_date)) / (30 * 24 * 60 * 60)
          END
        ) as avg_lifespan
        FROM subscriptions s
        JOIN accounts a ON s.account_id = a.id
        WHERE a.user_id = ${userId}
        AND s.status IN ('ACTIVE', 'CANCELED')
      `;

      const avgLifespan = avgLifespanQuery[0]?.avg_lifespan || 12; // Default to 12 months
      const ltv = arpu * avgLifespan;

      await redis.setex(cacheKey, this.CACHE_TTL, ltv.toString());

      return ltv;
    } catch (error) {
      console.error('Error calculating LTV:', error);
      throw new Error('Failed to calculate LTV');
    }
  }

  static async getActiveUsers(userId: string, dateRange?: DateRange): Promise<number> {
    try {
      const cacheKey = `active_users:${userId}:${dateRange?.startDate.toISOString() || 'all'}:${dateRange?.endDate.toISOString() || 'all'}`;
      
      const cached = await redis.get(cacheKey);
      if (cached) {
        return parseInt(cached);
      }

      const whereClause: any = {
        account: { userId },
        status: SubscriptionStatus.ACTIVE
      };

      if (dateRange) {
        whereClause.startDate = { lte: dateRange.endDate };
        whereClause.OR = [
          { endDate: null },
          { endDate: { gte: dateRange.startDate } }
        ];
      }

      const activeUsers = await prisma.subscription.count({
        where: whereClause
      });

      await redis.setex(cacheKey, this.CACHE_TTL, activeUsers.toString());

      return activeUsers;
    } catch (error) {
      console.error('Error getting active users:', error);
      throw new Error('Failed to get active users');
    }
  }

  static async getTotalRevenue(userId: string, dateRange?: DateRange): Promise<number> {
    try {
      const cacheKey = `revenue:${userId}:${dateRange?.startDate.toISOString() || 'all'}:${dateRange?.endDate.toISOString() || 'all'}`;
      
      const cached = await redis.get(cacheKey);
      if (cached) {
        return parseFloat(cached);
      }

      const whereClause: any = {
        subscription: {
          account: { userId }
        },
        type: TransactionType.CHARGE
      };

      if (dateRange) {
        whereClause.date = {
          gte: dateRange.startDate,
          lte: dateRange.endDate
        };
      }

      const result = await prisma.transaction.aggregate({
        where: whereClause,
        _sum: {
          amount: true
        }
      });

      const totalRevenue = parseFloat(result._sum.amount?.toString() || '0');

      await redis.setex(cacheKey, this.CACHE_TTL, totalRevenue.toString());

      return totalRevenue;
    } catch (error) {
      console.error('Error calculating total revenue:', error);
      throw new Error('Failed to calculate total revenue');
    }
  }

  static async getTotalRefunds(userId: string, dateRange?: DateRange): Promise<number> {
    try {
      const cacheKey = `refunds:${userId}:${dateRange?.startDate.toISOString() || 'all'}:${dateRange?.endDate.toISOString() || 'all'}`;
      
      const cached = await redis.get(cacheKey);
      if (cached) {
        return parseFloat(cached);
      }

      const whereClause: any = {
        subscription: {
          account: { userId }
        },
        type: {
          in: [TransactionType.REFUND, TransactionType.PARTIAL_REFUND]
        }
      };

      if (dateRange) {
        whereClause.date = {
          gte: dateRange.startDate,
          lte: dateRange.endDate
        };
      }

      const result = await prisma.transaction.aggregate({
        where: whereClause,
        _sum: {
          amount: true
        }
      });

      const totalRefunds = parseFloat(result._sum.amount?.toString() || '0');

      await redis.setex(cacheKey, this.CACHE_TTL, totalRefunds.toString());

      return totalRefunds;
    } catch (error) {
      console.error('Error calculating total refunds:', error);
      throw new Error('Failed to calculate total refunds');
    }
  }

  static async getAllMetrics(userId: string, dateRange?: DateRange): Promise<MetricsData> {
    try {
      const [mrr, churn, ltv, activeUsers, totalRevenue, totalRefunds] = await Promise.all([
        this.calculateMRR(userId, dateRange),
        dateRange ? this.calculateChurnRate(userId, dateRange) : 0,
        this.calculateLTV(userId, dateRange),
        this.getActiveUsers(userId, dateRange),
        this.getTotalRevenue(userId, dateRange),
        this.getTotalRefunds(userId, dateRange)
      ]);

      return {
        mrr,
        churn,
        ltv,
        activeUsers,
        totalRevenue,
        totalRefunds
      };
    } catch (error) {
      console.error('Error getting all metrics:', error);
      throw new Error('Failed to get metrics');
    }
  }

  static async cacheMetrics(userId: string, dateRange: string, metrics: MetricsData): Promise<void> {
    try {
      await prisma.metricsCache.upsert({
        where: {
          userId_dateRange: {
            userId,
            dateRange
          }
        },
        update: {
          mrr: metrics.mrr,
          churn: metrics.churn,
          ltv: metrics.ltv,
          activeUsers: metrics.activeUsers,
          totalRevenue: metrics.totalRevenue,
          totalRefunds: metrics.totalRefunds,
          cachedAt: new Date()
        },
        create: {
          userId,
          dateRange,
          mrr: metrics.mrr,
          churn: metrics.churn,
          ltv: metrics.ltv,
          activeUsers: metrics.activeUsers,
          totalRevenue: metrics.totalRevenue,
          totalRefunds: metrics.totalRefunds
        }
      });
    } catch (error) {
      console.error('Error caching metrics:', error);
    }
  }

  private static normalizeToMonthlyRevenue(amount: number, billingCycle: BillingCycle): number {
    switch (billingCycle) {
      case BillingCycle.DAILY:
        return amount * 30; // Approximate month
      case BillingCycle.WEEKLY:
        return amount * 4.33; // Average weeks per month
      case BillingCycle.MONTHLY:
        return amount;
      case BillingCycle.YEARLY:
        return amount / 12;
      default:
        return amount;
    }
  }

  static async invalidateCache(userId: string): Promise<void> {
    try {
      const pattern = `*:${userId}:*`;
      const keys = await redis.keys(pattern);
      
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
  }
}
