import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type TicketCategory =
  | 'HR_REQUESTS'
  | 'PAYROLL_BENEFITS'
  | 'LEAVE_ATTENDANCE'
  | 'IT_SUPPORT'
  | 'FACILITIES'
  | 'FINANCE'
  | 'OTHER';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TicketStatus = 'NEW' | 'IN_PROGRESS' | 'PENDING' | 'RESOLVED' | 'CLOSED';

export interface CategoryResponse {
  id: string;
  code: string;
  name: string;
  description: string;
  assignedTeam: string;
  subcategories: string[];
  displayOrder: number;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  content: string;
  authorUserId: string;
  authorName: string;
  authorRole: 'requester' | 'agent';
  internal: boolean;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketReference: string;
  category: CategoryResponse;
  subcategory?: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  requesterUserId: string;
  requesterName: string;
  requesterEmail?: string;
  assignedTeam: string;
  assignedUserId?: string;
  assignedUserName?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  resolutionNotes?: string;
  slaDeadline?: string;
  comments: TicketComment[];
}

export interface TicketSummary {
  id: string;
  ticketReference: string;
  categoryName: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  requesterName: string;
  assignedTeam: string;
  assignedUserName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketRequest {
  categoryCode: TicketCategory;
  subcategory?: string;
  subject: string;
  description: string;
  priority: TicketPriority;
}

export interface AddCommentRequest {
  content: string;
  internal?: boolean;
}

export interface TicketListParams {
  status?: TicketStatus | 'open' | 'resolved' | 'all';
  page?: number;
  size?: number;
}

export interface TicketStats {
  open: number;
  pending: number;
  resolved: number;
  total: number;
  avgResolutionTimeHours: number;
}

export interface AdminTicketStats {
  newTickets: number;
  inProgress: number;
  pending: number;
  resolvedToday: number;
  totalOpen: number;
  totalClosed: number;
  avgResolutionTimeHours: number;
  overdueTickets: number;
}

export interface AdminSearchParams {
  status?: TicketStatus;
  priority?: TicketPriority;
  team?: string;
  category?: string;
  search?: string;
  page?: number;
  size?: number;
}

export interface AssignTicketRequest {
  assignToUserId?: string;
  assignToUserName?: string;
  assignedTeam?: string;
}

export interface ResolveTicketRequest {
  resolutionNotes: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SupportService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/support';

  // === Category Operations ===

  /**
   * Get list of active ticket categories
   */
  getCategories(): Observable<CategoryResponse[]> {
    return this.http.get<CategoryResponse[]>(`${this.baseUrl}/categories`);
  }

  // === Self-Service Operations ===

  /**
   * Get list of tickets for the current user
   */
  getMyTickets(params?: TicketListParams): Observable<PageResponse<TicketSummary>> {
    let httpParams = new HttpParams();

    if (params?.status && params.status !== 'all') {
      httpParams = httpParams.set('status', params.status);
    }
    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }

    return this.http.get<PageResponse<TicketSummary>>(`${this.baseUrl}/my-tickets`, { params: httpParams });
  }

  /**
   * Get a single ticket by ID
   */
  getTicket(id: string): Observable<SupportTicket> {
    return this.http.get<SupportTicket>(`${this.baseUrl}/tickets/${id}`);
  }

  /**
   * Create a new support ticket
   */
  createTicket(request: CreateTicketRequest): Observable<SupportTicket> {
    return this.http.post<SupportTicket>(`${this.baseUrl}/tickets`, request);
  }

  /**
   * Add a comment to a ticket
   */
  addComment(ticketId: string, request: AddCommentRequest): Observable<TicketComment> {
    return this.http.post<TicketComment>(`${this.baseUrl}/tickets/${ticketId}/comments`, request);
  }

  /**
   * Close a ticket
   */
  closeTicket(id: string): Observable<SupportTicket> {
    return this.http.post<SupportTicket>(`${this.baseUrl}/tickets/${id}/close`, {});
  }

  /**
   * Reopen a resolved/closed ticket
   */
  reopenTicket(id: string): Observable<SupportTicket> {
    return this.http.post<SupportTicket>(`${this.baseUrl}/tickets/${id}/reopen`, {});
  }

  /**
   * Get ticket statistics for the current user
   */
  getTicketStats(): Observable<TicketStats> {
    return this.http.get<TicketStats>(`${this.baseUrl}/my-tickets/stats`);
  }

  // === Admin Operations ===

  /**
   * Search tickets (admin only)
   */
  searchTickets(params?: AdminSearchParams): Observable<PageResponse<TicketSummary>> {
    let httpParams = new HttpParams();

    if (params?.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params?.priority) {
      httpParams = httpParams.set('priority', params.priority);
    }
    if (params?.team) {
      httpParams = httpParams.set('team', params.team);
    }
    if (params?.category) {
      httpParams = httpParams.set('category', params.category);
    }
    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }

    return this.http.get<PageResponse<TicketSummary>>(`${this.baseUrl}/admin/tickets`, { params: httpParams });
  }

  /**
   * Get ticket details (admin)
   */
  getTicketAdmin(id: string): Observable<SupportTicket> {
    return this.http.get<SupportTicket>(`${this.baseUrl}/admin/tickets/${id}`);
  }

  /**
   * Get admin statistics
   */
  getAdminStats(): Observable<AdminTicketStats> {
    return this.http.get<AdminTicketStats>(`${this.baseUrl}/admin/tickets/stats`);
  }

  /**
   * Assign a ticket to a user or team
   */
  assignTicket(ticketId: string, request: AssignTicketRequest): Observable<SupportTicket> {
    return this.http.post<SupportTicket>(`${this.baseUrl}/admin/tickets/${ticketId}/assign`, request);
  }

  /**
   * Resolve a ticket (admin)
   */
  resolveTicket(ticketId: string, request: ResolveTicketRequest): Observable<SupportTicket> {
    return this.http.post<SupportTicket>(`${this.baseUrl}/admin/tickets/${ticketId}/resolve`, request);
  }

  /**
   * Add agent comment to a ticket
   */
  addAgentComment(ticketId: string, request: AddCommentRequest): Observable<TicketComment> {
    return this.http.post<TicketComment>(`${this.baseUrl}/admin/tickets/${ticketId}/comments`, request);
  }

  // === Helper Methods ===

  /**
   * Get assigned team for a category
   */
  getAssignedTeam(category: TicketCategory): string {
    const teamMap: Record<TicketCategory, string> = {
      HR_REQUESTS: 'HR Team',
      PAYROLL_BENEFITS: 'Payroll Team',
      LEAVE_ATTENDANCE: 'Leave Admin',
      IT_SUPPORT: 'IT Team',
      FACILITIES: 'Facilities Team',
      FINANCE: 'Finance Team',
      OTHER: 'General Admin'
    };
    return teamMap[category];
  }
}
