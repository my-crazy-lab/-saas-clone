import { Response } from 'express';
import { query, validationResult } from 'express-validator';
import { AuthenticatedRequest, ApiResponse, DashboardData, ChartDataPoint } from '../types';
import { MetricsService } from '../services/metricsService';
import prisma from '../config/database';

export class DashboardController {
  static dateRangeValidation = [
    query('startDate').optional().isISO8601().toDate(),
    query('endDate').optional().isISO8601().toDate(),
    query('period').optional().isIn(['7d', '30d', '90d', '1y', 'all']),
  ];

  static async getDashboardData(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const { startDate, endDate, period = '30d' } = req.query;

      // Calculate date range
      const dateRange = DashboardController.calculateDateRange(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
        period as string
      );

      // Get all metrics
      const metrics = await MetricsService.getAllMetrics(userId, dateRange);

      // Get chart data
      const [mrrChart, churnChart, revenueChart, planDistribution] = await Promise.all([
        DashboardController.getMRRChartData(userId, dateRange),
        DashboardController.getChurnChartData(userId, dateRange),
        DashboardController.getRevenueChartData(userId, dateRange),
        DashboardController.getPlanDistribution(userId, dateRange)
      ]);

      // Calculate growth rates
      const previousPeriod = DashboardController.getPreviousPeriod(dateRange);
      const previousMetrics = await MetricsService.getAllMetrics(userId, previousPeriod);
      
      const mrrGrowth = previousMetrics.mrr > 0 
        ? ((metrics.mrr - previousMetrics.mrr) / previousMetrics.mrr) * 100 
        : 0;

      const dashboardData: DashboardData = {
        mrrChart,
        churnChart,
        revenueChart,
        planDistribution,
        summary: {
          currentMrr: metrics.mrr,
          mrrGrowth,
          churnRate: metrics.churn * 100, // Convert to percentage
          activeSubscriptions: metrics.activeUsers,
          totalRevenue: metrics.totalRevenue
        }
      };

      const response: ApiResponse<DashboardData> = {
        success: true,
        data: dashboardData
      };

      res.json(response);
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  static async getMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const { startDate, endDate, period = '30d' } = req.query;

      const dateRange = DashboardController.calculateDateRange(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
        period as string
      );

      const metrics = await MetricsService.getAllMetrics(userId, dateRange);

      const response: ApiResponse = {
        success: true,
        data: metrics
      };

      res.json(response);
    } catch (error) {
      console.error('Error getting metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  private static calculateDateRange(startDate?: Date, endDate?: Date, period?: string) {
    if (startDate && endDate) {
      return { startDate, endDate };
    }

    const now = new Date();
    let start: Date;

    switch (period) {
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { startDate: start, endDate: now };
  }

  private static getPreviousPeriod(dateRange: { startDate: Date; endDate: Date }) {
    const duration = dateRange.endDate.getTime() - dateRange.startDate.getTime();
    return {
      startDate: new Date(dateRange.startDate.getTime() - duration),
      endDate: dateRange.startDate
    };
  }

  private static async getMRRChartData(userId: string, dateRange: { startDate: Date; endDate: Date }): Promise<ChartDataPoint[]> {
    // Generate daily data points for the chart
    const data: ChartDataPoint[] = [];
    const current = new Date(dateRange.startDate);
    
    while (current <= dateRange.endDate) {
      const dayEnd = new Date(current);
      dayEnd.setHours(23, 59, 59, 999);
      
      const mrr = await MetricsService.calculateMRR(userId, {
        startDate: new Date(0), // From beginning
        endDate: dayEnd
      });
      
      data.push({
        date: current.toISOString().split('T')[0],
        value: mrr
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return data;
  }

  private static async getChurnChartData(userId: string, dateRange: { startDate: Date; endDate: Date }): Promise<ChartDataPoint[]> {
    // Generate weekly churn data
    const data: ChartDataPoint[] = [];
    const current = new Date(dateRange.startDate);
    
    while (current <= dateRange.endDate) {
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      if (weekEnd > dateRange.endDate) {
        weekEnd.setTime(dateRange.endDate.getTime());
      }
      
      const churn = await MetricsService.calculateChurnRate(userId, {
        startDate: current,
        endDate: weekEnd
      });
      
      data.push({
        date: current.toISOString().split('T')[0],
        value: churn * 100 // Convert to percentage
      });
      
      current.setDate(current.getDate() + 7);
    }
    
    return data;
  }

  private static async getRevenueChartData(userId: string, dateRange: { startDate: Date; endDate: Date }): Promise<ChartDataPoint[]> {
    // Generate daily revenue data
    const data: ChartDataPoint[] = [];
    const current = new Date(dateRange.startDate);
    
    while (current <= dateRange.endDate) {
      const dayEnd = new Date(current);
      dayEnd.setHours(23, 59, 59, 999);
      
      const revenue = await MetricsService.getTotalRevenue(userId, {
        startDate: current,
        endDate: dayEnd
      });
      
      data.push({
        date: current.toISOString().split('T')[0],
        value: revenue
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return data;
  }

  private static async getPlanDistribution(userId: string, dateRange: { startDate: Date; endDate: Date }) {
    const result = await prisma.subscription.groupBy({
      by: ['planName'],
      where: {
        account: { userId },
        status: 'ACTIVE',
        startDate: { lte: dateRange.endDate },
        OR: [
          { endDate: null },
          { endDate: { gte: dateRange.startDate } }
        ]
      },
      _count: {
        id: true
      },
      _sum: {
        price: true
      }
    });

    return result.map(item => ({
      planName: item.planName || 'Unknown Plan',
      count: item._count.id,
      revenue: parseFloat(item._sum.price?.toString() || '0')
    }));
  }
}
