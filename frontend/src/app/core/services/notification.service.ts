import { Injectable, inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject, timer, of } from 'rxjs';
import { map, takeUntil, catchError, tap, retry, switchMap } from 'rxjs/operators';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { AuthService } from './auth.service';

/**
 * Notification types matching backend enum.
 */
export type NotificationType =
  | 'LEAVE_SUBMITTED' | 'LEAVE_APPROVED' | 'LEAVE_REJECTED' | 'LEAVE_CANCELLED'
  | 'PAYSLIP_READY' | 'PAYROLL_PROCESSED'
  | 'DOCUMENT_UPLOADED' | 'DOCUMENT_EXPIRING' | 'DOCUMENT_SHARED'
  | 'TICKET_CREATED' | 'TICKET_UPDATED' | 'TICKET_RESOLVED' | 'TICKET_ASSIGNED'
  | 'APPLICATION_RECEIVED' | 'INTERVIEW_SCHEDULED' | 'OFFER_EXTENDED'
  | 'SYSTEM_ANNOUNCEMENT' | 'ACCOUNT_UPDATED' | 'PASSWORD_CHANGED';

/**
 * Notification model matching backend DTO.
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceType?: string;
  referenceId?: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

/**
 * Paginated response for notifications.
 */
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

/**
 * Icon mapping for notification types.
 */
export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  LEAVE_SUBMITTED: 'event_note',
  LEAVE_APPROVED: 'check_circle',
  LEAVE_REJECTED: 'cancel',
  LEAVE_CANCELLED: 'event_busy',
  PAYSLIP_READY: 'receipt_long',
  PAYROLL_PROCESSED: 'payments',
  DOCUMENT_UPLOADED: 'upload_file',
  DOCUMENT_EXPIRING: 'warning',
  DOCUMENT_SHARED: 'share',
  TICKET_CREATED: 'confirmation_number',
  TICKET_UPDATED: 'chat',
  TICKET_RESOLVED: 'task_alt',
  TICKET_ASSIGNED: 'assignment_ind',
  APPLICATION_RECEIVED: 'person_add',
  INTERVIEW_SCHEDULED: 'event',
  OFFER_EXTENDED: 'local_offer',
  SYSTEM_ANNOUNCEMENT: 'campaign',
  ACCOUNT_UPDATED: 'manage_accounts',
  PASSWORD_CHANGED: 'lock'
};

/**
 * Color mapping for notification types.
 */
export const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  LEAVE_APPROVED: 'text-success-500',
  LEAVE_REJECTED: 'text-error-500',
  LEAVE_SUBMITTED: 'text-primary-500',
  LEAVE_CANCELLED: 'text-warning-500',
  PAYSLIP_READY: 'text-success-500',
  PAYROLL_PROCESSED: 'text-primary-500',
  DOCUMENT_UPLOADED: 'text-primary-500',
  DOCUMENT_EXPIRING: 'text-warning-500',
  DOCUMENT_SHARED: 'text-primary-500',
  TICKET_CREATED: 'text-primary-500',
  TICKET_UPDATED: 'text-primary-500',
  TICKET_RESOLVED: 'text-success-500',
  TICKET_ASSIGNED: 'text-primary-500',
  APPLICATION_RECEIVED: 'text-primary-500',
  INTERVIEW_SCHEDULED: 'text-primary-500',
  OFFER_EXTENDED: 'text-success-500',
  SYSTEM_ANNOUNCEMENT: 'text-primary-500',
  ACCOUNT_UPDATED: 'text-primary-500',
  PASSWORD_CHANGED: 'text-warning-500'
};

/**
 * Centralized styles for notification types.
 * Single source of truth for icon colors and background colors.
 */
