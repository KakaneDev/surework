import { Injectable, inject, OnDestroy } from '@angular/core';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '@env/environment';
import { AuthService } from './auth.service';

export interface WebSocketEvent {
  type: 'TENANT_SIGNUP' | 'TICKET_CREATED' | 'TICKET_UPDATED' | 'PAYMENT_RECEIVED' |
        'TRIAL_EXPIRING' | 'CHURN_ALERT' | 'SLA_BREACH' | 'SYSTEM_ALERT';
  payload: any;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private authService = inject(AuthService);
  private client: Client | null = null;
  private eventSubject = new Subject<WebSocketEvent>();
  private connectionStatus = new BehaviorSubject<'connected' | 'disconnected' | 'connecting'>('disconnected');

  readonly events$ = this.eventSubject.asObservable();
  readonly connectionStatus$ = this.connectionStatus.asObservable();

  connect(): void {
    if (this.client?.active) return;

    const token = this.authService.getAccessToken();
    if (!token) return;

    this.connectionStatus.next('connecting');

    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: (str) => {
        if (!environment.production) {
          console.log('STOMP:', str);
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });

    this.client.onConnect = () => {
      this.connectionStatus.next('connected');
      this.subscribeToChannels();
    };

    this.client.onDisconnect = () => {
      this.connectionStatus.next('disconnected');
    };

    this.client.onStompError = (frame) => {
      console.error('STOMP error:', frame.headers['message']);
      this.connectionStatus.next('disconnected');
    };

    this.client.activate();
  }

  disconnect(): void {
    if (this.client?.active) {
      this.client.deactivate();
    }
  }

  private subscribeToChannels(): void {
    if (!this.client?.active) return;

    // Subscribe to general activity feed
    this.client.subscribe('/topic/admin/activity', (message: IMessage) => {
      this.handleMessage(message);
    });

    // Subscribe to tickets updates
    this.client.subscribe('/topic/admin/tickets', (message: IMessage) => {
      this.handleMessage(message);
    });

    // Subscribe to critical alerts
    this.client.subscribe('/topic/admin/alerts', (message: IMessage) => {
      this.handleMessage(message);
    });
  }

  private handleMessage(message: IMessage): void {
    try {
      const event: WebSocketEvent = JSON.parse(message.body);
      this.eventSubject.next(event);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  onEvent<T extends WebSocketEvent['type']>(type: T): Observable<WebSocketEvent & { type: T }> {
    return this.events$.pipe(
      filter((event): event is WebSocketEvent & { type: T } => event.type === type)
    );
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.eventSubject.complete();
    this.connectionStatus.complete();
  }
}
