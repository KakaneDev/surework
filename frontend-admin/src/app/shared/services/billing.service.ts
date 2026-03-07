import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  RevenueMetrics,
  RevenueProjection,
  Payment,
  Discount,
  CreateDiscountRequest,
  TenantDiscount,
  Invoice
} from '../models/billing.model';
import { PagedResponse } from '../models/tenant.model';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/billing`;

  getRevenueMetrics(): Observable<RevenueMetrics> {
    return this.http.get<RevenueMetrics>(`${this.apiUrl}/revenue`);
  }

  getRevenueProjections(months = 12): Observable<RevenueProjection[]> {
    const params = new HttpParams().set('months', months.toString());
    return this.http.get<RevenueProjection[]>(`${this.apiUrl}/projections`, { params });
  }

  getPayments(page = 0, size = 20, status?: string): Observable<PagedResponse<Payment>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status) params = params.set('status', status);

    return this.http.get<PagedResponse<Payment>>(`${this.apiUrl}/payments`, { params });
  }

  retryPayment(paymentId: string): Observable<Payment> {
    return this.http.post<Payment>(`${this.apiUrl}/payments/${paymentId}/retry`, {});
  }

  getDiscounts(page = 0, size = 20): Observable<PagedResponse<Discount>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PagedResponse<Discount>>(`${environment.apiUrl}/discounts`, { params });
  }

  getDiscountById(id: string): Observable<Discount> {
    return this.http.get<Discount>(`${environment.apiUrl}/discounts/${id}`);
  }

  createDiscount(request: CreateDiscountRequest): Observable<Discount> {
    return this.http.post<Discount>(`${environment.apiUrl}/discounts`, request);
  }

  updateDiscount(id: string, request: Partial<CreateDiscountRequest>): Observable<Discount> {
    return this.http.patch<Discount>(`${environment.apiUrl}/discounts/${id}`, request);
  }

  disableDiscount(id: string): Observable<Discount> {
    return this.http.post<Discount>(`${environment.apiUrl}/discounts/${id}/disable`, {});
  }

  applyDiscountToTenant(discountId: string, tenantId: string): Observable<TenantDiscount> {
    return this.http.post<TenantDiscount>(`${environment.apiUrl}/discounts/${discountId}/apply`, { tenantId });
  }

  getTenantDiscounts(tenantId: string): Observable<TenantDiscount[]> {
    return this.http.get<TenantDiscount[]>(`${environment.apiUrl}/tenants/${tenantId}/discounts`);
  }

  getInvoices(tenantId?: string, page = 0, size = 20): Observable<PagedResponse<Invoice>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (tenantId) params = params.set('tenantId', tenantId);

    return this.http.get<PagedResponse<Invoice>>(`${this.apiUrl}/invoices`, { params });
  }

  generateInvoice(tenantId: string): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.apiUrl}/invoices`, { tenantId });
  }
}