export const NOTIFICATION_STYLES: Record<NotificationType, { iconColor: string; bgColor: string }> = {
  LEAVE_SUBMITTED: {
    iconColor: 'text-primary-600 dark:text-primary-400',
    bgColor: 'bg-primary-100 dark:bg-primary-900/30'
  },
  LEAVE_APPROVED: {
    iconColor: 'text-success-600 dark:text-success-400',
    bgColor: 'bg-success-100 dark:bg-success-900/30'
  },
  LEAVE_REJECTED: {
    iconColor: 'text-error-600 dark:text-error-400',
    bgColor: 'bg-error-100 dark:bg-error-900/30'
  },
  LEAVE_CANCELLED: {
    iconColor: 'text-warning-600 dark:text-warning-400',
    bgColor: 'bg-warning-100 dark:bg-warning-900/30'
  },
  PAYSLIP_READY: {
    iconColor: 'text-success-600 dark:text-success-400',
    bgColor: 'bg-success-100 dark:bg-success-900/30'
  },
  PAYROLL_PROCESSED: {
    iconColor: 'text-primary-600 dark:text-primary-400',
    bgColor: 'bg-primary-100 dark:bg-primary-900/30'
  },
  DOCUMENT_UPLOADED: {
    iconColor: 'text-primary-600 dark:text-primary-400',
    bgColor: 'bg-primary-100 dark:bg-primary-900/30'
  },
  DOCUMENT_EXPIRING: {
    iconColor: 'text-warning-600 dark:text-warning-400',
    bgColor: 'bg-warning-100 dark:bg-warning-900/30'
  },
  DOCUMENT_SHARED: {
    iconColor: 'text-primary-600 dark:text-primary-400',
    bgColor: 'bg-primary-100 dark:bg-primary-900/30'
  },
  TICKET_CREATED: {
    iconColor: 'text-primary-600 dark:text-primary-400',
    bgColor: 'bg-primary-100 dark:bg-primary-900/30'
  },
  TICKET_UPDATED: {
    iconColor: 'text-primary-600 dark:text-primary-400',
    bgColor: 'bg-primary-100 dark:bg-primary-900/30'
  },
  TICKET_RESOLVED: {
    iconColor: 'text-success-600 dark:text-success-400',
    bgColor: 'bg-success-100 dark:bg-success-900/30'
  },
  TICKET_ASSIGNED: {
    iconColor: 'text-primary-600 dark:text-primary-400',
    bgColor: 'bg-primary-100 dark:bg-primary-900/30'
  },
  APPLICATION_RECEIVED: {
    iconColor: 'text-primary-600 dark:text-primary-400',
    bgColor: 'bg-primary-100 dark:bg-primary-900/30'
  },
  INTERVIEW_SCHEDULED: {
    iconColor: 'text-primary-600 dark:text-primary-400',
    bgColor: 'bg-primary-100 dark:bg-primary-900/30'
  },
  OFFER_EXTENDED: {
    iconColor: 'text-success-600 dark:text-success-400',
    bgColor: 'bg-success-100 dark:bg-success-900/30'
  },
  SYSTEM_ANNOUNCEMENT: {
    iconColor: 'text-primary-600 dark:text-primary-400',
    bgColor: 'bg-primary-100 dark:bg-primary-900/30'
  },
  ACCOUNT_UPDATED: {
    iconColor: 'text-primary-600 dark:text-primary-400',
    bgColor: 'bg-primary-100 dark:bg-primary-900/30'
  },
  PASSWORD_CHANGED: {
    iconColor: 'text-warning-600 dark:text-warning-400',
    bgColor: 'bg-warning-100 dark:bg-warning-900/30'
  }
};

