import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SupportService, TicketSummary, TicketStats, TicketStatus, TicketPriority } from '@core/services/support.service';

@Component({
  selector: 'app-support-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{{ 'support.dashboard.title' | translate }}</h1>
          <p class="text-neutral-500 dark:text-neutral-400 mt-1">{{ 'support.dashboard.subtitle' | translate }}</p>
        </div>
        <a
          routerLink="/support/new"
          class="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-fast"
        >
          <span class="material-icons text-lg">add</span>
          {{ 'support.dashboard.newTicket' | translate }}
        </a>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- Open Tickets -->
        <div class="group relative bg-white dark:bg-dark-surface rounded-xl border border-neutral-200 dark:border-dark-border p-5 hover:shadow-md transition-shadow overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent"></div>
          <div class="relative flex items-center gap-4">
            <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <span class="material-icons text-primary-600 dark:text-primary-400">inbox</span>
            </div>
            <div>
              <p class="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{{ stats()?.open ?? 0 }}</p>
              <p class="text-sm font-medium text-neutral-500 dark:text-neutral-400">{{ 'support.dashboard.stats.openTickets' | translate }}</p>
            </div>
          </div>
        </div>

        <!-- Awaiting Response -->
        <div class="group relative bg-white dark:bg-dark-surface rounded-xl border border-neutral-200 dark:border-dark-border p-5 hover:shadow-md transition-shadow overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent"></div>
          <div class="relative flex items-center gap-4">
            <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <span class="material-icons text-amber-600 dark:text-amber-400">schedule</span>
            </div>
            <div>
              <p class="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{{ stats()?.pending ?? 0 }}</p>
              <p class="text-sm font-medium text-neutral-500 dark:text-neutral-400">{{ 'support.dashboard.stats.awaitingResponse' | translate }}</p>
            </div>
          </div>
        </div>

        <!-- Resolved -->
        <div class="group relative bg-white dark:bg-dark-surface rounded-xl border border-neutral-200 dark:border-dark-border p-5 hover:shadow-md transition-shadow overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent"></div>
          <div class="relative flex items-center gap-4">
            <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <span class="material-icons text-emerald-600 dark:text-emerald-400">check_circle</span>
            </div>
            <div>
              <p class="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{{ stats()?.resolved ?? 0 }}</p>
              <p class="text-sm font-medium text-neutral-500 dark:text-neutral-400">{{ 'support.dashboard.stats.resolved' | translate }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tickets List Card -->
      <div class="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200 dark:border-dark-border overflow-hidden">
        <!-- Filter Tabs -->
        <div class="px-5 py-4 border-b border-neutral-200 dark:border-dark-border">
          <div class="inline-flex p-1 bg-neutral-100 dark:bg-dark-elevated rounded-lg">
            @for (filter of filters; track filter.value) {
              <button
                type="button"
                [class]="getTabClasses(filter.value)"
                (click)="onFilterChange(filter.value)"
              >
                {{ filter.labelKey | translate }}
                @if (filter.value === 'all' && stats()) {
                  <span class="ml-1.5 px-1.5 py-0.5 text-xs rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                    {{ stats()!.total }}
                  </span>
                }
              </button>
            }
          </div>
        </div>

        <!-- Loading State -->
        @if (loading()) {
          <div class="p-16 text-center">
            <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 mb-4">
              <span class="material-icons text-2xl text-primary-600 dark:text-primary-400 animate-spin">sync</span>
            </div>
            <p class="text-neutral-500 dark:text-neutral-400">{{ 'support.dashboard.loading' | translate }}</p>
          </div>
        }

        <!-- Error State -->
        @else if (error()) {
          <div class="p-16 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <span class="material-icons text-3xl text-red-500 dark:text-red-400">error_outline</span>
            </div>
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{{ 'support.dashboard.error.title' | translate }}</h3>
            <p class="text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm mx-auto">{{ error() }}</p>
            <button
              type="button"
              (click)="loadTickets()"
              class="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors duration-fast"
            >
              <span class="material-icons text-lg">refresh</span>
              {{ 'support.dashboard.error.tryAgain' | translate }}
            </button>
          </div>
        }

        <!-- Empty State -->
        @else if (tickets().length === 0) {
          <div class="p-16 text-center">
            <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-neutral-100 dark:bg-dark-elevated mb-6">
              <span class="material-icons text-4xl text-neutral-400 dark:text-neutral-500">support_agent</span>
            </div>
            <h3 class="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{{ 'support.dashboard.empty.title' | translate }}</h3>
            <p class="text-neutral-500 dark:text-neutral-400 mb-6 max-w-md mx-auto">
              {{ 'support.dashboard.empty.description' | translate }}
            </p>
            <a
              routerLink="/support/new"
              class="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors duration-fast"
            >
              <span class="material-icons text-lg">add</span>
              {{ 'support.dashboard.empty.createFirst' | translate }}
            </a>
          </div>
        }

        <!-- Tickets List -->
        @else {
          <div class="divide-y divide-neutral-100 dark:divide-dark-border">
            @for (ticket of tickets(); track ticket.id) {
              <a
                [routerLink]="['/support', ticket.id]"
                class="group flex items-center gap-4 p-5 hover:bg-neutral-50 dark:hover:bg-dark-elevated transition-colors"
              >
                <!-- Status Indicator -->
                <div class="flex-shrink-0">
                  <div [class]="getStatusIconClasses(ticket.status)">
                    <span class="material-icons text-lg">{{ getStatusIcon(ticket.status) }}</span>
                  </div>
                </div>

                <!-- Ticket Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs font-mono text-neutral-400 dark:text-neutral-500">{{ ticket.ticketReference }}</span>
                    <span [class]="getPriorityClasses(ticket.priority)">{{ getPriorityLabel(ticket.priority) }}</span>
                  </div>
                  <h4 class="font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate transition-colors">
                    {{ ticket.subject }}
                  </h4>
                  <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{{ ticket.categoryName }}</p>
                </div>

                <!-- Status & Date -->
                <div class="flex-shrink-0 text-right">
                  <span [class]="getStatusBadgeClasses(ticket.status)">
                    {{ getStatusLabel(ticket.status) }}
                  </span>
                  <p class="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5">{{ formatDate(ticket.updatedAt) }}</p>
                </div>

                <!-- Arrow -->
                <span class="material-icons text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-400 dark:group-hover:text-neutral-500 transition-colors">
                  chevron_right
                </span>
              </a>
            }
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="px-5 py-4 border-t border-neutral-200 dark:border-dark-border flex items-center justify-between bg-neutral-50 dark:bg-dark-elevated/50">
              <p class="text-sm text-neutral-500 dark:text-neutral-400">
                {{ 'support.dashboard.pagination.showingPage' | translate }} <span class="font-medium text-neutral-700 dark:text-neutral-300">{{ currentPage() + 1 }}</span> {{ 'support.dashboard.pagination.of' | translate }}
                <span class="font-medium text-neutral-700 dark:text-neutral-300">{{ totalPages() }}</span>
              </p>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 bg-white dark:bg-dark-surface border border-neutral-300 dark:border-dark-border rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  [disabled]="currentPage() === 0"
                  (click)="goToPage(currentPage() - 1)"
                >
                  <span class="material-icons text-lg">chevron_left</span>
                  {{ 'support.dashboard.pagination.previous' | translate }}
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 bg-white dark:bg-dark-surface border border-neutral-300 dark:border-dark-border rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  [disabled]="currentPage() >= totalPages() - 1"
                  (click)="goToPage(currentPage() + 1)"
                >
                  {{ 'support.dashboard.pagination.next' | translate }}
                  <span class="material-icons text-lg">chevron_right</span>
                </button>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupportDashboardComponent implements OnInit {
  private readonly supportService = inject(SupportService);
  private readonly translate = inject(TranslateService);

  activeFilter = signal<string>('all');
  loading = signal(true);
  error = signal<string | null>(null);
  tickets = signal<TicketSummary[]>([]);
  stats = signal<TicketStats | null>(null);
  currentPage = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);

  filters = [
    { labelKey: 'support.dashboard.filters.all', value: 'all' },
    { labelKey: 'support.dashboard.filters.open', value: 'open' },
    { labelKey: 'support.dashboard.filters.resolved', value: 'resolved' }
  ];

  ngOnInit(): void {
    this.loadTickets();
    this.loadStats();
  }

  loadTickets(): void {
    this.loading.set(true);
    this.error.set(null);

    this.supportService.getMyTickets({
      status: this.activeFilter() as any,
      page: this.currentPage(),
      size: 10
    }).subscribe({
      next: (response) => {
        this.tickets.set(response.content);
        this.totalPages.set(response.totalPages);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading tickets:', err);
        this.error.set(err.message || 'Failed to load tickets');
        this.loading.set(false);
      }
    });
  }

  loadStats(): void {
    this.supportService.getTicketStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
      },
      error: (err) => {
        console.error('Error loading stats:', err);
      }
    });
  }

  onFilterChange(filter: string): void {
    this.activeFilter.set(filter);
    this.currentPage.set(0);
    this.loadTickets();
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadTickets();
  }

  getTabClasses(value: string): string {
    const base = 'px-4 py-2 text-sm font-medium rounded-md transition-all duration-150';
    if (this.activeFilter() === value) {
      return `${base} bg-white dark:bg-dark-surface text-neutral-900 dark:text-neutral-100 shadow-sm`;
    }
    return `${base} text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200`;
  }

  getStatusIcon(status: TicketStatus): string {
    switch (status) {
      case 'NEW': return 'fiber_new';
      case 'IN_PROGRESS': return 'sync';
      case 'PENDING': return 'schedule';
      case 'RESOLVED': return 'check_circle';
      case 'CLOSED': return 'archive';
      default: return 'help_outline';
    }
  }

  getStatusIconClasses(status: TicketStatus): string {
    const base = 'w-10 h-10 rounded-lg flex items-center justify-center';
    switch (status) {
      case 'NEW': return `${base} bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400`;
      case 'IN_PROGRESS': return `${base} bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400`;
      case 'PENDING': return `${base} bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400`;
      case 'RESOLVED': return `${base} bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400`;
      case 'CLOSED': return `${base} bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400`;
      default: return `${base} bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400`;
    }
  }

  getPriorityClasses(priority: TicketPriority): string {
    const base = 'inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded';
    switch (priority) {
      case 'URGENT': return `${base} bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300`;
      case 'HIGH': return `${base} bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300`;
      case 'MEDIUM': return `${base} bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300`;
      default: return `${base} bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300`;
    }
  }

  getStatusBadgeClasses(status: TicketStatus): string {
    const base = 'inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full';
    switch (status) {
      case 'NEW': return `${base} bg-primary-100 dark:bg-primary-900/30 text-blue-700 dark:text-blue-300`;
      case 'IN_PROGRESS': return `${base} bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300`;
      case 'PENDING': return `${base} bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300`;
      case 'RESOLVED': return `${base} bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300`;
      case 'CLOSED': return `${base} bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300`;
      default: return `${base} bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300`;
    }
  }

  getStatusLabel(status: TicketStatus): string {
    const statusKeys: Record<TicketStatus, string> = {
      NEW: 'support.dashboard.status.new',
      IN_PROGRESS: 'support.dashboard.status.inProgress',
      PENDING: 'support.dashboard.status.pending',
      RESOLVED: 'support.dashboard.status.resolved',
      CLOSED: 'support.dashboard.status.closed'
    };
    return this.translate.instant(statusKeys[status] || status);
  }

  getPriorityLabel(priority: TicketPriority): string {
    const priorityKeys: Record<TicketPriority, string> = {
      LOW: 'support.dashboard.priority.low',
      MEDIUM: 'support.dashboard.priority.medium',
      HIGH: 'support.dashboard.priority.high',
      URGENT: 'support.dashboard.priority.urgent'
    };
    return this.translate.instant(priorityKeys[priority] || priority);
  }

  formatDate(date: string): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return this.translate.instant('support.dashboard.date.today');
    } else if (diffDays === 1) {
      return this.translate.instant('support.dashboard.date.yesterday');
    } else if (diffDays < 7) {
      return this.translate.instant('support.dashboard.date.daysAgo', { days: diffDays });
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
