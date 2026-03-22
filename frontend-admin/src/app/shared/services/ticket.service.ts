import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import {
  Ticket,
  TicketFilters,
  CreateTicketRequest,
  CannedResponse,
  TicketStatus,
  TicketPriority
} from '../models/ticket.model';
import { PagedResponse } from '../models/tenant.model';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tickets`;

  getTickets(filters: TicketFilters): Observable<PagedResponse<Ticket>> {
    let params = new HttpParams()
      .set('page', filters.page.toString())
      .set('size', filters.size.toString());

    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.priority) params = params.set('priority', filters.priority);
    if (filters.assignedTo) params = params.set('assignedTo', filters.assignedTo);
    if (filters.tenantId) params = params.set('tenantId', filters.tenantId);

    return this.http.get<PagedResponse<Ticket>>(this.apiUrl, { params });
  }

  getTicketById(id: string): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/${id}`);
  }

  createTicket(request: CreateTicketRequest): Observable<Ticket> {
    return this.http.post<Ticket>(this.apiUrl, request);
  }

  updateTicketStatus(id: string, status: TicketStatus): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.apiUrl}/${id}`, { status });
  }

  updateTicketPriority(id: string, priority: TicketPriority): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.apiUrl}/${id}`, { priority });
  }

  assignTicket(id: string, assignedTo: string): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.apiUrl}/${id}`, { assignedTo });
  }

  addResponse(id: string, content: string, isInternal = false): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.apiUrl}/${id}/respond`, { content, isInternal });
  }

  escalateTicket(id: string, reason: string): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.apiUrl}/${id}/escalate`, { reason });
  }

  getCannedResponses(): Observable<CannedResponse[]> {
    return this.http.get<CannedResponse[]>(`${environment.apiUrl}/canned-responses`);
  }

  createCannedResponse(response: Omit<CannedResponse, 'id' | 'createdBy' | 'createdAt'>): Observable<CannedResponse> {
    return this.http.post<CannedResponse>(`${environment.apiUrl}/canned-responses`, response);
  }

  deleteCannedResponse(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/canned-responses/${id}`);
  }

  getTicketStats(): Observable<{
    open: number;
    inProgress: number;
    waitingOnCustomer: number;
    resolved: number;
    avgResolutionTime: number;
    slaBreachRate: number;
  }> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }

  searchTickets(query: string, limit = 5): Observable<Ticket[]> {
    const params = new HttpParams()
      .set('search', query)
      .set('page', '0')
      .set('size', limit.toString());
    return this.http.get<PagedResponse<Ticket>>(this.apiUrl, { params })
      .pipe(map(response => response.content));
  }

  updateCannedResponse(id: string, response: Omit<CannedResponse, 'id' | 'createdBy' | 'createdAt'>): Observable<CannedResponse> {
    return this.http.patch<CannedResponse>(`${environment.apiUrl}/canned-responses/${id}`, response);
  }

  mergeTickets(targetId: string, sourceId: string): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.apiUrl}/${targetId}/merge`, { sourceTicketId: sourceId });
  }
}
