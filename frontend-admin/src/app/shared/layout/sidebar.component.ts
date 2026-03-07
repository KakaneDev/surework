import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

interface NavItem {
  label: string;
  route?: string;
  iconName: string;
  roles?: string[];
  children?: NavItem[];
  expanded?: boolean;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside
      [class]="sidebarClasses"
      class="sidebar-container fixed left-0 top-0 z-9999 flex h-screen w-[280px] flex-col overflow-y-hidden duration-300 ease-out lg:static lg:translate-x-0"
    >
      <!-- Subtle texture overlay -->
      <div class="sidebar-texture"></div>

      <!-- Logo Section -->
      <div class="relative z-10 flex items-center justify-between px-6 py-6">
        <a routerLink="/dashboard" class="group flex items-center gap-3">
          <!-- Logo mark -->
          <div class="logo-mark">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div class="flex flex-col">
            <span class="logo-text">SureWork</span>
            <span class="logo-subtitle">Admin Portal</span>
          </div>
        </a>
        <button
          class="sidebar-close-btn lg:hidden"
          (click)="closeSidebar.emit()"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Navigation -->
      <div class="sidebar-scroll relative z-10 flex flex-1 flex-col overflow-y-auto px-4 pb-6">
        <nav class="flex-1 space-y-1">
          <!-- Main Navigation -->
          <div class="mb-6">
            <p class="nav-section-title">Navigation</p>

