import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  SupportService,
  TicketSummary,
  AdminTicketStats,
  TicketStatus,
  TicketPriority,
  CategoryResponse
} from '@core/services/support.service';

@Component({
  selector: 'app-support-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  template: `
    <div class="space-y-6">
      <div class="sw-page-header">
        <div>
          <h1 class="sw-page-title">{{ 'support.admin.title' | translate }}</h1>
          <p class="sw-page-description">{{ 'support.admin.description' | translate }}</p>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span class="material-icons text-blue-600 dark:text-blue-400">fiber_new</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{{ stats()?.newTickets ?? 0 }}</p>
              <p class="text-sm text-neutral-500">{{ 'support.stats.new' | translate }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <span class="material-icons text-yellow-600 dark:text-yellow-400">pending_actions</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{{ stats()?.inProgress ?? 0 }}</p>
              <p class="text-sm text-neutral-500">{{ 'support.stats.inProgress' | translate }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <span class="material-icons text-green-600 dark:text-green-400">check_circle</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{{ stats()?.resolvedToday ?? 0 }}</p>
              <p class="text-sm text-neutral-500">{{ 'support.stats.resolvedToday' | translate }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <span class="material-icons text-red-600 dark:text-red-400">warning</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{{ stats()?.overdueTickets ?? 0 }}</p>
              <p class="text-sm text-neutral-500">{{ 'support.stats.overdue' | translate }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters and Search -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
        <div class="flex flex-wrap items-center gap-4">
          <!-- Search -->
          <div class="flex-1 min-w-[200px]">
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-neutral-400 text-xl">search</span>
              <input
                type="text"
                [(ngModel)]="searchTerm"
                (keyup.enter)="applyFilters()"
                class="sw-input pl-10"
                [placeholder]="'support.ticketList.searchPlaceholder' | translate"
              />
            </div>
          </div>

          <!-- Status Filter -->
          <select
            [(ngModel)]="statusFilter"
            (change)="applyFilters()"
            class="sw-select w-auto"
          >
            <option value="">{{ 'support.filters.allStatuses' | translate }}</option>
            <option value="NEW">{{ 'support.status.new' | translate }}</option>
            <option value="IN_PROGRESS">{{ 'support.status.inProgress' | translate }}</option>
            <option value="PENDING">{{ 'support.status.pending' | translate }}</option>
            <option value="RESOLVED">{{ 'support.status.resolved' | translate }}</option>
            <option value="CLOSED">{{ 'support.status.closed' | translate }}</option>
          </select>

          <!-- Priority Filter -->
          <select
            [(ngModel)]="priorityFilter"
            (change)="applyFilters()"
            class="sw-select w-auto"
          >
            <option value="">{{ 'support.filters.allPriorities' | translate }}</option>
            <option value="LOW">{{ 'support.priority.low' | translate }}</option>
            <option value="MEDIUM">{{ 'support.priority.medium' | translate }}</option>
            <option value="HIGH">{{ 'support.priority.high' | translate }}</option>
            <option value="URGENT">{{ 'support.priority.urgent' | translate }}</option>
          </select>

          <!-- Category Filter -->
          <select
            [(ngModel)]="categoryFilter"
            (change)="applyFilters()"
            class="sw-select w-auto"
          >
            <option value="">{{ 'support.filters.allCategories' | translate }}</option>
            @for (cat of categories(); track cat.code) {
              <option [value]="cat.code">{{ cat.name }}</option>
            }
          </select>

          <button
            type="button"
            class="sw-btn sw-btn-outline"
            (click)="clearFilters()"
          >
            {{ 'common.buttons.clear' | translate }}
          </button>
        </div>
      </div>

      <!-- Tickets Table -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
        @if (loading()) {
          <div class="p-12 text-center">
            <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 animate-spin mb-4">refresh</span>
            <p class="text-neutral-500">{{ 'support.ticketList.loading' | translate }}</p>
          </div>
        } @else if (error()) {
          <div class="p-12 text-center">
            <span class="material-icons text-5xl text-red-300 dark:text-red-600 mb-4">error_outline</span>
            <h2 class="text-lg font-semibold text-neutral-600 dark:text-neutral-400">{{ 'support.ticketList.errorLoading' | translate }}</h2>
            <p class="text-neutral-500 dark:text-neutral-500 mb-4">{{ error() }}</p>
            <button (click)="loadTickets()" class="sw-btn sw-btn-primary">
              <span class="material-icons text-lg">refresh</span>
              {{ 'common.buttons.retry' | translate }}
            </button>
          </div>
        } @else if (tickets().length === 0) {
          <div class="p-12 text-center">
            <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4">inbox</span>
            <h2 class="text-lg font-semibold text-neutral-600 dark:text-neutral-400">{{ 'support.ticketList.noTicketsFound' | translate }}</h2>
            <p class="text-neutral-500 dark:text-neutral-500">{{ 'support.ticketList.noTicketsMatch' | translate }}</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-neutral-50 dark:bg-dark-elevated border-b border-neutral-200 dark:border-dark-border">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">{{ 'support.ticketList.columnTicket' | translate }}</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">{{ 'support.ticketList.columnSubject' | translate }}</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">{{ 'support.ticketList.columnRequester' | translate }}</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">{{ 'support.ticketList.columnStatus' | translate }}</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">{{ 'support.ticketList.columnPriority' | translate }}</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">{{ 'support.ticketList.columnAssigned' | translate }}</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">{{ 'support.ticketList.columnCreated' | translate }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-200 dark:divide-dark-border">
                @for (ticket of tickets(); track ticket.id) {
                  <tr
                    class="hover:bg-neutral-50 dark:hover:bg-dark-elevated cursor-pointer transition-colors"
                    [routerLink]="['/support/admin/tickets', ticket.id]"
                  >
                    <td class="px-4 py-3">
                      <span class="font-mono text-sm text-primary-600 dark:text-primary-400">{{ ticket.ticketReference }}</span>
                    </td>
                    <td class="px-4 py-3">
                      <div class="max-w-xs truncate text-neutral-900 dark:text-neutral-100">{{ ticket.subject }}</div>
                      <div class="text-xs text-neutral-500">{{ ticket.categoryName }}</div>
                    </td>
                    <td class="px-4 py-3 text-neutral-700 dark:text-neutral-300">{{ ticket.requesterName }}</td>
                    <td class="px-4 py-3">
                      <span [class]="statusBadgeClasses(ticket.status)">{{ formatStatus(ticket.status) }}</span>
                    </td>
                    <td class="px-4 py-3">
                      <span [class]="priorityBadgeClasses(ticket.priority)">{{ ticket.priority }}</span>
                    </td>
                    <td class="px-4 py-3 text-neutral-700 dark:text-neutral-300">{{ ticket.assignedUserName || ticket.assignedTeam }}</td>
                    <td class="px-4 py-3 text-sm text-neutral-500">{{ formatDate(ticket.createdAt) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="p-4 border-t border-neutral-200 dark:border-dark-border flex items-center justify-between">
              <p class="text-sm text-neutral-500">
                {{ 'common.pagination.pageWithCount' | translate: { current: currentPage() + 1, total: totalPages(), count: totalElements() } }}
              </p>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="sw-btn sw-btn-outline"
                  [disabled]="currentPage() === 0"
                  (click)="goToPage(currentPage() - 1)"
                >
                  {{ 'common.buttons.previous' | translate }}
                </button>
                <button
                  type="button"
                  class="sw-btn sw-btn-outline"
                  [disabled]="currentPage() >= totalPages() - 1"
                  (click)="goToPage(currentPage() + 1)"
                >
                  {{ 'common.buttons.next' | translate }}
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
export class SupportAdminComponent implements OnInit {
  private readonly supportService = inject(SupportService);

  loading = signal(true);
  error = signal<string | null>(null);
  tickets = signal<TicketSummary[]>([]);
  stats = signal<AdminTicketStats | null>(null);
  categories = signal<CategoryResponse[]>([]);
  currentPage = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);

  // Filters
  searchTerm = '';
  statusFilter = '';
  priorityFilter = '';
  categoryFilter = '';

  ngOnInit(): void {
    this.loadCategories();
    this.loadStats();
    this.loadTickets();
  }

  loadCategories(): void {
    this.supportService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  loadStats(): void {
    this.supportService.getAdminStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
      },
      error: (err) => {
        console.error('Error loading stats:', err);
      }
    });
  }

  loadTickets(): void {
    this.loading.set(true);
    this.error.set(null);

    this.supportService.searchTickets({
      status: this.statusFilter as TicketStatus || undefined,
      priority: this.priorityFilter as TicketPriority || undefined,
      category: this.categoryFilter || undefined,
      search: this.searchTerm || undefined,
      page: this.currentPage(),
      size: 20
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

  applyFilters(): void {
    this.currentPage.set(0);
    this.loadTickets();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.priorityFilter = '';
    this.categoryFilter = '';
    this.currentPage.set(0);
    this.loadTickets();
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadTickets();
  }

  statusBadgeClasses(status: TicketStatus): string {
    const base = 'px-2 py-0.5 text-xs font-medium rounded';
    switch (status) {
      case 'NEW': return `${base} bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300`;
      case 'IN_PROGRESS': return `${base} bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300`;
      case 'PENDING': return `${base} bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300`;
      case 'RESOLVED': return `${base} bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300`;
      case 'CLOSED': return `${base} bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400`;
      default: return `${base} bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400`;
    }
  }

  priorityBadgeClasses(priority: TicketPriority): string {
    const base = 'px-2 py-0.5 text-xs font-medium rounded';
    switch (priority) {
      case 'URGENT': return `${base} bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300`;
      case 'HIGH': return `${base} bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300`;
      case 'MEDIUM': return `${base} bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300`;
      default: return `${base} bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400`;
    }
  }

  formatStatus(status: TicketStatus): string {
    return status.replace('_', ' ');
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-ZA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
