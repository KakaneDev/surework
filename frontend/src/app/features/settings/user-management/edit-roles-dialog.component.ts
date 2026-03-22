import { Component, ChangeDetectionStrategy, inject, signal, OnInit, Output, EventEmitter, Input, HostListener, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '@env/environment';
import { SettingsService, Role, TenantUser } from '@core/services/settings.service';
import { SpinnerComponent, ToastService } from '@shared/ui';

@Component({
  selector: 'app-edit-roles-dialog',
  standalone: true,
  imports: [CommonModule, TranslateModule, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Backdrop with fade animation -->
    <div
      class="fixed inset-0 bg-black/50 z-50 animate-fade-in"
      (click)="onClose()"
      role="presentation"
      aria-hidden="true"
    ></div>

    <!-- Dialog with scale-in animation -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-roles-title"
      (click)="onClose()"
    >
      <div
        #dialogPanel
        class="bg-white dark:bg-dark-surface rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden animate-scale-in"
        (click)="$event.stopPropagation()"
        tabindex="-1"
      >
        <!-- Header -->
        <div class="p-6 border-b border-neutral-200 dark:border-dark-border flex items-center justify-between">
          <div>
            <h2 id="edit-roles-title" class="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
              {{ 'settings.userManagement.editRolesDialog.title' | translate }}
            </h2>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {{ 'settings.userManagement.editRolesDialog.subtitle' | translate: { fullName: user.fullName } }}
            </p>
          </div>
          <button
            type="button"
            (click)="onClose()"
            class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            [attr.aria-label]="'settings.userManagement.editRolesDialog.closeButton' | translate"
          >
            <span class="material-icons text-neutral-500">close</span>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6">
          <!-- User Info -->
          <div class="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-200 dark:border-dark-border">
            <div class="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <span class="text-primary-600 dark:text-primary-400 font-semibold text-lg">
                {{ getInitials() }}
              </span>
            </div>
            <div>
              <p class="font-medium text-neutral-800 dark:text-neutral-100">{{ user.fullName }}</p>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ user.email }}</p>
            </div>
          </div>

          <!-- Roles Selection -->
          <div>
            <label class="sw-label mb-3">{{ 'settings.userManagement.editRolesDialog.assignedRolesLabel' | translate }}</label>
            @if (loadingRoles()) {
              <div class="flex items-center gap-2 py-4">
                <sw-spinner size="sm" />
                <span class="text-sm text-neutral-500">{{ 'settings.userManagement.editRolesDialog.loadingRoles' | translate }}</span>
              </div>
            } @else {
              <div
                class="space-y-2 max-h-64 overflow-y-auto border border-neutral-200 dark:border-dark-border rounded-lg p-3"
                role="group"
                [attr.aria-label]="'settings.userManagement.editRolesDialog.availableRoles' | translate"
              >
                @for (role of roles(); track role.id) {
                  <label
                    class="flex items-start gap-3 p-2 rounded-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-dark-elevated transition-colors group"
                  >
                    <!-- Custom styled checkbox -->
                    <span class="relative flex-shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        [value]="role.id"
                        [checked]="selectedRoleIds().includes(role.id)"
                        (change)="toggleRole(role.id, $event)"
                        class="absolute opacity-0 w-5 h-5 cursor-pointer"
                      />
                      <span
                        class="flex items-center justify-center w-5 h-5 border-2 rounded transition-all duration-150"
                        [class.border-neutral-300]="!selectedRoleIds().includes(role.id)"
                        [class.dark:border-neutral-600]="!selectedRoleIds().includes(role.id)"
                        [class.bg-primary-500]="selectedRoleIds().includes(role.id)"
                        [class.border-primary-500]="selectedRoleIds().includes(role.id)"
                      >
                        @if (selectedRoleIds().includes(role.id)) {
                          <span class="material-icons text-white text-sm">check</span>
                        }
                      </span>
                    </span>
                    <div class="flex-1">
                      <p class="text-sm font-medium text-neutral-800 dark:text-neutral-100">
                        {{ formatRoleName(role.name) }}
                      </p>
                      @if (role.description) {
                        <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {{ role.description }}
                        </p>
                      }
                    </div>
                  </label>
                }
                @if (roles().length === 0) {
                  <p class="text-sm text-neutral-500 dark:text-neutral-400 py-4 text-center">
                    {{ 'settings.userManagement.editRolesDialog.noRolesAvailable' | translate }}
                  </p>
                }
              </div>

              <!-- Validation Message -->
              @if (selectedRoleIds().length === 0 && touched()) {
                <p class="text-sm text-red-600 dark:text-red-400 mt-2">
                  {{ 'settings.userManagement.editRolesDialog.validationMessage' | translate }}
                </p>
              }

              <!-- Selected Count with context -->
              <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                {{ 'settings.userManagement.editRolesDialog.rolesCount' | translate: { selected: selectedRoleIds().length, total: roles().length } }}
              </p>
            }
          </div>
        </div>

        <!-- Actions -->
        <div class="p-6 border-t border-neutral-200 dark:border-dark-border flex justify-end gap-3">
          <button
            type="button"
            (click)="onClose()"
            class="sw-btn sw-btn-secondary sw-btn-md"
          >
            {{ 'settings.userManagement.editRolesDialog.cancelButton' | translate }}
          </button>
          <button
            type="button"
            (click)="onSave()"
            [disabled]="selectedRoleIds().length === 0 || saving() || !hasChanges()"
            class="sw-btn sw-btn-primary sw-btn-md min-w-[140px]"
          >
            @if (saving()) {
              <sw-spinner size="sm" color="white" />
              <span>{{ 'settings.userManagement.editRolesDialog.savingButton' | translate }}</span>
            } @else {
              <span class="material-icons text-sm">save</span>
              <span>{{ 'settings.userManagement.editRolesDialog.saveButton' | translate }}</span>
            }
          </button>
        </div>
      </div>
    </div>
  `
})
export class EditRolesDialogComponent implements OnInit, AfterViewInit {
  @Input({ required: true }) user!: TenantUser;
  @Input() tenantId = environment.tenantId;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<TenantUser>();

  private readonly settingsService = inject(SettingsService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly elementRef = inject(ElementRef);

  loadingRoles = signal(true);
  saving = signal(false);
  touched = signal(false);
  roles = signal<Role[]>([]);
  selectedRoleIds = signal<string[]>([]);
  private initialRoleIds: string[] = [];

  /**
   * Handle Escape key to close dialog - standard keyboard accessibility pattern
   */
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    event.preventDefault();
    this.onClose();
  }

  ngOnInit(): void {
    this.loadRoles();
  }

  ngAfterViewInit(): void {
    // Focus the dialog panel for keyboard accessibility
    const dialogPanel = this.elementRef.nativeElement.querySelector('[tabindex="-1"]');
    if (dialogPanel) {
      dialogPanel.focus();
    }
  }

  private loadRoles(): void {
    this.loadingRoles.set(true);

    this.settingsService.getRoles(this.tenantId).pipe(
      catchError(err => {
        console.error('Error loading roles:', err);
        this.toast.error(this.translate.instant('settings.userManagement.editRolesDialog.errorLoadingRoles'));
        return of([]);
      }),
      finalize(() => this.loadingRoles.set(false))
    ).subscribe(roles => {
      this.roles.set(roles);
      // Pre-select user's current roles by matching role names
      this.preselectUserRoles(roles);
    });
  }

  private preselectUserRoles(availableRoles: Role[]): void {
    const userRoleNames = this.getUserRoleNames();
    const matchedRoleIds = availableRoles
      .filter(role => userRoleNames.some(name =>
        name.toLowerCase() === role.name.toLowerCase() ||
        name.toLowerCase() === role.code.toLowerCase()
      ))
      .map(role => role.id);

    this.selectedRoleIds.set(matchedRoleIds);
    this.initialRoleIds = [...matchedRoleIds];
  }

  private getUserRoleNames(): string[] {
    if (this.user.roleNames && this.user.roleNames.length > 0) {
      return this.user.roleNames;
    }
    if (this.user.roles && this.user.roles.length > 0) {
      return this.user.roles.map(r => r.name || r.code);
    }
    return [];
  }

  getInitials(): string {
    if (this.user.firstName || this.user.lastName) {
      const first = this.user.firstName?.charAt(0) || '';
      const last = this.user.lastName?.charAt(0) || '';
      return (first + last).toUpperCase() || '?';
    }
    const parts = (this.user.fullName || '').split(' ');
    const first = parts[0]?.charAt(0) || '';
    const last = parts.length > 1 ? parts[parts.length - 1]?.charAt(0) : '';
    return (first + last).toUpperCase() || '?';
  }

  toggleRole(roleId: string, event: Event): void {
    this.touched.set(true);
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.selectedRoleIds();

    if (checked) {
      this.selectedRoleIds.set([...current, roleId]);
    } else {
      this.selectedRoleIds.set(current.filter(id => id !== roleId));
    }
  }

  formatRoleName(name: string): string {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  hasChanges(): boolean {
    const current = this.selectedRoleIds();
    if (current.length !== this.initialRoleIds.length) return true;
    return current.some(id => !this.initialRoleIds.includes(id)) ||
           this.initialRoleIds.some(id => !current.includes(id));
  }

  onClose(): void {
    this.close.emit();
  }

  onSave(): void {
    // Guard against double-submit - check saving state first
    if (this.saving()) {
      return;
    }

    this.touched.set(true);

    // Validate at least one role is selected
    if (this.selectedRoleIds().length === 0) {
      this.toast.error(this.translate.instant('settings.userManagement.editRolesDialog.errorAtLeastOneRole'));
      return;
    }

    this.saving.set(true);

    this.settingsService.updateUserRoles(
      this.tenantId,
      this.user.id,
      this.selectedRoleIds()
    ).pipe(
      catchError(err => {
        console.error('Error updating user roles:', err);
        // Handle standardized error response format from GlobalExceptionHandler
        const message = err.error?.message || err.error?.error || 'Failed to update user roles';
        this.toast.error(message);
        return of(null);
      }),
      finalize(() => this.saving.set(false))
    ).subscribe(updatedUser => {
      if (updatedUser) {
        this.toast.success(this.translate.instant('settings.userManagement.editRolesDialog.successMessage'));
        this.saved.emit(updatedUser);
      }
    });
  }
}
