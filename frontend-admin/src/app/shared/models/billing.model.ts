export interface RevenueMetrics {
  mrr: number;
  mrrGrowth: number;
  arr: number;
  avgRevenuePerTenant: number;
  revenueByPlan: PlanRevenue[];
  monthlyRevenue: MonthlyRevenue[];
}

export interface PlanRevenue {
  plan: string;
  revenue: number;
  tenantCount: number;
  percentage: number;
}

export interface MonthlyRevenue {
  month: string;
  mrr: number;
  newMrr: number;
  churnedMrr: number;
  expansionMrr: number;
}

export interface RevenueProjection {
  month: string;
  projectedMrr: number;
  projectedArr: number;
  confidenceInterval: {
    low: number;
    high: number;
  };
}

export interface Payment {
  id: string;
  tenantId: string;
  tenantName: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string;
  invoiceId?: string;
  failureReason?: string;
  createdAt: string;
}

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface Discount {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  durationMonths?: number;
  validFrom: string;
  validUntil?: string;
  maxUses?: number;
  currentUses: number;
  status: DiscountStatus;
  createdBy: string;
  createdAt: string;
}

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type DiscountStatus = 'ACTIVE' | 'EXPIRED' | 'EXHAUSTED' | 'DISABLED';

export interface CreateDiscountRequest {
  code: string;
  type: DiscountType;
  value: number;
  durationMonths?: number;
  validFrom: string;
  validUntil?: string;
  maxUses?: number;
}

export interface TenantDiscount {
  id: string;
  tenantId: string;
  tenantName: string;
  discountId: string;
  discountCode: string;
  appliedAt: string;
  expiresAt?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
}

export interface Invoice {
  id: string;
  tenantId: string;
  tenantName: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
}

export type InvoiceStatus = 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
