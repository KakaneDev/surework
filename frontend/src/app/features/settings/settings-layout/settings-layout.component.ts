import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { selectUserPermissions } from '@core/store/auth/auth.selectors';

interface NavItem {
  labelKey: string;
  path: string;
  icon: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-settings-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <div class="sw-page-header">
        <div>
          <h1 class="sw-page-title">{{ 'settings.title' | translate }}</h1>
          <p class="sw-page-description">{{ 'settings.layout.subtitle' | translate }}</p>
        </div>
      </div>

      <div class="flex flex-col lg:flex-row gap-6">
        <!-- Sidebar Navigation -->
        <nav class="w-full lg:w-64 flex-shrink-0">
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
            <!-- Personal Settings -->
            <div class="p-4 border-b border-neutral-200 dark:border-dark-border">
              <h3 class="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                {{ 'settings.layout.personal' | translate }}
              </h3>
            </div>
            <ul class="py-2">
              @for (item of personalItems; track item.path) {
                <li>
                  <a
                    [routerLink]="item.path"
                    routerLinkActive="bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-l-2 border-primary-500"
                    class="flex items-center gap-3 px-4 py-2.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-dark-elevated transition-colors"
                  >
                    <span class="material-icons text-xl">{{ item.icon }}</span>
                    <span class="text-sm font-medium">{{ item.labelKey | translate }}</span>
                  </a>
                </li>
              }
            </ul>

            <!-- Admin Settings (conditional) -->
            @if (isAdmin()) {
              <div class="p-4 border-t border-b border-neutral-200 dark:border-dark-border">
                <h3 class="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  {{ 'settings.layout.administration' | translate }}
                </h3>
              </div>
              <ul class="py-2">
                @for (item of adminItems; track item.path) {
                  <li>
                    <a
                      [routerLink]="item.path"
                      routerLinkActive="bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-l-2 border-primary-500"
                      class="flex items-center gap-3 px-4 py-2.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-dark-elevated transition-colors"
                    >
                      <span class="material-icons text-xl">{{ item.icon }}</span>
                      <span class="text-sm font-medium">{{ item.labelKey | translate }}</span>
                    </a>
                  </li>
                }
              </ul>
            }
          </div>
        </nav>

        <!-- Content Area -->
        <main class="flex-1 min-w-0">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class SettingsLayoutComponent {
  private readonly store = inject(Store);
  private readonly permissions = toSignal(this.store.select(selectUserPermissions));

  readonly isAdmin = computed(() => {
    const perms = this.permissions() ?? [];
    return perms.includes('SYSTEM_ADMIN') ||
           perms.includes('TENANT_ALL') ||
           perms.includes('ALL') ||
           perms.includes('*');
  });

  readonly personalItems: NavItem[] = [
    { labelKey: 'settings.account.title', path: '/settings/security', icon: 'security' },
    { labelKey: 'settings.notifications', path: '/settings/notifications', icon: 'notifications' },
    { labelKey: 'settings.appearance', path: '/settings/appearance', icon: 'palette' }
  ];

  readonly adminItems: NavItem[] = [
    { labelKey: 'settings.companyProfile.label', path: '/settings/company', icon: 'business' },
    { labelKey: 'settings.userManagement.label', path: '/settings/users', icon: 'group' },
    { labelKey: 'settings.leavePolicies.label', path: '/settings/leave-policies', icon: 'event_available' },
    { labelKey: 'settings.notificationChannels.label', path: '/settings/notification-channels', icon: 'tune' }
  ];
}
