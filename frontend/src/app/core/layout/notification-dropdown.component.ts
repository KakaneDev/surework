import {
  Component,
  inject,
  ChangeDetectionStrategy,
  signal,
  computed,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  HostListener,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import {
  NotificationService,
  Notification,
  NotificationType,
  NOTIFICATION_STYLES
} from '@core/services/notification.service';

/**
 * Dropdown component for displaying recent notifications.
 * Shows a list of notifications with mark as read functionality.
 * Supports keyboard navigation (arrow keys, Enter, Escape).
 */
@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div
      class="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
      role="dialog"
      aria-labelledby="notification-dropdown-title"
      aria-modal="true"
    >
      <!-- Header - TailAdmin style -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 id="notification-dropdown-title" class="font-semibold text-gray-900 dark:text-white">
          {{ 'notifications.dropdown.title' | translate }}
        </h3>
        @if (hasUnread()) {
          <button
            type="button"
            (click)="markAllAsRead()"
            [disabled]="markingAllRead()"
            class="text-sm text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
          >
            @if (markingAllRead()) {
              <span class="w-3 h-3 border-2 border-primary-500 dark:border-primary-400 border-t-transparent rounded-full animate-spin"></span>
            }
            {{ 'notifications.dropdown.markAllAsRead' | translate }}
          </button>
        }
      </div>

      <!-- Notification List -->
      <div
        #notificationList
        class="max-h-96 overflow-y-auto"
        role="listbox"
        [attr.aria-activedescendant]="activeNotificationId()"
        tabindex="0"
        (keydown)="onKeyDown($event)"
      >
        <!-- Empty State -->
        @if (notifications().length === 0) {
          <div class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
            <span class="material-icons text-4xl mb-2 block opacity-50 animate-bounce-subtle">notifications_none</span>
            <p>{{ 'notifications.dropdown.noNotifications' | translate }}</p>
          </div>
        }

        <!-- Notifications -->
        @for (notification of notifications(); track notification.id; let idx = $index) {
          <button
            type="button"
            [id]="'notification-' + notification.id"
            class="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-150 border-b border-gray-100 dark:border-gray-800 last:border-0 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800"
            [ngClass]="{
              'bg-primary-50 dark:bg-primary-900/10': !notification.read,
              'ring-2 ring-primary-500/50 ring-inset': focusedIndex() === idx
            }"
            (click)="onNotificationClick(notification)"
            role="option"
            [attr.aria-selected]="focusedIndex() === idx"
            [attr.aria-label]="getNotificationAriaLabel(notification)"
          >
            <div class="flex gap-3">
              <!-- Icon -->
              <div
                class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                [class]="getIconBackground(notification.type)"
              >
                <span
                  class="material-icons text-lg"
                  [class]="getIconColor(notification.type)"
                >
                  {{ getIcon(notification.type) }}
                </span>
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <p
                  class="text-sm text-gray-900 dark:text-white truncate"
                  [class.font-semibold]="!notification.read"
                  [class.font-medium]="notification.read"
                >
                  {{ notification.title }}
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {{ notification.message }}
                </p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {{ formatTime(notification.createdAt) }}
                </p>
              </div>

              <!-- Unread indicator - blue -->
              @if (!notification.read) {
                <div class="flex-shrink-0 w-2 h-2 rounded-full bg-primary-500 mt-2" aria-hidden="true"></div>
              }

              <!-- Loading indicator for individual notification -->
              @if (markingReadId() === notification.id) {
                <div class="flex-shrink-0 w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mt-2"></div>
              }
            </div>
          </button>
        }
      </div>

      <!-- Footer - TailAdmin style -->
      <div class="border-t border-gray-200 dark:border-gray-700">
        <a
          routerLink="/notifications"
          (click)="close.emit()"
          class="block px-4 py-3 text-center text-sm font-medium text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800"
        >
          {{ 'notifications.dropdown.viewAll' | translate }}
        </a>
      </div>
    </div>
  `,
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    @keyframes bounce-subtle {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }

    .animate-bounce-subtle {
      animation: bounce-subtle 2s ease-in-out infinite;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationDropdownComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);
  private readonly translate = inject(TranslateService);
  private destroy$ = new Subject<void>();

  @Output() close = new EventEmitter<void>();

  // State
  notifications = signal<Notification[]>([]);
  unreadCount = signal<number>(0);
  markingAllRead = signal(false);
  markingReadId = signal<string | null>(null);
  focusedIndex = signal(-1);

  // Computed
  hasUnread = computed(() => this.unreadCount() > 0);
  activeNotificationId = computed(() => {
    const idx = this.focusedIndex();
    const notifs = this.notifications();
    if (idx >= 0 && idx < notifs.length) {
      return 'notification-' + notifs[idx].id;
    }
    return null;
  });

  ngOnInit(): void {
    // Subscribe to notifications from service
    this.notificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        this.notifications.set(notifications);
      });

    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadCount.set(count);
      });
  }

  ngAfterViewInit(): void {
    // Focus the notification list for keyboard navigation
    setTimeout(() => {
      const list = this.elementRef.nativeElement.querySelector('[role="listbox"]');
      if (list) {
        list.focus();
      }
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByFn(index: number, notification: Notification): string {
    return notification.id;
  }

  /**
   * Handle keyboard navigation within the notification list.
   */
  onKeyDown(event: KeyboardEvent): void {
    const notifications = this.notifications();
    const currentIndex = this.focusedIndex();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (currentIndex < notifications.length - 1) {
          this.focusedIndex.set(currentIndex + 1);
          this.scrollToFocused();
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (currentIndex > 0) {
          this.focusedIndex.set(currentIndex - 1);
          this.scrollToFocused();
        }
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        if (currentIndex >= 0 && currentIndex < notifications.length) {
          this.onNotificationClick(notifications[currentIndex]);
        }
        break;

      case 'Home':
        event.preventDefault();
        if (notifications.length > 0) {
          this.focusedIndex.set(0);
          this.scrollToFocused();
        }
        break;

      case 'End':
        event.preventDefault();
        if (notifications.length > 0) {
          this.focusedIndex.set(notifications.length - 1);
          this.scrollToFocused();
        }
        break;
    }
  }

  /**
   * Scroll the focused notification into view.
   */
  private scrollToFocused(): void {
    const idx = this.focusedIndex();
    const notifications = this.notifications();
    if (idx >= 0 && idx < notifications.length) {
      const element = document.getElementById('notification-' + notifications[idx].id);
      if (element) {
        element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }

  onNotificationClick(notification: Notification): void {
    // Mark as read if unread
    if (!notification.read) {
      this.markingReadId.set(notification.id);
      this.notificationService.markAsRead(notification.id)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.markingReadId.set(null))
        )
        .subscribe();
    }

    // Navigate to referenced entity if available, otherwise go to notifications page
    if (notification.referenceType && notification.referenceId) {
      const route = this.getRouteForReference(notification.referenceType, notification.referenceId);
      if (route) {
        this.router.navigate(route);
        this.close.emit();
        return;
      }
    }

    // Fallback: navigate to notifications page
    this.router.navigate(['/notifications']);
    this.close.emit();
  }

  markAllAsRead(): void {
    this.markingAllRead.set(true);
    this.notificationService.markAllAsRead()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.markingAllRead.set(false))
      )
      .subscribe();
  }

  getIcon(type: NotificationType): string {
    return this.notificationService.getIcon(type);
  }

  getIconColor(type: NotificationType): string {
    return NOTIFICATION_STYLES[type]?.iconColor || 'text-primary-600 dark:text-primary-400';
  }

  getIconBackground(type: NotificationType): string {
    return NOTIFICATION_STYLES[type]?.bgColor || 'bg-primary-100 dark:bg-primary-900/30';
  }

  formatTime(dateString: string): string {
    return this.notificationService.formatRelativeTime(dateString);
  }

  getNotificationAriaLabel(notification: Notification): string {
    const readStatus = notification.read ? '' : this.translate.instant('notifications.dropdown.unread') + '. ';
    const time = this.formatTime(notification.createdAt);
    return `${readStatus}${notification.title}. ${notification.message}. ${time}`;
  }

  private getRouteForReference(referenceType: string, referenceId: string): string[] | null {
    const routeMap: Record<string, string[]> = {
      LEAVE_REQUEST: ['/leave', referenceId],
      PAYSLIP: ['/my-payslips', referenceId],
      DOCUMENT: ['/documents', referenceId],
      SUPPORT_TICKET: ['/support', referenceId],
      TICKET: ['/support', referenceId],
      JOB_POSTING: ['/recruitment/jobs', referenceId],
      CANDIDATE: ['/recruitment/candidates', referenceId],
      EMPLOYEE: ['/employees', referenceId],
      APPLICATION: ['/recruitment/candidates', referenceId],
      INTERVIEW: ['/recruitment/interviews', referenceId],
      USER: ['/profile']
    };
    return routeMap[referenceType] || null;
  }
}
