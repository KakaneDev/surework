import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, finalize, catchError } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { environment } from '@env/environment';
import { SettingsService, TenantUser, PageResponse } from '@core/services/settings.service';
import { SpinnerComponent, ToastService, ButtonComponent, BadgeComponent, DropdownComponent, DropdownItemComponent, DropdownDividerComponent, PaginationComponent } from '@shared/ui';
import { UserInviteDialogComponent } from './user-invite-dialog.component';
import { EditRolesDialogComponent } from './edit-roles-dialog.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    SpinnerComponent,
    ButtonComponent,
    BadgeComponent,
    DropdownComponent,
    DropdownItemComponent,
    DropdownDividerComponent,
    PaginationComponent,
    UserInviteDialogComponent,
    EditRolesDialogComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
        <div class="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{{ 'settings.userManagement.title' | translate }}</h2>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{{ 'settings.userManagement.subtitle' | translate }}</p>
          </div>
          <button
            type="button"
            (click)="showInviteDialog.set(true)"
            class="sw-btn sw-btn-primary sw-btn-md"
          >
            <span class="material-icons text-sm">person_add</span>
            <span>{{ 'settings.userManagement.inviteButton' | translate }}</span>
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
        <div class="p-4 flex flex-col md:flex-row gap-4">
          <!-- Search -->
          <div class="flex-1 relative">
            <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">search</span>
            <input
              type="text"
              [formControl]="searchControl"
              class="sw-input pl-10"
              [attr.placeholder]="'settings.userManagement.searchPlaceholder' | translate"
            />
          </div>

          <!-- Status Filter -->
          <select [formControl]="statusControl" class="sw-input w-full md:w-40">
            <option value="all">{{ 'settings.userManagement.allStatus' | translate }}</option>
            <option value="ACTIVE">{{ 'settings.userManagement.statusActive' | translate }}</option>
            <option value="INACTIVE">{{ 'settings.userManagement.statusInactive' | translate }}</option>
            <option value="PENDING">{{ 'settings.userManagement.statusPending' | translate }}</option>
          </select>
        </div>
      </div>

      <!-- Users Table -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
        @if (loading()) {
          <div class="flex flex-col items-center justify-center py-16 gap-4">
            <sw-spinner size="lg" />
            <p class="text-neutral-500 dark:text-neutral-400">{{ 'settings.userManagement.loadingUsers' | translate }}</p>
          </div>
        } @else if (users().length === 0) {
          <div class="flex flex-col items-center justify-center py-16 gap-4">
            <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600">group_off</span>
            <div class="text-center">
              <p class="text-neutral-800 dark:text-neutral-200 font-medium mb-1">{{ 'settings.userManagement.noUsersFound' | translate }}</p>
              <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                @if (searchControl.value || statusControl.value !== 'all') {
                  {{ 'settings.userManagement.adjustSearchOrFilter' | translate }}
                } @else {
                  {{ 'settings.userManagement.inviteFirstTeamMember' | translate }}
                }
              </p>
              @if (!searchControl.value && statusControl.value === 'all') {
                <button
                  type="button"
                  (click)="showInviteDialog.set(true)"
                  class="sw-btn sw-btn-primary sw-btn-md"
                >
                  <span class="material-icons text-sm">person_add</span>
                  <span>{{ 'settings.userManagement.inviteButton' | translate }}</span>
                </button>
              }
            </div>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="sw-table">
              <thead>
                <tr>
                  <th class="text-left">{{ 'settings.userManagement.columnUser' | translate }}</th>
                  <th class="text-left">{{ 'settings.userManagement.columnRoles' | translate }}</th>
                  <th class="text-left">{{ 'settings.userManagement.columnStatus' | translate }}</th>
                  <th class="text-left">{{ 'settings.userManagement.columnLastLogin' | translate }}</th>
                  <th class="text-right">{{ 'settings.userManagement.columnActions' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                @for (user of users(); track user.id) {
                  <tr>
                    <td>
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                          <span class="text-primary-600 dark:text-primary-400 font-medium">
                            {{ getInitials(user) }}
                          </span>
                        </div>
                        <div>
                          <p class="font-medium text-neutral-800 dark:text-neutral-100">{{ user.fullName }}</p>
                          <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ user.email }}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="flex flex-wrap gap-1">
                        @for (roleName of getUserRoleNames(user).slice(0, 2); track roleName) {
                          <sw-badge variant="neutral" [rounded]="true">{{ formatRoleName(roleName) }}</sw-badge>
                        }
                        @if (getUserRoleNames(user).length > 2) {
                          <sw-badge variant="neutral" [rounded]="true">+{{ getUserRoleNames(user).length - 2 }}</sw-badge>
                        }
                      </div>
                    </td>
                    <td>
                      <sw-badge [variant]="statusVariantMap[user.status] || 'neutral'" [dot]="true">
                        {{ statusLabelMap[user.status] || user.status }}
                      </sw-badge>
                    </td>
                    <td>
                      <span class="text-sm text-neutral-500 dark:text-neutral-400">
                        {{ formatDate(user.lastLoginAt) }}
                      </span>
                    </td>
                    <td class="text-right">
                      <sw-dropdown position="bottom-end">
                        <button
                          trigger
                          type="button"
                          class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                          [attr.aria-label]="('settings.userManagement.actionsAriaLabel' | translate: {name: user.fullName})"
                        >
                          <span class="material-icons text-neutral-500">more_vert</span>
                        </button>
                        <sw-dropdown-item (click)="editUserRoles(user)">
                          <span class="material-icons text-sm">edit</span>
                          <span>{{ 'settings.userManagement.editRoles' | translate }}</span>
                        </sw-dropdown-item>
                        @if (user.status === 'PENDING') {
                          <sw-dropdown-item (click)="resendInvitation(user)">
                            <span class="material-icons text-sm">send</span>
                            <span>{{ 'settings.userManagement.resendInvitation' | translate }}</span>
                          </sw-dropdown-item>
                        }
                        <sw-dropdown-divider></sw-dropdown-divider>
                        @if (user.status === 'ACTIVE') {
                          <sw-dropdown-item (click)="deactivateUser(user)" variant="danger">
                            <span class="material-icons text-sm">block</span>
                            <span>{{ 'settings.userManagement.deactivate' | translate }}</span>
                          </sw-dropdown-item>
                        } @else if (user.status === 'INACTIVE') {
                          <sw-dropdown-item (click)="activateUser(user)">
                            <span class="material-icons text-sm">check_circle</span>
                            <span>{{ 'settings.userManagement.activate' | translate }}</span>
                          </sw-dropdown-item>
                        }
                      </sw-dropdown>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="p-4 border-t border-neutral-200 dark:border-dark-border">
              <sw-pagination
                [page]="page() + 1"
                [total]="totalItems()"
                [pageSize]="pageSize()"
                (pageChange)="onPageChange($event - 1)"
              ></sw-pagination>
            </div>
          }
        }
      </div>
    </div>

    <!-- Invite Dialog -->
    @if (showInviteDialog()) {
      <app-user-invite-dialog
        [tenantId]="tenantId"
        (close)="showInviteDialog.set(false)"
        (invited)="onUserInvited($event)"
      ></app-user-invite-dialog>
    }

    <!-- Edit Roles Dialog -->
    @if (showEditRolesDialog() && editingUser()) {
      <app-edit-roles-dialog
        [user]="editingUser()!"
        [tenantId]="tenantId"
        (close)="closeEditRolesDialog()"
        (saved)="onUserRolesUpdated($event)"
      ></app-edit-roles-dialog>
    }
  `
})
export class UserManagementComponent implements OnInit {
  private readonly settingsService = inject(SettingsService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  // Lookup maps for template (avoids function calls on every CD cycle)
  readonly statusVariantMap: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
    ACTIVE: 'success',
    PENDING: 'warning',
    INACTIVE: 'error',
    LOCKED: 'error'
  };

  readonly statusLabelMap: Record<string, string> = {
    ACTIVE: 'Active',
    PENDING: 'Pending',
    INACTIVE: 'Inactive',
    LOCKED: 'Locked'
  };

  readonly tenantId = environment.tenantId;

  loading = signal(true);
  users = signal<TenantUser[]>([]);
  page = signal(0);
  pageSize = signal(10);
  totalPages = signal(0);
  totalItems = signal(0);

  showInviteDialog = signal(false);
  showEditRolesDialog = signal(false);
  editingUser = signal<TenantUser | null>(null);

  searchControl = new FormControl('');
  statusControl = new FormControl('all');

  ngOnInit(): void {
    this.loadUsers();

    // Setup search debounce with subscription cleanup
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.page.set(0);
      this.loadUsers();
    });

    this.statusControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.page.set(0);
      this.loadUsers();
    });
  }

  private loadUsers(): void {
    this.loading.set(true);

    this.settingsService.getTenantUsers(this.tenantId, {
      page: this.page(),
      size: this.pageSize(),
      search: this.searchControl.value || undefined,
      status: this.statusControl.value || undefined
    }).pipe(
      catchError(err => {
        console.error('Error loading users:', err);
        this.toast.error(this.translate.instant('settings.userManagement.errorLoadingUsers'));
        return of<PageResponse<TenantUser>>({
          content: [],
          page: 0,
          size: 10,
          totalElements: 0,
          totalPages: 0,
          first: true,
          last: true
        });
      }),
      finalize(() => this.loading.set(false))
    ).subscribe(response => {
      this.users.set(response.content);
      this.totalPages.set(response.totalPages);
      this.totalItems.set(response.totalElements);
    });
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.loadUsers();
  }

  onUserInvited(user: TenantUser): void {
    this.showInviteDialog.set(false);
    this.loadUsers();
  }

  getInitials(user: TenantUser): string {
    // If we have firstName/lastName, use those
    if (user.firstName || user.lastName) {
      const first = user.firstName?.charAt(0) || '';
      const last = user.lastName?.charAt(0) || '';
      return (first + last).toUpperCase() || '?';
    }
    // Otherwise extract from fullName
    const parts = (user.fullName || '').split(' ');
    const first = parts[0]?.charAt(0) || '';
    const last = parts.length > 1 ? parts[parts.length - 1]?.charAt(0) : '';
    return (first + last).toUpperCase() || '?';
  }

  /**
   * Get role names from user - handles both roleNames (backend) and roles (future rich format)
   */
  getUserRoleNames(user: TenantUser): string[] {
    // Backend returns roleNames as string array
    if (user.roleNames && user.roleNames.length > 0) {
      return user.roleNames;
    }
    // Future: roles as objects with code/name
    if (user.roles && user.roles.length > 0) {
      return user.roles.map(r => r.name);
    }
    return [];
  }

  formatRoleName(name: string): string {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatStatus(status: string): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'Never';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  editUserRoles(user: TenantUser): void {
    this.editingUser.set(user);
    this.showEditRolesDialog.set(true);
  }

  closeEditRolesDialog(): void {
    this.showEditRolesDialog.set(false);
    this.editingUser.set(null);
  }

  onUserRolesUpdated(user: TenantUser): void {
    this.closeEditRolesDialog();
    this.loadUsers();
  }

  resendInvitation(user: TenantUser): void {
    this.settingsService.resendInvitation(this.tenantId, user.id).pipe(
      catchError(err => {
        console.error('Error resending invitation:', err);
        this.toast.error(this.translate.instant('settings.userManagement.errorResendingInvitation'));
        return of(null);
      })
    ).subscribe(result => {
      if (result !== null) {
        this.toast.success(this.translate.instant('settings.userManagement.invitationResentSuccess'));
      }
    });
  }

  activateUser(user: TenantUser): void {
    this.settingsService.activateUser(this.tenantId, user.id).pipe(
      catchError(err => {
        console.error('Error activating user:', err);
        this.toast.error(this.translate.instant('settings.userManagement.errorActivatingUser'));
        return of(null);
      })
    ).subscribe(result => {
      if (result) {
        this.toast.success(this.translate.instant('settings.userManagement.userActivatedSuccess'));
        this.loadUsers();
      }
    });
  }

  deactivateUser(user: TenantUser): void {
    this.settingsService.deactivateUser(this.tenantId, user.id).pipe(
      catchError(err => {
        console.error('Error deactivating user:', err);
        this.toast.error(this.translate.instant('settings.userManagement.errorDeactivatingUser'));
        return of(null);
      })
    ).subscribe(result => {
      if (result) {
        this.toast.success(this.translate.instant('settings.userManagement.userDeactivatedSuccess'));
        this.loadUsers();
      }
    });
  }
}
