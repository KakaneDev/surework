import {
  Component,
  inject,
  ChangeDetectionStrategy,
  signal,
  computed,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import {
  NotificationService,
  Notification,
  NotificationType
} from '@core/services/notification.service';
import {
  SpinnerComponent,
  DropdownComponent,
  DropdownItemComponent,
  DropdownDividerComponent,
  BadgeComponent
} from '@shared/ui';

/**
 * Type filter group definition.
 */
interface TypeGroup {
  key: string;
  label: string;
  icon: string;
  types: NotificationType[];
}

/**
 * Full-page notifications inbox with filtering, infinite scroll, and management actions.
 */
@Component({
  selector: 'app-notifications-inbox',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    SpinnerComponent,
    DropdownComponent,
    DropdownItemComponent,
    DropdownDividerComponent,
    BadgeComponent
  ],
  template: `
    <div class="max-w-4xl mx-auto">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{{ 'notifications.inbox.title' | translate }}</h1>
          <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {{ unreadCount() > 0 ? (unreadCount() + ' ' + ('notifications.inbox.unread' | translate)) : ('notifications.inbox.caught_up' | translate) }}
          </p>
        </div>
        <button
          *ngIf="unreadCount() > 0"
          type="button"
          (click)="markAllAsRead()"
          [disabled]="markingAllRead()"
          class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors disabled:opacity-50"
        >
          <span class="material-icons text-lg">done_all</span>
          {{ 'notifications.inbox.mark_all_read' | translate }}
        </button>
      </div>

      <!-- Filter Bar -->
      <div class="bg-white dark:bg-dark-surface rounded-lg border border-neutral-200 dark:border-dark-border p-4 mb-4">
        <div class="flex flex-col lg:flex-row lg:items-center gap-4">
          <!-- Type Filter Chips -->
          <div class="flex-1">
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                (click)="clearTypeFilter()"
                [class]="getChipClasses(null)"
              >
                {{ 'notifications.inbox.all' | translate }}
              </button>
              <button
                *ngFor="let group of typeGroups"
                type="button"
                (click)="setTypeFilter(group.key)"
                [class]="getChipClasses(group.key)"
              >
                <span class="material-icons text-sm">{{ group.icon }}</span>
                {{ group.label | translate }}
              </button>
            </div>
          </div>

          <!-- Read Status Filter -->
          <div class="flex items-center gap-3">
            <label class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'notifications.inbox.show' | translate }}:</label>
            <select
              [value]="readFilter()"
              (change)="setReadFilter($any($event.target).value)"
              class="px-3 py-1.5 text-sm border border-neutral-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-elevated text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">{{ 'notifications.inbox.all' | translate }}</option>
              <option value="unread">{{ 'notifications.inbox.unread' | translate }}</option>
              <option value="read">{{ 'notifications.inbox.read' | translate }}</option>
            </select>

            <!-- Clear Filters -->
            <button
              *ngIf="hasActiveFilters()"
              type="button"
              (click)="clearFilters()"
              class="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
            >
              {{ 'notifications.inbox.clear_filters' | translate }}
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State (Initial) -->
      <div *ngIf="loading() && notifications().length === 0" class="flex justify-center py-12">
        <sw-spinner size="lg" />
      </div>

      <!-- Empty State -->
      <div
        *ngIf="!loading() && filteredNotifications().length === 0"
        class="bg-white dark:bg-dark-surface rounded-lg border border-neutral-200 dark:border-dark-border p-12 text-center"
      >
        <span class="material-icons text-6xl text-neutral-300 dark:text-neutral-600 mb-4 block">
          @if (hasActiveFilters()) {
            filter_list_off
          } @else {
            notifications_none
          }
        </span>
        <h3 class="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          @if (hasActiveFilters()) {
            {{ 'notifications.inbox.no_match_filters' | translate }}
          } @else {
            {{ 'notifications.inbox.no_notifications' | translate }}
          }
        </h3>
        <p class="text-neutral-500 dark:text-neutral-400">
          @if (hasActiveFilters()) {
            {{ 'notifications.inbox.adjust_filters' | translate }}
          } @else {
            {{ 'notifications.inbox.all_caught_up' | translate }}
          }
        </p>
        <button
          *ngIf="hasActiveFilters()"
          type="button"
          (click)="clearFilters()"
          class="mt-4 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
        >
          {{ 'notifications.inbox.clear_filters' | translate }}
        </button>
      </div>

      <!-- Notifications List -->
      <div
        *ngIf="filteredNotifications().length > 0"
        class="bg-white dark:bg-dark-surface rounded-lg border border-neutral-200 dark:border-dark-border overflow-hidden"
      >
        <div
          *ngFor="let notification of filteredNotifications(); trackBy: trackByFn"
          class="relative group border-b border-neutral-100 dark:border-dark-border last:border-0"
        >
          <div
            class="flex items-start gap-4 p-4 cursor-pointer transition-colors"
            [ngClass]="notification.read
              ? 'hover:bg-neutral-50 dark:hover:bg-dark-elevated'
              : 'bg-primary-50 dark:bg-primary-900/10 hover:bg-primary-100 dark:hover:bg-primary-900/20'"
            (click)="onNotificationClick(notification)"
          >
            <!-- Icon -->
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              [ngClass]="getIconBackground(notification.type)"
            >
              <span
                class="material-icons text-lg"
                [ngClass]="getIconColor(notification.type)"
              >
                {{ getIcon(notification.type) }}
              </span>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <p
                  class="text-sm text-neutral-900 dark:text-neutral-100"
                  [class.font-semibold]="!notification.read"
                  [class.font-medium]="notification.read"
                >
                  {{ notification.title }}
                </p>
                <span class="text-xs text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
                  {{ formatTime(notification.createdAt) }}
                </span>
              </div>
              <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                {{ notification.message }}
              </p>
              <div class="flex items-center gap-2 mt-2">
                <sw-badge [variant]="getTypeVariant(notification.type)" size="sm" [rounded]="true">
                  {{ getTypeLabel(notification.type) | translate }}
                </sw-badge>
                <span
                  *ngIf="!notification.read"
                  class="w-2 h-2 rounded-full bg-primary-500"
                  [title]="'notifications.inbox.unread' | translate"
                ></span>
              </div>
            </div>

            <!-- Actions Dropdown -->
            <div class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" (click)="$event.stopPropagation()">
              <sw-dropdown align="right">
                <button
                  trigger
                  type="button"
                  class="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded transition-colors"
                >
                  <span class="material-icons">more_vert</span>
                </button>
                <sw-dropdown-item
                  *ngIf="!notification.read"
                  icon="done"
                  (onClick)="markAsRead(notification, $event)"
                >
                  {{ 'notifications.inbox.mark_as_read' | translate }}
                </sw-dropdown-item>
                <sw-dropdown-item
                  *ngIf="notification.referenceType"
                  icon="open_in_new"
                  (onClick)="navigateToReference(notification, $event)"
                >
                  {{ 'notifications.inbox.view_details' | translate }}
                </sw-dropdown-item>
                <sw-dropdown-divider *ngIf="notification.referenceType || !notification.read" />
                <sw-dropdown-item
                  icon="delete"
                  [danger]="true"
                  (onClick)="deleteNotification(notification, $event)"
                >
                  {{ 'notifications.inbox.delete' | translate }}
                </sw-dropdown-item>
              </sw-dropdown>
            </div>
          </div>
        </div>
      </div>

      <!-- Infinite Scroll Trigger -->
      <div #loadMoreTrigger class="py-4">
        <div *ngIf="loadingMore()" class="flex justify-center">
          <sw-spinner size="md" />
        </div>
        <p
          *ngIf="!hasMore() && filteredNotifications().length > 0 && !loadingMore()"
          class="text-center text-sm text-neutral-400 dark:text-neutral-500"
        >
          {{ 'notifications.inbox.reached_end' | translate }}
        </p>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      padding: 1.5rem;
    }

    @media (min-width: 640px) {
      :host {
        padding: 2rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationsInboxComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private destroy$ = new Subject<void>();

  @ViewChild('loadMoreTrigger') loadMoreTrigger!: ElementRef;
  private intersectionObserver!: IntersectionObserver;

  // State
  notifications = signal<Notification[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  hasMore = signal(true);
  pageIndex = signal(0);
  unreadCount = signal(0);
  markingAllRead = signal(false);

  // Filters
  typeFilter = signal<string | null>(null);
  readFilter = signal<'all' | 'read' | 'unread'>('all');

  // Type filter groups
  readonly typeGroups: TypeGroup[] = [
    {
      key: 'leave',
      label: 'notifications.inbox.filter_leave',
      icon: 'event_note',
      types: ['LEAVE_SUBMITTED', 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'LEAVE_CANCELLED']
    },
    {
      key: 'payroll',
      label: 'notifications.inbox.filter_payroll',
      icon: 'payments',
      types: ['PAYSLIP_READY', 'PAYROLL_PROCESSED']
    },
    {
      key: 'documents',
      label: 'notifications.inbox.filter_documents',
      icon: 'folder',
      types: ['DOCUMENT_UPLOADED', 'DOCUMENT_EXPIRING', 'DOCUMENT_SHARED']
    },
    {
      key: 'support',
      label: 'notifications.inbox.filter_support',
      icon: 'support_agent',
      types: ['TICKET_CREATED', 'TICKET_UPDATED', 'TICKET_RESOLVED', 'TICKET_ASSIGNED']
    },
    {
      key: 'recruitment',
      label: 'notifications.inbox.filter_recruitment',
      icon: 'work',
      types: ['APPLICATION_RECEIVED', 'INTERVIEW_SCHEDULED', 'OFFER_EXTENDED']
    },
    {
      key: 'system',
      label: 'notifications.inbox.filter_system',
      icon: 'settings',
      types: ['SYSTEM_ANNOUNCEMENT', 'ACCOUNT_UPDATED', 'PASSWORD_CHANGED']
    }
  ];

  // Computed: filtered notifications
  filteredNotifications = computed(() => {
    let result = this.notifications();

    // Apply type filter
    if (this.typeFilter()) {
      const group = this.typeGroups.find(g => g.key === this.typeFilter());
      if (group) {
        result = result.filter(n => group.types.includes(n.type));
      }
    }

    // Apply read filter
    if (this.readFilter() === 'read') {
      result = result.filter(n => n.read);
    } else if (this.readFilter() === 'unread') {
      result = result.filter(n => !n.read);
    }

    return result;
  });

  // Check if any filters are active
  hasActiveFilters = computed(() => {
    return this.typeFilter() !== null || this.readFilter() !== 'all';
  });

  ngOnInit(): void {
    this.loadNotifications();

    // Subscribe to unread count from service
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadCount.set(count);
      });
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.intersectionObserver?.disconnect();
  }

  private setupIntersectionObserver(): void {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && this.hasMore() && !this.loadingMore() && !this.loading()) {
          this.loadMore();
        }
      },
      { threshold: 0.1 }
    );
    this.intersectionObserver.observe(this.loadMoreTrigger.nativeElement);
  }

  private loadNotifications(): void {
    this.loading.set(true);
    this.pageIndex.set(0);

    this.notificationService.getNotifications(0, 20)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (response) => {
          this.notifications.set(response.content);
          this.hasMore.set(!response.last);
          this.pageIndex.set(response.page);
        },
        error: (error) => {
          console.error('[NotificationsInbox] Failed to load notifications:', error);
        }
      });
  }

  private loadMore(): void {
    if (this.loadingMore() || !this.hasMore()) return;

    this.loadingMore.set(true);
    const nextPage = this.pageIndex() + 1;

    this.notificationService.getNotifications(nextPage, 20)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingMore.set(false))
      )
      .subscribe({
        next: (response) => {
          this.notifications.update(current => [...current, ...response.content]);
          this.hasMore.set(!response.last);
          this.pageIndex.set(response.page);
        },
        error: (error) => {
          console.error('[NotificationsInbox] Failed to load more notifications:', error);
        }
      });
  }

  trackByFn(index: number, notification: Notification): string {
    return notification.id;
  }

  // Filter methods
  setTypeFilter(key: string): void {
    this.typeFilter.set(key);
  }

  clearTypeFilter(): void {
    this.typeFilter.set(null);
  }

  setReadFilter(value: 'all' | 'read' | 'unread'): void {
    this.readFilter.set(value);
  }

  clearFilters(): void {
    this.typeFilter.set(null);
    this.readFilter.set('all');
  }

  getChipClasses(key: string | null): string {
    const base = 'inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-full transition-colors';
    const isActive = this.typeFilter() === key;

    if (isActive) {
      return `${base} bg-primary-600 text-white dark:bg-primary-500`;
    }
    return `${base} bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-dark-elevated dark:text-neutral-300 dark:hover:bg-neutral-700`;
  }

  // Notification actions
  onNotificationClick(notification: Notification): void {
    // Mark as read if unread
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.notifications.update(list =>
            list.map(n => n.id === notification.id ? { ...n, read: true } : n)
          );
        });
    }

    // Navigate to referenced entity if available
    if (notification.referenceType && notification.referenceId) {
      const route = this.getRouteForReference(notification.referenceType, notification.referenceId);
      if (route) {
        this.router.navigate(route);
      }
    }
  }

  markAsRead(notification: Notification, event: MouseEvent): void {
    event.stopPropagation();
    this.notificationService.markAsRead(notification.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.notifications.update(list =>
          list.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
      });
  }

  markAllAsRead(): void {
    this.markingAllRead.set(true);
    this.notificationService.markAllAsRead()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.markingAllRead.set(false))
      )
      .subscribe(() => {
        this.notifications.update(list =>
          list.map(n => ({ ...n, read: true }))
        );
      });
  }

  deleteNotification(notification: Notification, event: MouseEvent): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(notification.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.notifications.update(list => list.filter(n => n.id !== notification.id));
      });
  }

  navigateToReference(notification: Notification, event: MouseEvent): void {
    event.stopPropagation();
    if (notification.referenceType && notification.referenceId) {
      const route = this.getRouteForReference(notification.referenceType, notification.referenceId);
      if (route) {
        this.router.navigate(route);
      }
    }
  }

  // Helper methods
  getIcon(type: NotificationType): string {
    return this.notificationService.getIcon(type);
  }

  getIconColor(type: NotificationType): string {
    const colorMap: Partial<Record<NotificationType, string>> = {
      LEAVE_APPROVED: 'text-success-600 dark:text-success-400',
      LEAVE_REJECTED: 'text-error-600 dark:text-error-400',
      LEAVE_CANCELLED: 'text-warning-600 dark:text-warning-400',
      DOCUMENT_EXPIRING: 'text-warning-600 dark:text-warning-400',
      PASSWORD_CHANGED: 'text-warning-600 dark:text-warning-400',
      TICKET_RESOLVED: 'text-success-600 dark:text-success-400',
      OFFER_EXTENDED: 'text-success-600 dark:text-success-400',
      PAYSLIP_READY: 'text-success-600 dark:text-success-400'
    };
    return colorMap[type] || 'text-primary-600 dark:text-primary-400';
  }

  getIconBackground(type: NotificationType): string {
    const bgMap: Partial<Record<NotificationType, string>> = {
      LEAVE_APPROVED: 'bg-success-100 dark:bg-success-900/30',
      LEAVE_REJECTED: 'bg-error-100 dark:bg-error-900/30',
      LEAVE_CANCELLED: 'bg-warning-100 dark:bg-warning-900/30',
      DOCUMENT_EXPIRING: 'bg-warning-100 dark:bg-warning-900/30',
      PASSWORD_CHANGED: 'bg-warning-100 dark:bg-warning-900/30',
      TICKET_RESOLVED: 'bg-success-100 dark:bg-success-900/30',
      OFFER_EXTENDED: 'bg-success-100 dark:bg-success-900/30',
      PAYSLIP_READY: 'bg-success-100 dark:bg-success-900/30'
    };
    return bgMap[type] || 'bg-primary-100 dark:bg-primary-900/30';
  }

  getTypeLabel(type: NotificationType): string {
    const labels: Record<NotificationType, string> = {
      LEAVE_SUBMITTED: 'notifications.inbox.type_leave',
      LEAVE_APPROVED: 'notifications.inbox.type_leave',
      LEAVE_REJECTED: 'notifications.inbox.type_leave',
      LEAVE_CANCELLED: 'notifications.inbox.type_leave',
      PAYSLIP_READY: 'notifications.inbox.type_payroll',
      PAYROLL_PROCESSED: 'notifications.inbox.type_payroll',
      DOCUMENT_UPLOADED: 'notifications.inbox.type_document',
      DOCUMENT_EXPIRING: 'notifications.inbox.type_document',
      DOCUMENT_SHARED: 'notifications.inbox.type_document',
      TICKET_CREATED: 'notifications.inbox.type_support',
      TICKET_UPDATED: 'notifications.inbox.type_support',
      TICKET_RESOLVED: 'notifications.inbox.type_support',
      TICKET_ASSIGNED: 'notifications.inbox.type_support',
      APPLICATION_RECEIVED: 'notifications.inbox.type_recruitment',
      INTERVIEW_SCHEDULED: 'notifications.inbox.type_recruitment',
      OFFER_EXTENDED: 'notifications.inbox.type_recruitment',
      SYSTEM_ANNOUNCEMENT: 'notifications.inbox.type_system',
      ACCOUNT_UPDATED: 'notifications.inbox.type_system',
      PASSWORD_CHANGED: 'notifications.inbox.type_system'
    };
    return labels[type] || 'notifications.inbox.type_notification';
  }

  getTypeVariant(type: NotificationType): 'primary' | 'success' | 'warning' | 'error' | 'neutral' {
    const variantMap: Partial<Record<NotificationType, 'primary' | 'success' | 'warning' | 'error' | 'neutral'>> = {
      LEAVE_APPROVED: 'success',
      LEAVE_REJECTED: 'error',
      LEAVE_CANCELLED: 'warning',
      TICKET_RESOLVED: 'success',
      OFFER_EXTENDED: 'success',
      PAYSLIP_READY: 'success',
      DOCUMENT_EXPIRING: 'warning',
      PASSWORD_CHANGED: 'warning'
    };
    return variantMap[type] || 'neutral';
  }

  formatTime(dateString: string): string {
    return this.notificationService.formatRelativeTime(dateString);
  }

  private getRouteForReference(referenceType: string, referenceId: string): string[] | null {
    const routeMap: Record<string, string[]> = {
      LEAVE_REQUEST: ['/leave', referenceId],
      PAYSLIP: ['/my-payslips', referenceId],
      DOCUMENT: ['/documents', referenceId],
      SUPPORT_TICKET: ['/support', referenceId],
      JOB_POSTING: ['/recruitment/jobs', referenceId],
      CANDIDATE: ['/recruitment/candidates', referenceId],
      EMPLOYEE: ['/employees', referenceId]
    };
    return routeMap[referenceType] || null;
  }
}
