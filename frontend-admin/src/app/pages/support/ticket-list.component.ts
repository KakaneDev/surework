import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TicketService } from '@core/services/ticket.service';
import { TenantService } from '@core/services/tenant.service';
import { Ticket, TicketFilters, TicketStatus, TicketPriority, CreateTicketRequest } from '@core/models/ticket.model';
import { Tenant } from '@core/models/tenant.model';
import { BadgeComponent, BadgeColor } from '@core/components/ui/badge.component';
import { ButtonComponent } from '@core/components/ui/button.component';
import { InputComponent } from '@core/components/ui/input.component';
import { SelectComponent, SelectOption } from '@core/components/ui/select.component';
import { TableComponent, TableColumn } from '@core/components/ui/table.component';
import { ModalComponent } from '@core/components/ui/modal.component';
import { PaginationComponent } from '@core/components/ui/pagination.component';
import { ErrorStateComponent } from '@core/components/ui/error-state.component';
import { RelativeTimePipe } from '@core/pipes/relative-time.pipe';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    BadgeComponent,
    ButtonComponent,
    InputComponent,
    SelectComponent,
    TableComponent,
    ModalComponent,
    PaginationComponent,
    ErrorStateComponent,
    RelativeTimePipe
  ],
  template: `
    <div class="flex flex-col gap-6">
      <!-- Page Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Support Tickets</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage customer support requests</p>
        </div>
        <app-button (onClick)="showCreateModal = true">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          New Ticket
        </app-button>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stats-card">
          <p class="stats-card-label">Open</p>
          <p class="stats-card-value">{{ stats().open }}</p>
        </div>
        <div class="stats-card">
          <p class="stats-card-label">In Progress</p>
          <p class="stats-card-value">{{ stats().inProgress }}</p>
        </div>
        <div class="stats-card">
          <p class="stats-card-label">Resolved</p>
          <p class="stats-card-value">{{ stats().resolved }}</p>
        </div>
        <div class="stats-card">
          <p class="stats-card-label">SLA Breach Rate</p>
          <p class="stats-card-value">{{ stats().slaBreachRate }}%</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div class="grid gap-4 md:grid-cols-4">
          <app-input
            placeholder="Search tickets..."
            [(ngModel)]="searchTerm"
            (ngModelChange)="onSearchChange($event)"
            [prefixIcon]="true"
          >
            <svg prefix class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </app-input>

          <app-select
            placeholder="All Statuses"
            [options]="statusOptions"
            [(ngModel)]="filters.status"
            (ngModelChange)="loadTickets()"
          />

          <app-select
            placeholder="All Priorities"
            [options]="priorityOptions"
            [(ngModel)]="filters.priority"
            (ngModelChange)="loadTickets()"
          />

          <app-select
            placeholder="All Assignees"
            [options]="assigneeOptions"
            [(ngModel)]="filters.assignedTo"
            (ngModelChange)="loadTickets()"
          />
        </div>
      </div>

      <!-- Table -->
      <app-table
        [columns]="columns"
        [data]="tickets()"
        [loading]="loading()"
      >
        @for (ticket of tickets(); track ticket.id) {
          <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
            <td class="px-4 py-3">
              <a
                [routerLink]="['/support', ticket.id]"
                class="font-medium text-gray-900 hover:text-gray-600 dark:text-white dark:hover:text-gray-300"
              >
                {{ ticket.subject }}
              </a>
              <p class="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{{ ticket.tenantName }}</p>
            </td>
            <td class="px-4 py-3">
              <app-badge [color]="getStatusColor(ticket.status)">{{ ticket.status }}</app-badge>
            </td>
            <td class="px-4 py-3">
              <app-badge [color]="getPriorityColor(ticket.priority)" size="sm">{{ ticket.priority }}</app-badge>
            </td>
            <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
              {{ ticket.assignedToName || 'Unassigned' }}
            </td>
            <td class="px-4 py-3">
              @if (ticket.slaDueAt) {
                <span [class]="isSlaBreached(ticket) ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'">
                  {{ ticket.slaDueAt | relativeTime }}
                </span>
              } @else {
                <span class="text-gray-400">-</span>
              }
            </td>
            <td class="px-4 py-3 text-gray-500 dark:text-gray-400">
              {{ ticket.createdAt | relativeTime }}
            </td>
            <td class="px-4 py-3">
              <a
                [routerLink]="['/support', ticket.id]"
                class="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                View
              </a>
            </td>
          </tr>
        }
      </app-table>

      <!-- Pagination -->
      <app-pagination
        [currentPage]="filters.page"
        [pageSize]="filters.size"
        [totalElements]="totalElements()"
        (pageChange)="onPageChange($event)"
      />
    </div>

    <!-- New Ticket Modal -->
    <app-modal
      [isOpen]="showCreateModal"
      title="Create New Ticket"
      (close)="closeCreateModal()"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search Tenant</label>
          <app-input
            placeholder="Search for a tenant..."
            [(ngModel)]="tenantSearchTerm"
            (ngModelChange)="searchTenants($event)"
          />
          @if (tenantSearchResults().length > 0) {
            <div class="mt-2 rounded-md border border-gray-200 dark:border-gray-700 max-h-32 overflow-y-auto">
              @for (tenant of tenantSearchResults(); track tenant.id) {
                <button
                  type="button"
                  (click)="selectTenant(tenant)"
                  class="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                  [class.bg-gray-100]="selectedTenant?.id === tenant.id"
                  [class.dark:bg-gray-700]="selectedTenant?.id === tenant.id"
                >
                  {{ tenant.companyName }} <span class="text-gray-500">({{ tenant.email }})</span>
                </button>
              }
            </div>
          }
          @if (selectedTenant) {
            <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Selected: <strong>{{ selectedTenant.companyName }}</strong>
            </div>
          }
        </div>
        <app-input
          label="Subject"
          [(ngModel)]="newTicketForm.subject"
          placeholder="Brief description of the issue"
        />
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea
            [(ngModel)]="newTicketForm.description"
            rows="4"
            class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-700 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            placeholder="Detailed description of the issue..."
          ></textarea>
        </div>
        <app-select
          label="Priority"
          [options]="newTicketPriorityOptions"
          [(ngModel)]="newTicketForm.priority"
        />
      </div>
      <div modal-footer class="flex justify-end gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-700">
        <app-button variant="outline" (onClick)="closeCreateModal()">Cancel</app-button>
        <app-button
          [loading]="creating()"
          [disabled]="!selectedTenant || !newTicketForm.subject"
          (onClick)="createTicket()"
        >
          Create Ticket
        </app-button>
      </div>
    </app-modal>
  `
})
export class TicketListComponent implements OnInit {
  private ticketService = inject(TicketService);
  private tenantService = inject(TenantService);
  private searchSubject = new Subject<string>();
  private tenantSearchSubject = new Subject<string>();