/**
 * Service for managing user notifications with REST API and WebSocket support.
 *
 * WebSocket connection uses STOMP over SockJS for real-time notification delivery.
 * The backend expects either JWT token or X-User-* headers for authentication.
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  // API URL (goes through Angular proxy)
  private readonly apiUrl = '/api/notifications';
  private readonly wsUrl = '/ws/notifications';

  // STOMP client for WebSocket
  private stompClient: Client | null = null;
  private destroy$ = new Subject<void>();

  // State management
  private _notifications$ = new BehaviorSubject<Notification[]>([]);
  private _unreadCount$ = new BehaviorSubject<number>(0);
  private _connected$ = new BehaviorSubject<boolean>(false);

  // Public observables
  notifications$ = this._notifications$.asObservable();
  unreadCount$ = this._unreadCount$.asObservable();
  connected$ = this._connected$.asObservable();

  // Reconnection settings
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;  // 5 seconds between reconnects
  initialized = false;  // Public so components can check connection status
  private isConnecting = false;  // Prevent multiple simultaneous connection attempts

  constructor() {
    // Don't auto-initialize in constructor - let the shell component handle it
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }

  /**
   * Initialize the notification service.
   * Loads initial data and connects to WebSocket.
   * Can be called multiple times - will reinitialize if user changed.
   */
  initialize(): void {
    // Only initialize if user is authenticated
    if (!this.authService.isAuthenticated()) {
      console.log('[NotificationService] Not authenticated, skipping initialization');
      return;
    }

    // If already initialized and connected, just refresh data
    if (this.initialized && this._connected$.value) {
      console.log('[NotificationService] Already connected, refreshing data');
      this.loadRecentNotifications();
      this.loadUnreadCount();
      return;
    }

    this.initialized = true;
    console.log('[NotificationService] Initializing...');

    // Load initial data
    this.loadRecentNotifications();
    this.loadUnreadCount();

    // Connect to WebSocket
    this.connect();
  }

  /**
   * Reset and reinitialize the service (e.g., after login).
   */
  reinitialize(): void {
    console.log('[NotificationService] Reinitializing...');
    this.disconnect();
    this.initialized = false;
    this.reconnectAttempts = 0;
    this._notifications$.next([]);
    this._unreadCount$.next(0);
    this.initialize();
  }

  /**
   * Get paginated notifications.
   */
  getNotifications(page = 0, size = 20): Observable<PageResponse<Notification>> {
    return this.http.get<PageResponse<Notification>>(`${this.apiUrl}`, {
      params: { page: page.toString(), size: size.toString() }
    });
  }

  /**
   * Get recent notifications (for dropdown).
   */
  getRecentNotifications(limit = 10): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/recent`, {
      params: { limit: limit.toString() }
    });
  }

  /**
   * Load recent notifications into state.
   */
  loadRecentNotifications(): void {
    this.getRecentNotifications(10)
      .pipe(
        catchError(() => of([])),
        takeUntil(this.destroy$)
      )
      .subscribe(notifications => {
        this._notifications$.next(notifications);
      });
  }

  /**
   * Get unread notification count.
   */
  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/unread-count`);
  }

  /**
   * Load unread count into state.
   */
  loadUnreadCount(): void {
    this.getUnreadCount()
      .pipe(
        catchError(() => of({ count: 0 })),
        takeUntil(this.destroy$)
      )
      .subscribe(response => {
        this._unreadCount$.next(response.count);
      });
  }

  /**
   * Get a single notification.
   */
  getNotification(id: string): Observable<Notification> {
    return this.http.get<Notification>(`${this.apiUrl}/${id}`);
  }

  /**
   * Mark a notification as read.
   */
  markAsRead(id: string): Observable<Notification> {
    return this.http.patch<Notification>(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(notification => {
        // Update local state
        const current = this._notifications$.value;
        const index = current.findIndex(n => n.id === id);
        if (index >= 0) {
          current[index] = notification;
          this._notifications$.next([...current]);
        }
        // Decrement unread count
        const count = this._unreadCount$.value;
        if (count > 0) {
          this._unreadCount$.next(count - 1);
        }
      })
    );
  }

  /**
   * Mark all notifications as read.
   */
  markAllAsRead(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/mark-all-read`, {}).pipe(
      tap(() => {
        // Update local state
        const current = this._notifications$.value.map(n => ({ ...n, read: true }));
        this._notifications$.next(current);
        this._unreadCount$.next(0);
      })
    );
  }

  /**
   * Delete a notification.
   */
  deleteNotification(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        // Update local state
        const current = this._notifications$.value.filter(n => n.id !== id);
        this._notifications$.next(current);
      })
    );
  }

  /**
   * Create a test notification (development only).
   */
  createTestNotification(): Observable<Notification> {
    return this.http.post<Notification>(`${this.apiUrl}/test`, {});
  }

  /**
   * Connect to WebSocket for real-time notifications.
   * Uses STOMP over SockJS with JWT authentication.
   */
  connect(): void {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      console.log('[NotificationService] Connection already in progress');
      return;
    }

    if (this.stompClient?.connected) {
      console.log('[NotificationService] Already connected to WebSocket');
      return;
    }

    // If there's an existing client that's not connected, deactivate it first
    if (this.stompClient) {
      console.log('[NotificationService] Cleaning up previous connection');
      try {
        this.stompClient.deactivate();
      } catch (e) {
        console.warn('[NotificationService] Error deactivating old client:', e);
      }
      this.stompClient = null;
    }

    const token = this.authService.getAccessToken();
    if (!token) {
      console.warn('[NotificationService] No access token, cannot connect to WebSocket');
      return;
    }

    this.isConnecting = true;
    const wsEndpoint = this.getWebSocketUrl();
    const connectHeaders = this.buildConnectHeaders(token);

    console.log('[NotificationService] Connecting to WebSocket:', wsEndpoint);

    this.stompClient = new Client({
      // SockJS handles the WebSocket connection with fallback transports
      webSocketFactory: () => new SockJS(wsEndpoint),
      // STOMP connect headers - sent during STOMP CONNECT frame
      connectHeaders,
      // Debug logging - show all messages in development
      debug: (str) => {
        // Log connection-related messages and errors
        if (str.includes('CONNECT') || str.includes('CONNECTED') ||
            str.includes('ERROR') || str.includes('SUBSCRIBE') ||
            str.includes('DISCONNECT')) {
          console.log('[STOMP]', str);
        }
      },
      // Disable built-in reconnect - we handle it ourselves
      reconnectDelay: 0,
      // Heartbeat to detect dead connections (must match server)
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: (frame) => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this._connected$.next(true);
        console.log('[NotificationService] WebSocket connected successfully');
        console.log('[NotificationService] Session:', frame.headers['session']);
        this.subscribeToNotifications();
      },
      onDisconnect: () => {
        this.isConnecting = false;
        this._connected$.next(false);
        console.log('[NotificationService] WebSocket disconnected');
      },
      onStompError: (frame) => {
        this.isConnecting = false;
        console.error('[NotificationService] STOMP error:', frame.headers['message']);
        console.error('[NotificationService] STOMP error details:', frame.body);
        this._connected$.next(false);
        this.handleReconnect();
      },
      onWebSocketError: (event) => {
        this.isConnecting = false;
        console.error('[NotificationService] WebSocket error:', event);
        this._connected$.next(false);
        this.handleReconnect();
      },
      onWebSocketClose: (event) => {
        this.isConnecting = false;
        console.log('[NotificationService] WebSocket closed:', event.code, event.reason);
        this._connected$.next(false);
        // Only reconnect if this wasn't a clean close and we're still initialized
        if (event.code !== 1000 && this.initialized) {
          this.handleReconnect();
        }
      }
    });

    this.stompClient.activate();
  }

  /**
   * Build STOMP connect headers with authentication.
   * Includes both JWT token and fallback X-User-* headers for development.
   */
  private buildConnectHeaders(token: string | null): Record<string, string> {
    const headers: Record<string, string> = {};

    if (token) {
      // Primary: JWT Bearer token
      headers['Authorization'] = `Bearer ${token}`;

      // Also extract user info from token for X-User-* fallback headers
      // This helps in development when the proxy might not forward all headers
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.sub) {
          headers['X-User-Id'] = payload.sub;
        }
        if (payload.roles && Array.isArray(payload.roles)) {
          headers['X-User-Roles'] = payload.roles.join(',');
        }
        if (payload.username) {
          headers['X-User-Username'] = payload.username;
        }
        console.log('[NotificationService] Extracted user ID from token:', payload.sub);
      } catch (e) {
        console.warn('[NotificationService] Could not parse JWT token:', e);
      }
    } else {
      console.warn('[NotificationService] No access token available for WebSocket connection');
    }

    return headers;
  }

  /**
   * Disconnect from WebSocket.
   */
  disconnect(): void {
    this.isConnecting = false;
    if (this.stompClient) {
      try {
        this.stompClient.deactivate();
      } catch (e) {
        console.warn('[NotificationService] Error during disconnect:', e);
      }
      this.stompClient = null;
      this._connected$.next(false);
    }
  }

  /**
   * Subscribe to notification topics.
   *
   * User-specific topics use /user prefix which Spring routes to /user/{userId}/queue/...
   * where {userId} comes from Principal.getName() on the authenticated session.
   */
  private subscribeToNotifications(): void {
    if (!this.stompClient?.connected) {
      console.warn('[NotificationService] Cannot subscribe - not connected');
      return;
    }

    console.log('[NotificationService] Subscribing to notification topics...');

    // Subscribe to user-specific notifications
    // Spring routes /user/queue/notifications to /user/{userId}/queue/notifications
    // where {userId} is from Principal.getName() (the user's UUID)
    const userSub = this.stompClient.subscribe('/user/queue/notifications', (message: IMessage) => {
      console.log('[NotificationService] Received user notification');
      this.handleIncomingNotification(message);
    });
    console.log('[NotificationService] Subscribed to /user/queue/notifications (id:', userSub.id, ')');

    // Subscribe to broadcast notifications (all users)
    const broadcastSub = this.stompClient.subscribe('/topic/notifications', (message: IMessage) => {
      console.log('[NotificationService] Received broadcast notification');
      this.handleIncomingNotification(message);
    });
    console.log('[NotificationService] Subscribed to /topic/notifications (id:', broadcastSub.id, ')');

    // Subscribe to unread count updates
    const countSub = this.stompClient.subscribe('/user/queue/notifications/count', (message: IMessage) => {
      try {
        const data = JSON.parse(message.body);
        console.log('[NotificationService] Received unread count update:', data.count);
        this._unreadCount$.next(data.count);
      } catch (e) {
        console.error('[NotificationService] Failed to parse count message:', e);
      }
    });
    console.log('[NotificationService] Subscribed to /user/queue/notifications/count (id:', countSub.id, ')');

    console.log('[NotificationService] All subscriptions active');
  }

  /**
   * Handle incoming notification from WebSocket.
   */
  private handleIncomingNotification(message: IMessage): void {
    try {
      const notification: Notification = JSON.parse(message.body);

      // Add to the beginning of the list
      const current = this._notifications$.value;
      this._notifications$.next([notification, ...current.slice(0, 9)]);

      // Increment unread count
      this._unreadCount$.next(this._unreadCount$.value + 1);

      console.log('[NotificationService] Received notification:', notification.title);
    } catch (e) {
      console.error('[NotificationService] Failed to parse notification:', e);
    }
  }

  /**
   * Handle reconnection attempts with exponential backoff.
   */
  private handleReconnect(): void {
    // Don't reconnect if we're already connecting or not initialized
    if (this.isConnecting || !this.initialized) {
      return;
    }

    // Don't reconnect if we're not authenticated
    if (!this.authService.isAuthenticated()) {
      console.log('[NotificationService] Not authenticated, skipping reconnect');
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[NotificationService] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    // Exponential backoff: 5s, 10s, 20s, 40s, 80s
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[NotificationService] Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);

    timer(delay)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.initialized && !this._connected$.value && !this.isConnecting) {
          console.log(`[NotificationService] Reconnection attempt ${this.reconnectAttempts}`);
          this.connect();
        }
      });
  }

  /**
   * Get WebSocket URL based on environment.
   *
   * In development: Uses the Angular proxy which routes /ws/notifications to localhost:8090
   * In production: Uses the same host as the app
   *
   * SockJS requires an HTTP URL (not ws://), it handles the upgrade internally.
   */
  private getWebSocketUrl(): string {
    // SockJS needs HTTP URL, not WS URL - it handles the WebSocket upgrade
    // For both development and production, use the current origin with the ws path
    // The Angular dev server proxy will route this to the notification service
    const baseUrl = window.location.origin;
    const url = `${baseUrl}${this.wsUrl}`;

    console.log('[NotificationService] WebSocket URL:', url);
    return url;
  }

  /**
   * Get icon for a notification type.
   */
  getIcon(type: NotificationType): string {
    return NOTIFICATION_ICONS[type] || 'notifications';
  }

  /**
   * Get color class for a notification type.
   */
  getColorClass(type: NotificationType): string {
    return NOTIFICATION_COLORS[type] || 'text-neutral-500';
  }

  /**
   * Format relative time for notification.
   */
  formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}
