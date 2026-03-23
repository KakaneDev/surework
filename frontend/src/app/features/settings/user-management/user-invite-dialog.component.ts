import { Component, ChangeDetectionStrategy, inject, signal, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { getTenantId } from '@core/utils/tenant.util';
import { SettingsService, Role, TenantUser, InviteUserRequest } from '@core/services/settings.service';
import { SpinnerComponent, ToastService, ButtonComponent } from '@shared/ui';

@Component({
  selector: 'app-user-invite-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, SpinnerComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/50 z-50" (click)="onClose()"></div>

    <!-- Dialog -->
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="p-6 border-b border-neutral-200 dark:border-dark-border flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{{ 'settings.userManagement.inviteDialog.title' | translate }}</h2>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{{ 'settings.userManagement.inviteDialog.subtitle' | translate }}</p>
          </div>
          <button
            type="button"
            (click)="onClose()"
            class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated transition-colors"
          >
            <span class="material-icons text-neutral-500">close</span>
          </button>
        </div>

        <!-- Form -->
        <form [formGroup]="inviteForm" (ngSubmit)="onSubmit()" class="p-6 space-y-4">
          <div>
            <label class="sw-label">{{ 'settings.userManagement.inviteDialog.emailLabel' | translate }}</label>
            <input
              type="email"
              formControlName="email"
              class="sw-input"
              [class.sw-input-error]="inviteForm.get('email')?.invalid && inviteForm.get('email')?.touched"
              [placeholder]="'settings.userManagement.inviteDialog.emailPlaceholder' | translate"
            />
            @if (inviteForm.get('email')?.hasError('required') && inviteForm.get('email')?.touched) {
              <p class="sw-error-text">{{ 'settings.userManagement.inviteDialog.emailRequired' | translate }}</p>
            }
            @if (inviteForm.get('email')?.hasError('email') && inviteForm.get('email')?.touched) {
              <p class="sw-error-text">{{ 'settings.userManagement.inviteDialog.emailInvalid' | translate }}</p>
            }
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="sw-label">{{ 'settings.userManagement.inviteDialog.firstNameLabel' | translate }}</label>
              <input
                type="text"
                formControlName="firstName"
                class="sw-input"
                [class.sw-input-error]="inviteForm.get('firstName')?.invalid && inviteForm.get('firstName')?.touched"
                [placeholder]="'settings.userManagement.inviteDialog.firstNamePlaceholder' | translate"
              />
              @if (inviteForm.get('firstName')?.hasError('required') && inviteForm.get('firstName')?.touched) {
                <p class="sw-error-text">{{ 'common.fieldRequired' | translate }}</p>
              }
            </div>

            <div>
              <label class="sw-label">{{ 'settings.userManagement.inviteDialog.lastNameLabel' | translate }}</label>
              <input
                type="text"
                formControlName="lastName"
                class="sw-input"
                [class.sw-input-error]="inviteForm.get('lastName')?.invalid && inviteForm.get('lastName')?.touched"
                [placeholder]="'settings.userManagement.inviteDialog.lastNamePlaceholder' | translate"
              />
              @if (inviteForm.get('lastName')?.hasError('required') && inviteForm.get('lastName')?.touched) {
                <p class="sw-error-text">{{ 'common.fieldRequired' | translate }}</p>
              }
            </div>
          </div>

          <div>
            <label class="sw-label">{{ 'settings.userManagement.inviteDialog.rolesLabel' | translate }}</label>
            @if (loadingRoles()) {
              <div class="flex items-center gap-2 py-2">
                <sw-spinner size="sm" />
                <span class="text-sm text-neutral-500">{{ 'settings.userManagement.inviteDialog.loadingRoles' | translate }}</span>
              </div>
            } @else {
              <div class="space-y-2 max-h-40 overflow-y-auto border border-neutral-200 dark:border-dark-border rounded-lg p-3">
                @for (role of roles(); track role.id) {
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      [value]="role.id"
                      [checked]="selectedRoleIds().includes(role.id)"
                      (change)="toggleRole(role.id, $event)"
                      class="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                    />
                    <div>
                      <p class="text-sm font-medium text-neutral-800 dark:text-neutral-100">{{ formatRoleName(role.name) }}</p>
                      @if (role.description) {
                        <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ role.description }}</p>
                      }
                    </div>
                  </label>
                }
                @if (roles().length === 0) {
                  <p class="text-sm text-neutral-500 dark:text-neutral-400 py-2">{{ 'settings.userManagement.inviteDialog.noRolesAvailable' | translate }}</p>
                }
              </div>
              @if (selectedRoleIds().length === 0 && inviteForm.touched) {
                <p class="sw-error-text">{{ 'settings.userManagement.inviteDialog.selectAtLeastOneRole' | translate }}</p>
              }
            }
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-dark-border">
            <button
              type="button"
              (click)="onClose()"
              class="sw-btn sw-btn-secondary sw-btn-md"
            >
              {{ 'common.actions.cancel' | translate }}
            </button>
            <button
              type="submit"
              [disabled]="inviteForm.invalid || selectedRoleIds().length === 0 || submitting()"
              class="sw-btn sw-btn-primary sw-btn-md"
            >
              @if (submitting()) {
                <sw-spinner size="sm" color="white" />
                <span>{{ 'settings.userManagement.inviteDialog.sending' | translate }}</span>
              } @else {
                <span class="material-icons text-sm">send</span>
                <span>{{ 'settings.userManagement.inviteDialog.sendInvitation' | translate }}</span>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class UserInviteDialogComponent implements OnInit {
  @Input() tenantId = getTenantId();
  @Output() close = new EventEmitter<void>();
  @Output() invited = new EventEmitter<TenantUser>();

  private readonly fb = inject(FormBuilder);
  private readonly settingsService = inject(SettingsService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  loadingRoles = signal(true);
  submitting = signal(false);
  roles = signal<Role[]>([]);
  selectedRoleIds = signal<string[]>([]);

  inviteForm: FormGroup;

  constructor() {
    this.inviteForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadRoles();
  }

  private loadRoles(): void {
    this.loadingRoles.set(true);

    this.settingsService.getRoles(this.tenantId).pipe(
      catchError(err => {
        console.error('Error loading roles:', err);
        this.toast.error(this.translate.instant('settings.userManagement.inviteDialog.failedToLoadRoles'));
        return of([]);
      }),
      finalize(() => this.loadingRoles.set(false))
    ).subscribe(roles => {
      this.roles.set(roles);
    });
  }

  toggleRole(roleId: string, event: Event): void {
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

  onClose(): void {
    this.close.emit();
  }

  onSubmit(): void {
    if (this.inviteForm.invalid || this.selectedRoleIds().length === 0) return;

    this.submitting.set(true);
    const values = this.inviteForm.value;

    const request: InviteUserRequest = {
      email: values.email,
      firstName: values.firstName,
      lastName: values.lastName,
      roleIds: this.selectedRoleIds()
    };

    this.settingsService.inviteUser(this.tenantId, request).pipe(
      catchError(err => {
        console.error('Error inviting user:', err);
        const message = err.error?.message || this.translate.instant('settings.userManagement.inviteDialog.failedToSendInvitation');
        this.toast.error(message);
        return of(null);
      }),
      finalize(() => this.submitting.set(false))
    ).subscribe(user => {
      if (user) {
        this.toast.success(this.translate.instant('settings.userManagement.inviteDialog.invitationSentSuccessfully'));
        this.invited.emit(user);
      }
    });
  }
}