  loading = signal(true);
  tickets = signal<Ticket[]>([]);
  totalElements = signal(0);
  stats = signal({ open: 0, inProgress: 0, resolved: 0, slaBreachRate: 0 });
  hasError = signal(false);
  errorMessage = signal('');

  showCreateModal = false;
  searchTerm = '';
  filters: TicketFilters = { page: 0, size: 20 };

  // New Ticket Form State
  creating = signal(false);
  tenantSearchTerm = '';
  tenantSearchResults = signal<Tenant[]>([]);
  selectedTenant: Tenant | null = null;
  newTicketForm = {
    subject: '',
    description: '',
    priority: 'MEDIUM' as TicketPriority
  };

  newTicketPriorityOptions: SelectOption[] = [
    { label: 'Low', value: 'LOW' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'High', value: 'HIGH' },
    { label: 'Urgent', value: 'URGENT' }
  ];

  columns: TableColumn[] = [
    { key: 'subject', label: 'Subject' },
    { key: 'status', label: 'Status' },
    { key: 'priority', label: 'Priority' },
    { key: 'assignedTo', label: 'Assigned To' },
    { key: 'slaDue', label: 'SLA Due' },
    { key: 'createdAt', label: 'Created' },
    { key: 'actions', label: '' }
  ];

  statusOptions: SelectOption[] = [
    { label: 'All Statuses', value: '' },
    { label: 'Open', value: 'OPEN' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Waiting on Customer', value: 'WAITING_ON_CUSTOMER' },
    { label: 'Resolved', value: 'RESOLVED' },
    { label: 'Closed', value: 'CLOSED' }
  ];

  priorityOptions: SelectOption[] = [
    { label: 'All Priorities', value: '' },
    { label: 'Low', value: 'LOW' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'High', value: 'HIGH' },
    { label: 'Urgent', value: 'URGENT' }
  ];

  assigneeOptions: SelectOption[] = [
    { label: 'All Assignees', value: '' },
    { label: 'Unassigned', value: 'UNASSIGNED' }
  ];

  ngOnInit(): void {
    this.searchSubject.pipe(debounceTime(300)).subscribe(term => {
      this.filters.search = term;
      this.filters.page = 0;
      this.loadTickets();
    });

    this.tenantSearchSubject.pipe(debounceTime(300)).subscribe(term => {
      if (term.length >= 2) {
        this.tenantService.searchTenants(term, 5).subscribe({
          next: (tenants) => this.tenantSearchResults.set(tenants),
          error: () => this.tenantSearchResults.set([])
        });
      } else {
        this.tenantSearchResults.set([]);
      }
    });

    this.loadTickets();
    this.loadStats();
  }

  loadTickets(): void {
    this.loading.set(true);
    this.hasError.set(false);
    this.ticketService.getTickets(this.filters).subscribe({
      next: (response) => {
        this.tickets.set(response.content);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.hasError.set(true);
        this.errorMessage.set('Failed to load tickets. Please try again.');
      }
    });
  }

  loadStats(): void {
    this.ticketService.getTicketStats().subscribe({
      next: (stats) => this.stats.set(stats),
      error: () => this.stats.set({ open: 12, inProgress: 8, resolved: 45, slaBreachRate: 5 })
    });
  }

  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }

