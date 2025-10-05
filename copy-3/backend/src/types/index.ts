import { Request } from 'express';
import { User } from '@prisma/client';

// Extend Express Request type to include user
export interface AuthenticatedRequest extends Request {
  user?: User;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Metrics types
export interface MetricsData {
  mrr: number;
  churn: number;
  ltv: number;
  activeUsers: number;
  totalRevenue: number;
  totalRefunds: number;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Payment provider types
export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

export interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  resource: any;
}

// Dashboard chart data types
export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface DashboardData {
  mrrChart: ChartDataPoint[];
  churnChart: ChartDataPoint[];
  revenueChart: ChartDataPoint[];
  planDistribution: {
    planName: string;
    count: number;
    revenue: number;
  }[];
  summary: {
    currentMrr: number;
    mrrGrowth: number;
    churnRate: number;
    activeSubscriptions: number;
    totalRevenue: number;
  };
}
