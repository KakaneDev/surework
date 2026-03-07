import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RelativeTimePipe } from '@core/pipes/relative-time.pipe';

export interface ActivityItem {
  type: string;
  description: string;
  tenantName?: string;
  timestamp: string;
}

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [CommonModule, RelativeTimePipe],
  template: `
    <div class="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div class="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
      </div>
      <div class="max-h-96 overflow-y-auto">
        @for (item of activities; track $index) {
          <div class="flex items-start gap-3 border-b border-gray-100 px-6 py-4 last:border-b-0 dark:border-gray-800">
            <div [class]="getIconClasses(item.type)">
              <span [innerHTML]="getSafeIcon(item.type)"></span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-700 dark:text-gray-300">
                {{ item.description }}
              </p>
              @if (item.tenantName) {
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {{ item.tenantName }}
                </p>
              }
              <p class="text-xs text-gray-400 mt-1">{{ item.timestamp | relativeTime }}</p>
            </div>
          </div>
        } @empty {
          <div class="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No recent activity
          </div>
        }
      </div>
    </div>
  `
})
export class ActivityFeedComponent {
  private sanitizer = inject(DomSanitizer);

  @Input() activities: ActivityItem[] = [];

  getIconClasses(type: string): string {
    const baseClasses = 'flex h-8 w-8 items-center justify-center rounded-md';
    return `${baseClasses} bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400`;
  }

  getSafeIcon(type: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.getIcon(type));
  }

  private getIcon(type: string): string {
    const icons: Record<string, string> = {
      TENANT_SIGNUP: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>',
      TICKET_CREATED: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>',
      PAYMENT_RECEIVED: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
      TRIAL_EXPIRING: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
      CHURN_ALERT: '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>'
    };

    return icons[type] || '<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
  }
}