  onPageChange(page: number): void {
    this.filters.page = page;
    this.loadTickets();
  }

  getStatusColor(status: TicketStatus): BadgeColor {
    const colors: Record<TicketStatus, BadgeColor> = {
      OPEN: 'warning',
      IN_PROGRESS: 'outline',
      WAITING_ON_CUSTOMER: 'gray',
      RESOLVED: 'success',
      CLOSED: 'gray'
    };
    return colors[status] || 'gray';
  }

  getPriorityColor(priority: TicketPriority): BadgeColor {
    const colors: Record<TicketPriority, BadgeColor> = {
      LOW: 'gray',
      MEDIUM: 'outline',
      HIGH: 'warning',
      URGENT: 'error'
    };
    return colors[priority] || 'gray';
  }

  isSlaBreached(ticket: Ticket): boolean {
    if (!ticket.slaDueAt) return false;
    return new Date(ticket.slaDueAt) < new Date();
  }

  searchTenants(term: string): void {
    this.tenantSearchSubject.next(term);
  }

  selectTenant(tenant: Tenant): void {
    this.selectedTenant = tenant;
    this.tenantSearchResults.set([]);
    this.tenantSearchTerm = tenant.companyName;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.resetNewTicketForm();
  }

  resetNewTicketForm(): void {
    this.newTicketForm = { subject: '', description: '', priority: 'MEDIUM' };
    this.selectedTenant = null;
    this.tenantSearchTerm = '';
    this.tenantSearchResults.set([]);
  }

  createTicket(): void {
    if (!this.selectedTenant || !this.newTicketForm.subject) return;

    this.creating.set(true);
    const request: CreateTicketRequest = {
      tenantId: this.selectedTenant.id,
      subject: this.newTicketForm.subject,
      description: this.newTicketForm.description,
      priority: this.newTicketForm.priority
    };

    this.ticketService.createTicket(request).subscribe({
      next: () => {
        this.closeCreateModal();
        this.creating.set(false);
        this.loadTickets();
        this.loadStats();
      },
      error: () => this.creating.set(false)
    });
  }

  retryLoad(): void {
    this.loadTickets();
    this.loadStats();
  }
}
