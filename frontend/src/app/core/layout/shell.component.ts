import { Component, inject, ChangeDetectionStrategy, signal, computed, HostListener, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { logout } from '@core/store/auth/auth.actions';
import { selectCurrentUser, selectUserPermissions } from '@core/store/auth/auth.selectors';
import { ThemeService } from '@core/services/theme.service';
import { NotificationService } from '@core/services/notification.service';
import { DropdownComponent, DropdownItemComponent, DropdownDividerComponent } from '@shared/ui';
import { ToastContainerComponent } from '@shared/ui';
import { NotificationDropdownComponent } from './notification-dropdown.component';
import { SearchModalComponent } from './search-modal.component';

interface NavItem {
  labelKey: string;
  route?: string;
  icon: string;
  permissions?: string[];
  children?: NavItem[];
  badge?: string;  // For "NEW" badges
}

interface NavGroup {
  labelKey: string;
  items: NavItem[];
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    TranslateModule,
    DropdownComponent,
    DropdownItemComponent,
    DropdownDividerComponent,
    ToastContainerComponent,
    NotificationDropdownComponent,
    SearchModalComponent
  ],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <!-- Mobile Overlay -->
      @if (sidebarOpen() && isMobile()) {
        <div
          class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
          (click)="closeSidebar()"
        ></div>
      }

      <!-- Sidebar - TailAdmin Style -->
      <aside [class]="sidebarClasses()">
        <!-- Logo Section -->
        <div class="flex items-center gap-3 px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <div class="flex items-center justify-center w-8 h-8">
            <!-- TailAdmin-style logo icon -->
            <svg class="w-8 h-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="6" class="fill-primary-500"/>
              <path d="M8 10h4v12H8V10zm6 4h4v8h-4v-8zm6-2h4v10h-4V12z" fill="white"/>
            </svg>
          </div>
          @if (!collapsed() || isMobile()) {
            <span class="text-xl font-bold text-gray-900 dark:text-white tracking-tight">SureWork</span>
          }
        </div>

        <!-- Navigation -->
        <nav class="flex-1 py-4 overflow-y-auto custom-scrollbar">
          @for (group of filteredNavGroups(); track group.labelKey; let groupIdx = $index) {
            <div class="mb-4">
              <!-- Group Label -->
              @if (!collapsed() || isMobile()) {
                <div class="px-6 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  {{ group.labelKey | translate }}
                </div>
              }

              <!-- Navigation Items -->
              @for (item of group.items; track item.labelKey) {
                @if (item.children?.length) {
                  <!-- Expandable Item -->
                  <div class="px-3">
                    <button
                      type="button"
                      (click)="toggleExpand(item.labelKey)"
                      [class]="getNavItemClasses(item)"
                      class="w-full group"
                    >
                      <div class="flex items-center gap-3">
                        <span class="material-icons text-[20px] transition-colors">{{ item.icon }}</span>
                        @if (!collapsed() || isMobile()) {
                          <span class="flex-1 text-left">{{ item.labelKey | translate }}</span>
                          @if (item.badge) {
                            <span class="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400">
                              {{ item.badge }}
                            </span>
                          }
                          <svg
                            class="w-4 h-4 transition-transform duration-200"
                            [class.rotate-180]="isExpanded(item.labelKey)"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                          </svg>
                        }
                      </div>
                    </button>

                    <!-- Children -->
                    @if (isExpanded(item.labelKey) && (!collapsed() || isMobile())) {
                      <div class="mt-1 ml-4 pl-4 border-l border-gray-200 dark:border-gray-700 space-y-1">
                        @for (child of item.children; track child.route) {
                          <a
                            [routerLink]="child.route"
                            routerLinkActive="nav-child-active"
                            [routerLinkActiveOptions]="{exact: child.route === '/dashboard'}"
                            (click)="onNavClick()"
                            class="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors duration-150"
                          >
                            <span class="w-1.5 h-1.5 rounded-full bg-current opacity-40"></span>
                            <span>{{ child.labelKey | translate }}</span>
                          </a>
                        }
                      </div>
                    }
                  </div>
                } @else {
                  <!-- Regular Item -->
                  <div class="px-3">
                    <a
                      [routerLink]="item.route"
                      routerLinkActive="nav-item-active"
                      [routerLinkActiveOptions]="{exact: item.route === '/dashboard'}"
                      (click)="onNavClick()"
                      [class]="getNavItemClasses(item)"
                    >
                      <span class="material-icons text-[20px] transition-colors">{{ item.icon }}</span>
                      @if (!collapsed() || isMobile()) {
                        <span class="flex-1">{{ item.labelKey | translate }}</span>
                        @if (item.badge) {
                          <span class="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400">
                            {{ item.badge }}
                          </span>
                        }
                      }
                    </a>
                  </div>
                }
              }
            </div>
          }
        </nav>

        <!-- Collapse Toggle (Desktop) -->
        @if (!isMobile()) {
          <div class="border-t border-gray-200 dark:border-gray-800 p-3">
            <button
              type="button"
              (click)="toggleCollapse()"
              class="w-full flex items-center justify-center p-2.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150"
            >
              <svg
                class="w-5 h-5 transition-transform duration-200"
                [class.rotate-180]="collapsed()"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
              </svg>
            </button>
          </div>
        }
      </aside>

      <!-- Main Content Area -->
      <div [class]="contentWrapperClasses()">
        <!-- Header - TailAdmin Style -->
        <header class="sticky top-0 z-30 h-[72px] bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 lg:px-6 gap-4">
          <!-- Hamburger Menu (Mobile & Toggle) -->
          <button
            type="button"
            (click)="toggleSidebar()"
            class="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 lg:hidden"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>

          <!-- Desktop Sidebar Toggle -->
          <button
            type="button"
            (click)="toggleCollapse()"
            class="hidden lg:flex p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>

          <!-- Search Bar - Command Palette Style -->
          <div class="hidden md:flex flex-1 max-w-xl">
            <button
              type="button"
              (click)="showSearchModal.set(true)"
              class="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <span class="flex-1 text-left text-sm">{{ 'header.searchPlaceholder' | translate }}</span>
              <kbd class="hidden lg:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded">
                <span class="text-xs">⌘</span>K
              </kbd>
            </button>
          </div>

          <div class="flex-1 md:hidden"></div>

          <!-- Right Side Actions -->
          <div class="flex items-center gap-1">
            <!-- Theme Toggle -->
            <button
              type="button"
              (click)="toggleTheme()"
              class="p-2.5 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150"
            >
              @if (themeService.isDark()) {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
              } @else {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                </svg>
              }
            </button>

            <!-- Notifications -->
            <div class="relative" #notificationContainer>
              <button
                type="button"
                (click)="toggleNotificationPanel($event)"
                class="relative p-2.5 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
                @if (unreadCount() > 0) {
                  <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                }
              </button>

              @if (showNotificationPanel()) {
                <app-notification-dropdown (close)="closeNotificationPanel()" />
              }
            </div>

            <!-- User Menu -->
            <sw-dropdown align="right">
              <button
                trigger
                type="button"
                class="flex items-center gap-3 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150"
              >
                <!-- Avatar -->
                @if (user$ | async; as user) {
                  <div class="relative">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-semibold">
                      {{ userInitials() }}
                    </div>
                    <span class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
                  </div>
                  <div class="hidden lg:block text-left">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ user.fullName }}</p>
                  </div>
                  <svg class="hidden lg:block w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                }
              </button>

              <sw-dropdown-item (onClick)="navigateTo('/settings')">
                <div class="flex items-center gap-3">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  {{ 'userMenu.settings' | translate }}
                </div>
              </sw-dropdown-item>
              <sw-dropdown-item (onClick)="navigateTo('/profile')">
                <div class="flex items-center gap-3">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  {{ 'userMenu.profile' | translate }}
                </div>
              </sw-dropdown-item>
              <sw-dropdown-divider />
              <sw-dropdown-item [danger]="true" (onClick)="logout()">
                <div class="flex items-center gap-3">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                  {{ 'userMenu.signOut' | translate }}
                </div>
              </sw-dropdown-item>
            </sw-dropdown>
          </div>
        </header>

        <!-- Page Content -->
        <main class="p-4 lg:p-6">
          <router-outlet />
        </main>
      </div>

      <!-- Toast Container -->
      <sw-toast-container />

      <!-- Global Search Modal -->
      @if (showSearchModal()) {
        <app-search-modal (close)="showSearchModal.set(false)" />
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    /* Custom Scrollbar */
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
    }

    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }

    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: rgba(156, 163, 175, 0.3);
      border-radius: 3px;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: rgba(156, 163, 175, 0.5);
    }

    /* Active nav item - Teal accent */
    :host ::ng-deep .nav-item-active {
      background-color: rgb(20 184 166 / 0.1);
      color: rgb(13 148 136);
    }

    :host ::ng-deep .nav-item-active .material-icons,
    :host ::ng-deep .nav-item-active svg {
      color: rgb(13 148 136);
    }

    :host ::ng-deep .dark .nav-item-active {
      background-color: rgb(20 184 166 / 0.15);
      color: rgb(45 212 191);
    }

    :host ::ng-deep .nav-child-active {
      color: rgb(13 148 136) !important;
      font-weight: 500;
    }

    :host ::ng-deep .dark .nav-child-active {
      color: rgb(45 212 191) !important;
    }

    :host ::ng-deep .nav-child-active span[class*="w-1"] {
      background-color: rgb(13 148 136);
      opacity: 1;
    }

    /* Rotate animation */
    .rotate-180 {
      transform: rotate(180deg);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShellComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);
  protected readonly themeService = inject(ThemeService);
  protected readonly notificationService = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  private destroy$ = new Subject<void>();

  user$ = this.store.select(selectCurrentUser);
  private user = toSignal(this.store.select(selectCurrentUser));

  // Responsive state
  private windowWidth = signal(typeof window !== 'undefined' ? window.innerWidth : 1200);
  sidebarOpen = signal(false);
  collapsed = signal(false);

  // Notification state
  showNotificationPanel = signal(false);
  unreadCount = signal(0);
  isConnected = signal(true);

  // Search modal state
  showSearchModal = signal(false);

  @ViewChild('notificationContainer') notificationContainer!: ElementRef;

  // Expanded menu items tracking
  private expandedItems = signal<Set<string>>(new Set());

  isMobile = computed(() => this.windowWidth() < 1024);
  isTablet = computed(() => this.windowWidth() >= 768 && this.windowWidth() < 1024);

  // User permissions from store
  private userPermissions = toSignal(this.store.select(selectUserPermissions), { initialValue: [] as string[] });

  // Original SureWork navigation structure with permission-based filtering
  private readonly navGroups: NavGroup[] = [
    {
      labelKey: 'nav.groups.overview',
      items: [
        { labelKey: 'nav.dashboard', route: '/dashboard', icon: 'dashboard' }
      ]
    },
    {
      labelKey: 'nav.groups.selfService',
      items: [
        { labelKey: 'nav.myLeave', route: '/leave', icon: 'event_available', permissions: ['LEAVE_REQUEST'] },
        { labelKey: 'nav.myPayslips', route: '/my-payslips', icon: 'receipt_long' },
        { labelKey: 'nav.myDocuments', route: '/my-documents', icon: 'folder_shared' },
        { labelKey: 'nav.supportTickets', route: '/support', icon: 'support_agent' }
      ]
    },
    {
      labelKey: 'nav.groups.hr',
      items: [
        {
          labelKey: 'nav.groups.hr',
          icon: 'groups',
          permissions: ['EMPLOYEE_READ', 'EMPLOYEE_MANAGE', 'LEAVE_APPROVE', 'LEAVE_MANAGE'],
          children: [
            { labelKey: 'nav.hrOverview', route: '/hr', icon: 'dashboard' },
            { labelKey: 'nav.employees', route: '/employees', icon: 'people' },
            { labelKey: 'nav.leaveManagement', route: '/leave/admin', icon: 'event_available' },
            { labelKey: 'nav.hrDocuments', route: '/documents/hr', icon: 'folder' }
          ]
        }
      ]
    },
    {
      labelKey: 'nav.groups.finance',
      items: [
        {
          labelKey: 'nav.groups.finance',
          icon: 'account_balance',
          permissions: ['PAYROLL_READ', 'PAYROLL_MANAGE', 'ACCOUNTING_READ', 'FINANCE_READ'],
          children: [
            { labelKey: 'nav.financeOverview', route: '/finance', icon: 'dashboard' },
            { labelKey: 'nav.payroll', route: '/payroll', icon: 'payments' },
            { labelKey: 'nav.payrollRuns', route: '/payroll/runs', icon: 'play_circle' },
            { labelKey: 'nav.accounting', route: '/accounting', icon: 'calculate' },
            { labelKey: 'nav.financeReports', route: '/finance/reports', icon: 'analytics' }
          ]
        }
      ]
    },
    {
      labelKey: 'nav.groups.recruitment',
      items: [
        {
          labelKey: 'nav.groups.recruitment',
          icon: 'work',
          permissions: ['RECRUITMENT_READ', 'RECRUITMENT_MANAGE'],
          children: [
            { labelKey: 'nav.recruitmentDashboard', route: '/recruitment', icon: 'dashboard' },
            { labelKey: 'nav.jobs', route: '/recruitment/jobs', icon: 'work' },
            { labelKey: 'nav.clients', route: '/recruitment/clients', icon: 'business' },
            { labelKey: 'nav.candidates', route: '/recruitment/candidates', icon: 'person_search' },
            { labelKey: 'nav.interviews', route: '/recruitment/interviews', icon: 'event' },
            { labelKey: 'nav.recruitmentReports', route: '/recruitment/reports', icon: 'analytics' }
          ]
        }
      ]
    },
    {
      labelKey: 'nav.groups.reports',
      items: [
        {
          labelKey: 'nav.groups.reports',
          icon: 'analytics',
          permissions: ['REPORTS_READ', 'HR_REPORTS', 'FINANCE_REPORTS', 'EMPLOYEE_READ', 'PAYROLL_READ'],
          children: [
            { labelKey: 'nav.reportsDashboard', route: '/reports', icon: 'dashboard' },
            { labelKey: 'nav.hrReports', route: '/reports/hr', icon: 'people' },
            { labelKey: 'nav.financialReports', route: '/reports/financial', icon: 'payments' },
            { labelKey: 'nav.recruitmentReports', route: '/reports/recruitment', icon: 'work' }
          ]
        }
      ]
    },
    {
      labelKey: 'nav.groups.documents',
      items: [
        {
          labelKey: 'nav.groups.documents',
          icon: 'folder',
          permissions: ['DOCUMENTS_READ', 'DOCUMENTS_MANAGE', 'EMPLOYEE_READ'],
          children: [
            { labelKey: 'nav.allDocuments', route: '/documents', icon: 'folder' },
            { labelKey: 'nav.templates', route: '/documents/templates', icon: 'description' },
            { labelKey: 'nav.policies', route: '/documents/policies', icon: 'policy' }
          ]
        }
      ]
    },
    {
      labelKey: 'nav.groups.system',
      items: [
        { labelKey: 'nav.supportAdmin', route: '/support/admin', icon: 'headset_mic', permissions: ['SUPPORT_ADMIN', 'SUPER_ADMIN', 'TENANT_ALL', 'ALL'] },
        { labelKey: 'nav.settings', route: '/settings', icon: 'settings', permissions: ['SYSTEM_ADMIN', 'TENANT_ALL', 'ALL'] }
      ]
    }
  ];

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        this.autoExpandForRoute(event.urlAfterRedirects);
      });

    this.autoExpandForRoute(this.router.url);

    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadCount.set(count);
      });

    this.notificationService.connected$
      .pipe(takeUntil(this.destroy$))
      .subscribe(connected => {
        this.isConnected.set(connected);
      });

    this.notificationService.initialize();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.showNotificationPanel()) return;

    const target = event.target as HTMLElement;
    const container = this.notificationContainer?.nativeElement;

    if (container && !container.contains(target)) {
      this.closeNotificationPanel();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.showNotificationPanel()) {
      this.closeNotificationPanel();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.showSearchModal.set(true);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private autoExpandForRoute(url: string): void {
    const expanded = new Set(this.expandedItems());

    for (const group of this.navGroups) {
      for (const item of group.items) {
        if (item.children?.some(child => child.route && url.startsWith(child.route))) {
          expanded.add(item.labelKey);
        }
      }
    }

    this.expandedItems.set(expanded);
  }

  toggleExpand(labelKey: string): void {
    const expanded = new Set(this.expandedItems());
    if (expanded.has(labelKey)) {
      expanded.delete(labelKey);
    } else {
      expanded.add(labelKey);
    }
    this.expandedItems.set(expanded);
  }

  isExpanded(labelKey: string): boolean {
    return this.expandedItems().has(labelKey);
  }

  filteredNavGroups = computed(() => {
    const permissions = this.userPermissions();
    const isSuperAdmin = permissions.includes('ALL') || permissions.includes('*') || permissions.includes('TENANT_ALL');

    const filterItems = (items: NavItem[]): NavItem[] => {
      return items
        .map(item => {
          const hasPermission = isSuperAdmin ||
            !item.permissions?.length ||
            item.permissions.some(p => permissions.includes(p));

          if (!hasPermission) return null;

          if (item.children?.length) {
            const filteredChildren = filterItems(item.children);
            if (filteredChildren.length === 0) return null;
            return { ...item, children: filteredChildren };
          }

          return item;
        })
        .filter((item): item is NavItem => item !== null);
    };

    return this.navGroups
      .map(group => ({
        ...group,
        items: filterItems(group.items)
      }))
      .filter(group => group.items.length > 0);
  });

  userInitials = computed(() => {
    const currentUser = this.user();
    if (!currentUser?.fullName) return '?';
    return currentUser.fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  });

  sidebarClasses = computed(() => {
    const base = 'fixed top-0 left-0 z-50 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 ease-in-out';

    if (this.isMobile()) {
      return `${base} w-72 ${this.sidebarOpen() ? 'translate-x-0' : '-translate-x-full'}`;
    }

    if (this.collapsed()) {
      return `${base} w-20`;
    }

    return `${base} w-72`;
  });

  contentWrapperClasses = computed(() => {
    const base = 'min-h-screen transition-[margin] duration-300 ease-in-out';

    if (this.isMobile()) {
      return base;
    }

    if (this.collapsed()) {
      return `${base} lg:ml-20`;
    }

    return `${base} lg:ml-72`;
  });

  getNavItemClasses(item: NavItem): string {
    const base = 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150';
    const colors = 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white';

    if (this.collapsed() && !this.isMobile()) {
      return `${base} justify-center ${colors}`;
    }

    return `${base} ${colors}`;
  }

  @HostListener('window:resize')
  onResize(): void {
    this.windowWidth.set(window.innerWidth);
    if (this.windowWidth() >= 1024) {
      this.sidebarOpen.set(false);
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(open => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  toggleCollapse(): void {
    this.collapsed.update(c => !c);
  }

  onNavClick(): void {
    if (this.isMobile()) {
      this.closeSidebar();
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  logout(): void {
    this.store.dispatch(logout());
  }

  toggleNotificationPanel(event: Event): void {
    event.stopPropagation();
    this.showNotificationPanel.update(open => !open);
  }

  closeNotificationPanel(): void {
    this.showNotificationPanel.set(false);
  }

  getNotificationAriaLabel(): string {
    const count = this.unreadCount();
    if (count > 0) {
      return this.translate.instant('accessibility.notifications.labelWithCount', { count });
    }
    return this.translate.instant('accessibility.notifications.label');
  }
}