            <ul class="space-y-1">
              @for (item of mainMenuItems; track item.label) {
                @if (canAccess(item)) {
                  <li>
                    @if (item.children) {
                      <!-- Parent with children -->
                      <button
                        (click)="toggleExpand(item)"
                        class="nav-item group w-full"
                        [class.nav-item-expanded]="item.expanded"
                      >
                        <span class="nav-icon">
                          <ng-container [ngSwitch]="item.iconName">
                            <svg *ngSwitchCase="'chart'" class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                            </svg>
                            <svg *ngSwitchCase="'credit-card'" class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                            </svg>
                            <svg *ngSwitchCase="'globe'" class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
                            </svg>
                          </ng-container>
                        </span>
                        <span class="flex-1 text-left">{{ item.label }}</span>
                        <svg
                          class="chevron-icon"
                          [class.rotate-180]="item.expanded"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                      </button>

                      <!-- Submenu with animation -->
                      <div
                        class="submenu-container"
                        [class.submenu-open]="item.expanded"
                      >
                        <ul class="submenu-list">
                          @for (child of item.children; track child.label) {
                            @if (canAccess(child)) {
                              <li>
                                <a
                                  [routerLink]="child.route"
                                  routerLinkActive="submenu-item-active"
                                  class="submenu-item"
                                >
                                  <span class="submenu-dot"></span>
                                  {{ child.label }}
                                </a>
                              </li>
                            }
                          }
                        </ul>
                      </div>
                    } @else {
                      <!-- Single item -->
                      <a
                        [routerLink]="item.route"
                        routerLinkActive="nav-item-active"
                        [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
                        class="nav-item"
                      >
                        <span class="nav-icon">
                          <ng-container [ngSwitch]="item.iconName">
                            <svg *ngSwitchCase="'grid'" class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                            </svg>
                            <svg *ngSwitchCase="'building'" class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                            </svg>
                            <svg *ngSwitchCase="'clipboard'" class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                            </svg>
                            <svg *ngSwitchCase="'clock'" class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <svg *ngSwitchCase="'support'" class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/>
                            </svg>
                            <svg *ngSwitchCase="'tag'" class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                            </svg>
                          </ng-container>
                        </span>
                        <span class="flex-1">{{ item.label }}</span>
                        @if (item.badge) {
                          <span class="nav-badge">{{ item.badge }}</span>
                        }
                      </a>
                    }
                  </li>
                }
              }
            </ul>
          </div>

          <!-- Workspace Section -->
          <div>
            <p class="nav-section-title">Workspace</p>
            <ul class="space-y-1">
              @for (item of workspaceItems; track item.label) {
                @if (canAccess(item)) {
                  <li>
                    <a
                      [routerLink]="item.route"
                      routerLinkActive="nav-item-active"
                      class="nav-item"
                    >
                      <span class="nav-icon">
                        <ng-container [ngSwitch]="item.iconName">
                          <svg *ngSwitchCase="'tag'" class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                          </svg>
                        </ng-container>
                      </span>
                      <span class="flex-1">{{ item.label }}</span>
                      @if (item.badge) {
                        <span class="nav-badge">{{ item.badge }}</span>
                      }
                    </a>
                  </li>
                }
              }
            </ul>
          </div>
        </nav>

        <!-- User Quick Actions -->
        <div class="mt-auto pt-6">
          <div class="sidebar-user-card">
            <div class="flex items-center gap-3">
              <div class="user-avatar">
                {{ userInitials }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="user-name">{{ userName }}</p>
                <p class="user-role">{{ userRole }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    /* ========================================
       CSS Custom Properties for Light/Dark Mode
       Using Teal/Emerald accent - sophisticated & professional
       ======================================== */

    :host {
      /* Light mode (default) */
      --sidebar-bg: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
      --sidebar-border: rgba(0, 0, 0, 0.06);
      --sidebar-texture: rgba(0, 0, 0, 0.01);

      --text-primary: #0f172a;
      --text-secondary: #475569;
      --text-muted: #94a3b8;

      --accent-color: #0d9488;
      --accent-light: #14b8a6;
      --accent-bg: rgba(13, 148, 136, 0.08);
      --accent-bg-hover: rgba(13, 148, 136, 0.12);
      --accent-glow: rgba(13, 148, 136, 0.3);

      --nav-item-bg: transparent;
      --nav-item-hover-bg: rgba(0, 0, 0, 0.04);
      --nav-icon-bg: rgba(0, 0, 0, 0.04);
      --nav-icon-hover-bg: rgba(13, 148, 136, 0.12);

      --card-bg: rgba(255, 255, 255, 0.7);
      --card-border: rgba(0, 0, 0, 0.06);

      --badge-bg: linear-gradient(135deg, #ef4444, #f97316);
      --badge-shadow: rgba(239, 68, 68, 0.3);

      --scrollbar-thumb: rgba(0, 0, 0, 0.15);
      --scrollbar-thumb-hover: rgba(0, 0, 0, 0.25);
    }

    :host-context(.dark) {
      /* Dark mode */
      --sidebar-bg: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
      --sidebar-border: rgba(255, 255, 255, 0.06);
      --sidebar-texture: rgba(255, 255, 255, 0.01);

      --text-primary: #f1f5f9;
      --text-secondary: #cbd5e1;
      --text-muted: #64748b;

      --accent-color: #2dd4bf;
      --accent-light: #5eead4;
      --accent-bg: rgba(45, 212, 191, 0.1);
      --accent-bg-hover: rgba(45, 212, 191, 0.15);
      --accent-glow: rgba(45, 212, 191, 0.4);

      --nav-item-bg: transparent;
      --nav-item-hover-bg: rgba(255, 255, 255, 0.04);
      --nav-icon-bg: rgba(255, 255, 255, 0.05);
      --nav-icon-hover-bg: rgba(45, 212, 191, 0.15);

      --card-bg: rgba(255, 255, 255, 0.03);
      --card-border: rgba(255, 255, 255, 0.06);

      --badge-bg: linear-gradient(135deg, #ef4444, #f97316);
      --badge-shadow: rgba(239, 68, 68, 0.4);

      --scrollbar-thumb: rgba(255, 255, 255, 0.1);
      --scrollbar-thumb-hover: rgba(255, 255, 255, 0.2);
    }

    /* ========================================
       Sidebar Container
       ======================================== */

    .sidebar-container {
      background: var(--sidebar-bg);
      border-right: 1px solid var(--sidebar-border);
    }

    .sidebar-texture {
      position: absolute;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
      opacity: 0.03;
      pointer-events: none;
    }

    /* ========================================
       Logo Section
       ======================================== */

    .logo-mark {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      background: linear-gradient(135deg, var(--accent-color), var(--accent-light));
      border-radius: 12px;
      color: white;
      box-shadow: 0 4px 12px var(--accent-glow);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .logo-mark:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px var(--accent-glow);
    }

    .logo-text {
      font-size: 1.125rem;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: var(--text-primary);
    }

    .logo-subtitle {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--accent-color);
    }

    .sidebar-close-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      color: var(--text-muted);
      transition: all 0.2s ease;
    }

    .sidebar-close-btn:hover {
      background: var(--nav-item-hover-bg);
      color: var(--text-primary);
    }

    /* ========================================
       Scrollbar
       ======================================== */

    .sidebar-scroll {
      scrollbar-width: thin;
      scrollbar-color: var(--scrollbar-thumb) transparent;
    }

    .sidebar-scroll::-webkit-scrollbar {
      width: 4px;
    }

    .sidebar-scroll::-webkit-scrollbar-track {
      background: transparent;
    }

    .sidebar-scroll::-webkit-scrollbar-thumb {
      background: var(--scrollbar-thumb);
      border-radius: 4px;
    }

    .sidebar-scroll::-webkit-scrollbar-thumb:hover {
      background: var(--scrollbar-thumb-hover);
    }

    /* ========================================
       Section Title
       ======================================== */

    .nav-section-title {
      padding: 0 12px;
      margin-bottom: 8px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-muted);
    }

    /* ========================================
       Nav Item
       ======================================== */

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      color: var(--text-secondary);
      text-decoration: none;
      transition: all 0.2s ease;
      position: relative;
    }

    .nav-item:hover {
      color: var(--text-primary);
      background: var(--nav-item-hover-bg);
    }

    .nav-item:hover .nav-icon {
      background: var(--nav-icon-hover-bg);
      color: var(--accent-color);
    }

    /* Nav Item Active */
    .nav-item-active {
      color: var(--accent-color) !important;
      background: var(--accent-bg) !important;
    }

    .nav-item-active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 24px;
      background: linear-gradient(180deg, var(--accent-color), var(--accent-light));
      border-radius: 0 4px 4px 0;
      box-shadow: 0 0 12px var(--accent-glow);
    }

