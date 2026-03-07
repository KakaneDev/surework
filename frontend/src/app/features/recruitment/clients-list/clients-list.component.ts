import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  RecruitmentService,
  Client
} from '../../../core/services/recruitment.service';
import { SpinnerComponent, DropdownComponent, DropdownItemComponent, ToastService, TableSkeletonComponent } from '@shared/ui';

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    TranslateModule,
    SpinnerComponent,
    DropdownComponent,
    DropdownItemComponent,
    DatePipe,
    TableSkeletonComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="sw-page-header">
        <div class="flex items-center gap-3">
          <a routerLink="/recruitment" class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated transition-colors" title="Back" aria-label="Back">
            <span class="material-icons" aria-hidden="true">arrow_back</span>
          </a>
          <span class="material-icons text-3xl text-primary-500">business</span>
          <div>
            <h1 class="sw-page-title">Clients</h1>
            <p class="sw-page-description">Manage client companies for recruitment engagements</p>
          </div>
        </div>
        <a routerLink="/recruitment/clients/new" class="sw-btn sw-btn-primary sw-btn-md">
          <span class="material-icons text-lg">add_business</span>
          Add Client
        </a>
      </div>

      <!-- Filters -->
      <div class="flex items-center gap-4 flex-wrap">
        <div class="relative flex-1 min-w-[250px]">
          <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">search</span>
          <input
            type="text"
            [formControl]="searchControl"
            placeholder="Search clients by name, industry, contact..."
            class="sw-input pl-10 w-full"
          />
        </div>

        <select [formControl]="activeControl" class="sw-input w-40">
          <option value="">All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <button (click)="clearFilters()" [disabled]="!hasFilters()"
                class="sw-btn sw-btn-ghost sw-btn-sm" title="Clear">
          <span class="material-icons text-lg">clear</span>
          Clear
        </button>
      </div>

      <!-- Content -->
      @if (loading()) {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
          <sw-table-skeleton [columns]="6" [rows]="10" [showActions]="true" />
        </div>
      } @else if (clients().length === 0) {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4">business</span>
          <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">No clients found</h3>
          @if (hasFilters()) {
            <p class="text-neutral-500 dark:text-neutral-400 mb-4">Try adjusting your filters</p>
            <button (click)="clearFilters()" class="px-4 py-2 text-primary-500 hover:text-primary-600 font-medium">
              Clear filters
            </button>
          } @else {
            <p class="text-neutral-500 dark:text-neutral-400 mb-4">Add your first client to get started</p>
            <a routerLink="/recruitment/clients/new" class="sw-btn sw-btn-primary sw-btn-md">
              Add Client
            </a>
          }
        </div>
      } @else {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
          <div class="overflow-x-auto">
            <table class="sw-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Industry</th>
                  <th>Contact Person</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Added</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (client of clients(); track client.id) {
                  <tr class="cursor-pointer hover:bg-neutral-50 dark:hover:bg-dark-elevated"
                      [routerLink]="['/recruitment/clients', client.id, 'edit']">
                    <td>
                      <a [routerLink]="['/recruitment/clients', client.id, 'edit']" class="text-primary-500 hover:text-primary-600 font-medium">
                        {{ client.name }}
                      </a>
                    </td>
                    <td class="text-neutral-600 dark:text-neutral-400">{{ getIndustryLabel(client.industry) }}</td>
                    <td class="text-neutral-600 dark:text-neutral-400">{{ client.contactPerson || '-' }}</td>
                    <td class="text-neutral-600 dark:text-neutral-400">{{ client.contactEmail || '-' }}</td>
                    <td>
                      <span class="inline-block px-3 py-1 rounded-full text-xs font-medium"
                            [style.background]="client.active ? '#d1fae5' : '#e5e7eb'"
                            [style.color]="client.active ? '#065f46' : '#374151'">
                        {{ client.active ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td class="text-neutral-600 dark:text-neutral-400">{{ client.createdAt | date:'mediumDate' }}</td>
                    <td (click)="$event.stopPropagation()">
                      <sw-dropdown position="bottom-end">
                        <button trigger class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated" title="Actions" aria-label="More options">
                          <span class="material-icons">more_vert</span>
                        </button>
                        <sw-dropdown-item icon="edit" [routerLink]="['/recruitment/clients', client.id, 'edit']">Edit</sw-dropdown-item>
                        @if (client.active) {
                          <sw-dropdown-item icon="block" (click)="deactivateClient(client)">Deactivate</sw-dropdown-item>
                        }
                      </sw-dropdown>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-dark-border">
            <div class="text-sm text-neutral-500 dark:text-neutral-400">
              Showing {{ (pageIndex() * pageSize()) + 1 }} - {{ Math.min((pageIndex() + 1) * pageSize(), totalElements()) }} of {{ totalElements() }}
            </div>
            <div class="flex items-center gap-2">
              <button (click)="goToPage(0)" [disabled]="pageIndex() === 0"
                      class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed"
                      title="First page">
                <span class="material-icons">first_page</span>
              </button>
              <button (click)="goToPage(pageIndex() - 1)" [disabled]="pageIndex() === 0"
                      class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Previous">
                <span class="material-icons">chevron_left</span>
              </button>
              <span class="px-3 text-sm text-neutral-600 dark:text-neutral-400">
                Page {{ pageIndex() + 1 }} of {{ Math.ceil(totalElements() / pageSize()) || 1 }}
              </span>
              <button (click)="goToPage(pageIndex() + 1)" [disabled]="(pageIndex() + 1) * pageSize() >= totalElements()"
                      class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Next">
                <span class="material-icons">chevron_right</span>
              </button>
              <button (click)="goToPage(Math.ceil(totalElements() / pageSize()) - 1)" [disabled]="(pageIndex() + 1) * pageSize() >= totalElements()"
                      class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Last page">
                <span class="material-icons">last_page</span>
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientsListComponent implements OnInit, OnDestroy {
  private readonly recruitmentService = inject(RecruitmentService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly destroy$ = new Subject<void>();

  Math = Math;

  clients = signal<Client[]>([]);
  loading = signal(true);
  totalElements = signal(0);
  pageSize = signal(10);
  pageIndex = signal(0);

  searchControl = new FormControl('');
  activeControl = new FormControl('');

  ngOnInit(): void {
    this.loadClients();
    this.setupFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFilters(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.pageIndex.set(0);
        this.loadClients();
      });

    this.activeControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex.set(0);
        this.loadClients();
      });
  }

  loadClients(): void {
    this.loading.set(true);

    const activeValue = this.activeControl.value;
    const active = activeValue === 'true' ? true : activeValue === 'false' ? false : undefined;
    const searchTerm = this.searchControl.value || undefined;

    this.recruitmentService.searchClients(
      this.pageIndex(),
      this.pageSize(),
      active,
      searchTerm
    ).subscribe({
      next: (response) => {
        this.clients.set(response.content);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load clients', err);
        this.toast.error('Failed to load clients');
        this.loading.set(false);
      }
    });
  }

  goToPage(page: number): void {
    if (page < 0 || page * this.pageSize() >= this.totalElements()) return;
    this.pageIndex.set(page);
    this.loadClients();
  }

  hasFilters(): boolean {
    return !!(this.searchControl.value || this.activeControl.value);
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.activeControl.setValue('');
  }

  private readonly industryLabels: Record<string, string> = {
    IT_SOFTWARE: 'IT & Software',
    FINANCE_BANKING: 'Finance & Banking',
    HEALTHCARE: 'Healthcare',
    RETAIL: 'Retail',
    MANUFACTURING: 'Manufacturing',
    CONSTRUCTION: 'Construction',
    EDUCATION: 'Education',
    HOSPITALITY_TOURISM: 'Hospitality & Tourism',
    LOGISTICS_TRANSPORT: 'Logistics & Transport',
    LEGAL: 'Legal',
    MARKETING_ADVERTISING: 'Marketing & Advertising',
    HUMAN_RESOURCES: 'Human Resources',
    ENGINEERING: 'Engineering',
    MINING: 'Mining',
    AGRICULTURE: 'Agriculture',
    TELECOMMUNICATIONS: 'Telecommunications',
    REAL_ESTATE: 'Real Estate',
    MEDIA_ENTERTAINMENT: 'Media & Entertainment',
    GOVERNMENT_PUBLIC_SECTOR: 'Government & Public Sector',
    NON_PROFIT: 'Non-Profit',
    OTHER: 'Other'
  };

  getIndustryLabel(industry: string | null | undefined): string {
    if (!industry) return '-';
    return this.industryLabels[industry] ?? industry.replace(/_/g, ' ');
  }

  deactivateClient(client: Client): void {
    if (confirm(`Are you sure you want to deactivate "${client.name}"?`)) {
      this.recruitmentService.deactivateClient(client.id).subscribe({
        next: () => {
          this.toast.success('Client deactivated');
          this.loadClients();
        },
        error: () => {
          this.toast.error('Failed to deactivate client');
        }
      });
    }
  }
}
