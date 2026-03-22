import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  FeatureUsage,
  TenantHealthScore,
  ChurnMetrics,
  CohortAnalysis,
  OnboardingFunnel,
  DashboardKpis
} from '../models/analytics.model';
import { PagedResponse } from '../models/tenant.model';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/analytics`;

  getDashboardKpis(): Observable<DashboardKpis> {
    return this.http.get<DashboardKpis>(`${this.apiUrl}/kpis`);
  }

  getFeatureUsage(period: 'week' | 'month' | 'quarter' = 'month'): Observable<FeatureUsage[]> {
    const params = new HttpParams().set('period', period);
    return this.http.get<FeatureUsage[]>(`${this.apiUrl}/feature-usage`, { params });
  }

  getHealthScores(page = 0, size = 20, riskFilter?: string): Observable<PagedResponse<TenantHealthScore>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (riskFilter) params = params.set('risk', riskFilter);

    return this.http.get<PagedResponse<TenantHealthScore>>(`${this.apiUrl}/health-scores`, { params });
  }

  getChurnMetrics(): Observable<ChurnMetrics> {
    return this.http.get<ChurnMetrics>(`${this.apiUrl}/churn`);
  }

  getCohortAnalysis(months = 6): Observable<CohortAnalysis[]> {
    const params = new HttpParams().set('months', months.toString());
    return this.http.get<CohortAnalysis[]>(`${this.apiUrl}/cohorts`, { params });
  }

  getOnboardingFunnel(): Observable<OnboardingFunnel[]> {
    return this.http.get<OnboardingFunnel[]>(`${this.apiUrl}/onboarding-funnel`);
  }

  getRecentActivity(limit = 10): Observable<{
    type: string;
    description: string;
    tenantName?: string;
    timestamp: string;
  }[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<any[]>(`${this.apiUrl}/recent-activity`, { params });
  }
}
