import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '@env/environment';
import { PagedResponse } from '../models/tenant.model';

export interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  readAt?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export type NotificationType =
  | 'TENANT_SIGNUP'
  | 'TICKET_CREATED'
  | 'TICKET_ESCALATED'
  | 'PAYMENT_FAILED'
  | 'TRIAL_EXPIRING'
  | 'CHURN_RISK'
  | 'SLA_BREACH'
  | 'SYSTEM';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;

  private notificationsSignal = signal<AdminNotification[]>([]);
  private unreadCountSignal = signal<number>(0);

  readonly notifications = this.notificationsSignal.asReadonly();
  readonly unreadCount = this.unreadCountSignal.asReadonly();
  readonly hasUnread = computed(() => this.unreadCountSignal() > 0);

  constructor(private http: HttpClient) {}

  loadNotifications(page = 0, size = 10): Observable<PagedResponse<AdminNotification>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PagedResponse<AdminNotification>>(this.apiUrl, { params }).pipe(
      tap(response => {
        if (page === 0) {
          this.notificationsSignal.set(response.content);
        } else {
          this.notificationsSignal.update(current => [...current, ...response.content]);
        }
      })
    );
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/unread-count`).pipe(
      tap(response => this.unreadCountSignal.set(response.count))
    );
  }

  markAsRead(id: string): Observable<AdminNotification> {
    return this.http.post<AdminNotification>(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(updated => {
        this.notificationsSignal.update(notifications =>
          notifications.map(n => n.id === id ? updated : n)
        );
        this.unreadCountSignal.update(count => Math.max(0, count - 1));
      })
    );
  }

  markAllAsRead(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => {
        this.notificationsSignal.update(notifications =>
          notifications.map(n => ({ ...n, readAt: new Date().toISOString() }))
        );
        this.unreadCountSignal.set(0);
      })
    );
  }

  addNotification(notification: AdminNotification): void {
    this.notificationsSignal.update(current => [notification, ...current]);
    if (!notification.readAt) {
      this.unreadCountSignal.update(count => count + 1);
    }
  }
}
