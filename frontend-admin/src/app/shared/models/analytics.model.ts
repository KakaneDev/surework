export interface FeatureUsage {
  featureCode: string;
  featureName: string;
  totalEvents: number;
  uniqueUsers: number;
  uniqueTenants: number;
  trend: number;
}

export interface TenantHealthScore {
  tenantId: string;
  tenantName: string;
  score: number;
  churnRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  factors: HealthFactor[];
  calculatedAt: string;
}

export interface HealthFactor {
  name: string;
  score: number;
  weight: number;
  description: string;
}

export interface ChurnMetrics {
  currentChurnRate: number;
  previousChurnRate: number;
  churnTrend: number;
  atRiskTenants: number;
  recentlyChurned: ChurnedTenant[];
}

export interface ChurnedTenant {
  tenantId: string;
  tenantName: string;
  churnedAt: string;
  reason?: string;
  mrr: number;
}

export interface CohortAnalysis {
  cohortMonth: string;
  initialTenants: number;
  retentionRates: number[];
}

export interface OnboardingFunnel {
  stage: string;
  count: number;
  percentage: number;
  dropOffRate: number;
}

export interface DashboardKpis {
  totalTenants: number;
  tenantGrowth: number;
  activeTrials: number;
  trialConversionRate: number;
  mrr: number;
  mrrGrowth: number;
  churnRate: number;
  churnTrend: number;
  avgRevenuePerTenant: number;
  activeUsers: number;
}
