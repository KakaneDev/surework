import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import {
  Tenant,
  TenantActivity,
  TenantStats,
  TenantFilters,
  TenantStatus,
  PagedResponse
} from '../models/tenant.model';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tenants`;

  getTenants(filters: TenantFilters): Observable<PagedResponse<Tenant>> {
    let params = new HttpParams()
      .set('page', filters.page.toString())
      .set('size', filters.size.toString());

    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.plan) params = params.set('plan', filters.plan);
    if (filters.churnRisk) params = params.set('churnRisk', filters.churnRisk);
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortDirection) params = params.set('sortDirection', filters.sortDirection);

    return this.http.get<PagedResponse<Tenant>>(this.apiUrl, { params });
  }

  getTenantById(id: string): Observable<Tenant> {
    return this.http.get<Tenant>(`${this.apiUrl}/${id}`);
  }

  updateTenantStatus(id: string, status: TenantStatus): Observable<Tenant> {
    return this.http.patch<Tenant>(`${this.apiUrl}/${id}/status`, { status });
  }

  getTenantActivity(id: string, page = 0, size = 20): Observable<PagedResponse<TenantActivity>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PagedResponse<TenantActivity>>(`${this.apiUrl}/${id}/activity`, { params });
  }

  getTenantStats(): Observable<TenantStats> {
    return this.http.get<TenantStats>(`${this.apiUrl}/stats`);
  }

  impersonateTenant(id: string): Observable<{ token: string; url: string }> {
    return this.http.post<{ token: string; url: string }>(`${this.apiUrl}/${id}/impersonate`, {});
  }

  sendVerificationReminder(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/send-verification`, {});
  }

  manualVerify(id: string): Observable<Tenant> {
    return this.http.post<Tenant>(`${this.apiUrl}/${id}/verify`, {});
  }

  searchTenants(query: string, limit = 5): Observable<Tenant[]> {
    const params = new HttpParams()
      .set('search', query)
      .set('page', '0')
      .set('size', limit.toString());
    return this.http.get<PagedResponse<Tenant>>(`${this.apiUrl}/search`, { params })
      .pipe(map(response => response.content));
  }

  getStuckOnboarding(page = 0, size = 20, daysStuck = 3): Observable<PagedResponse<Tenant>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('daysStuck', daysStuck.toString());
    return this.http.get<PagedResponse<Tenant>>(`${this.apiUrl}/stuck-onboarding`, { params });
  }

  sendOnboardingHelp(tenantId: string, message: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${tenantId}/send-onboarding-help`, { message });
  }
}