    .nav-item-active .nav-icon {
      background: linear-gradient(135deg, var(--accent-color), var(--accent-light)) !important;
      color: white !important;
      box-shadow: 0 4px 12px var(--accent-glow);
    }

    /* Nav Item Expanded */
    .nav-item-expanded {
      color: var(--text-primary);
      background: var(--nav-item-hover-bg);
    }

    .nav-item-expanded .nav-icon {
      background: var(--nav-icon-hover-bg);
      color: var(--accent-color);
    }

    /* ========================================
       Nav Icon
       ======================================== */

    .nav-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: var(--nav-icon-bg);
      color: var(--text-muted);
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .nav-icon .icon {
      width: 18px;
      height: 18px;
    }

    /* ========================================
       Chevron Icon
       ======================================== */

    .chevron-icon {
      width: 16px;
      height: 16px;
      color: var(--text-muted);
      transition: transform 0.3s ease, color 0.2s ease;
    }

    .nav-item:hover .chevron-icon {
      color: var(--text-secondary);
    }

    /* ========================================
       Nav Badge
       ======================================== */

    .nav-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 6px;
      background: var(--badge-bg);
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
      color: white;
      box-shadow: 0 2px 8px var(--badge-shadow);
    }

    /* ========================================
       Submenu
       ======================================== */

    .submenu-container {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease-out, opacity 0.2s ease;
      opacity: 0;
    }

    .submenu-open {
      max-height: 500px;
      opacity: 1;
    }

    .submenu-list {
      padding: 4px 0 4px 48px;
      position: relative;
    }

    .submenu-list::before {
      content: '';
      position: absolute;
      left: 29px;
      top: 4px;
      bottom: 4px;
      width: 1px;
      background: linear-gradient(180deg, var(--accent-bg-hover), transparent);
    }

    .submenu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-muted);
      text-decoration: none;
      transition: all 0.2s ease;
    }

    .submenu-item:hover {
      color: var(--text-primary);
      background: var(--nav-item-hover-bg);
    }

    .submenu-item:hover .submenu-dot {
      background: var(--accent-color);
      box-shadow: 0 0 8px var(--accent-glow);
    }

    .submenu-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--text-muted);
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .submenu-item-active {
      color: var(--accent-color) !important;
      background: var(--accent-bg) !important;
    }

    .submenu-item-active .submenu-dot {
      background: var(--accent-color) !important;
      box-shadow: 0 0 12px var(--accent-glow);
    }

    /* ========================================
       User Card
       ======================================== */

    .sidebar-user-card {
      padding: 14px;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      transition: all 0.2s ease;
    }

    .sidebar-user-card:hover {
      border-color: var(--accent-bg-hover);
    }

    .user-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, var(--accent-color), var(--accent-light));
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      color: white;
      flex-shrink: 0;
    }

    .user-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role {
      font-size: 12px;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `]
})
export class SidebarComponent {
  private authService = inject(AuthService);

  @Input() isOpen = true;
  @Output() closeSidebar = new EventEmitter<void>();

  mainMenuItems: NavItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      iconName: 'grid'
    },
    {
      label: 'Tenants',
      route: '/tenants',
      iconName: 'building'
    },
    {
      label: 'Onboarding',
      route: '/onboarding',
      iconName: 'clipboard'
    },
    {
      label: 'Trials',
      route: '/trials',
      iconName: 'clock',
      roles: ['SUPER_ADMIN', 'SALES_REP'],
      badge: 5
    },
    {
      label: 'Support',
      route: '/support',
      iconName: 'support',
      roles: ['SUPER_ADMIN', 'SUPPORT_MANAGER', 'SUPPORT_AGENT'],
      badge: 12
    },
    {
      label: 'Analytics',
      iconName: 'chart',
      children: [
        { label: 'Feature Usage', route: '/analytics/usage', iconName: '' },
        { label: 'Churn Analysis', route: '/analytics/churn', iconName: '' },
        { label: 'Health Scores', route: '/analytics/health', iconName: '' }
      ]
    },
    {
      label: 'Billing',
      iconName: 'credit-card',
      roles: ['SUPER_ADMIN', 'FINANCE_ANALYST'],
      children: [
        { label: 'Revenue', route: '/billing/revenue', iconName: '' },
        { label: 'Projections', route: '/billing/projections', iconName: '' },
        { label: 'Payments', route: '/billing/payments', iconName: '' }
      ]
    },
    {
      label: 'Portal Management',
      iconName: 'globe',
      roles: ['SUPER_ADMIN', 'PORTAL_ADMIN'],
      children: [
        { label: 'Health Dashboard', route: '/portals/health', iconName: '' },
        { label: 'Posting Queue', route: '/portals/queue', iconName: '' },
        { label: 'Failed Postings Queue', route: '/portals/failed-queue', iconName: '' },
        { label: 'Credentials', route: '/portals/credentials', iconName: '' },
        { label: 'Statistics', route: '/portals/statistics', iconName: '' }
      ]
    }
  ];

  workspaceItems: NavItem[] = [
    {
      label: 'Discounts',
      route: '/discounts',
      iconName: 'tag',
      roles: ['SUPER_ADMIN', 'SALES_REP']
    }
  ];

  get sidebarClasses(): string {
    return this.isOpen ? 'translate-x-0' : '-translate-x-full';
  }

  get userInitials(): string {
    const user = this.authService.currentUser();
    if (!user) return 'U';
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`;
  }

  get userName(): string {
    const user = this.authService.currentUser();
    if (!user) return 'User';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
  }

  get userRole(): string {
    const user = this.authService.currentUser();
    return user?.roles?.[0]?.name || 'Member';
  }

  canAccess(item: NavItem): boolean {
    if (!item.roles || item.roles.length === 0) {
      return true;
    }
    return this.authService.hasRole(...item.roles);
  }

  toggleExpand(item: NavItem): void {
    item.expanded = !item.expanded;
  }
}
