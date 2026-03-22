import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Tenant, PagedResponse } from '../models/tenant.model';

export interface TrialTenant extends Tenant {
  daysRemaining: number;
  trialStartDate: string;
}

export interface TrialStats {
  activeTrials: number;
  expiringThisWeek: number;
  conversionRate: number;
  avgTrialDuration: number;
}

export interface TrialConversionFunnel {
  stage: string;
  count: number;
  percentage: number;
}

@Injectable({ providedIn: 'root' })
export class TrialService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/trials`;

  getActiveTrials(page = 0, size = 20, expiringDays?: number): Observable<PagedResponse<TrialTenant>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (expiringDays !== undefined) {
      params = params.set('expiringWithinDays', expiringDays.toString());
    }

    return this.http.get<PagedResponse<TrialTenant>>(this.apiUrl, { params });
  }

  getTrialStats(): Observable<TrialStats> {
    return this.http.get<TrialStats>(`${this.apiUrl}/stats`);
  }

  getConversionFunnel(): Observable<TrialConversionFunnel[]> {
    return this.http.get<TrialConversionFunnel[]>(`${this.apiUrl}/funnel`);
  }

  extendTrial(tenantId: string, days: number): Observable<TrialTenant> {
    return this.http.post<TrialTenant>(`${this.apiUrl}/${tenantId}/extend`, { days });
  }

  convertToPaid(tenantId: string, plan: string): Observable<Tenant> {
    return this.http.post<Tenant>(`${this.apiUrl}/${tenantId}/convert`, { plan });
  }

  sendTrialExpiryReminder(tenantId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${tenantId}/send-reminder`, {});
  }
}
