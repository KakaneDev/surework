import { Component, inject, OnInit, ChangeDetectionStrategy, signal, ElementRef, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { timeout, catchError, finalize, switchMap } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';
import { selectCurrentUser } from '@core/store/auth/auth.selectors';
import { EmployeeService, Employee } from '@core/services/employee.service';
import { AuthService } from '@core/services/auth.service';
import { SpinnerComponent, BadgeComponent, TabsComponent, TabPanelComponent, ToastService } from '@shared/ui';
import { loadCurrentUser } from '@core/store/auth/auth.actions';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    SpinnerComponent,
    BadgeComponent,
    TabsComponent,
    TabPanelComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Loading state -->
      @if (loading()) {
        <div class="flex flex-col items-center justify-center py-16 gap-4">
          <sw-spinner size="lg" />
          <p class="text-neutral-500 dark:text-neutral-400">{{ 'profile.loading' | translate }}</p>
        </div>
      } @else {
        <!-- Header Card -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
          <div class="p-6 md:p-8">
            <div class="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <!-- Avatar with upload overlay -->
              <div class="relative group">
                <div class="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center ring-4 ring-white dark:ring-dark-surface shadow-lg">
                  @if (avatarUrl()) {
                    <img [src]="avatarUrl()" [alt]="'profile.profilePhoto' | translate" class="w-full h-full object-cover" />
                  } @else {
                    <span class="text-3xl md:text-4xl font-bold text-primary-600 dark:text-primary-400">
                      {{ getInitials() }}
                    </span>
                  }
                </div>
                <!-- Upload overlay -->
                <button
                  (click)="triggerFileInput()"
                  [disabled]="avatarUploading()"
                  [title]="'profile.uploadPhoto' | translate"
                  class="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                >
                  @if (avatarUploading()) {
                    <sw-spinner size="md" color="white" />
                  } @else {
                    <span class="material-icons text-white text-2xl">photo_camera</span>
                  }
                </button>
                <input
                  #fileInput
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  class="hidden"
                  (change)="onFileSelected($event)"
                />
              </div>

              <!-- User Info -->
              <div class="flex-1">
                <h1 class="text-2xl md:text-3xl font-bold text-neutral-800 dark:text-neutral-100">
                  {{ currentUser()?.fullName || 'User' }}
                </h1>
                <p class="text-neutral-500 dark:text-neutral-400 mt-1">
                  {{ currentUser()?.email }}
                </p>
                <div class="flex flex-wrap items-center gap-3 mt-3">
                  @if (employee()?.employeeNumber) {
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 dark:bg-dark-elevated text-neutral-700 dark:text-neutral-300 text-sm font-medium">
                      <span class="material-icons text-sm">badge</span>
                      {{ employee()?.employeeNumber }}
                    </span>
                  }
                  @if (employee()?.jobTitle?.title) {
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-sm font-medium">
                      <span class="material-icons text-sm">work</span>
                      {{ employee()?.jobTitle?.title }}
                    </span>
                  }
                  @if (employee()?.department?.name) {
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-50 dark:bg-secondary-900/20 text-secondary-700 dark:text-secondary-300 text-sm font-medium">
                      <span class="material-icons text-sm">apartment</span>
                      {{ employee()?.department?.name }}
                    </span>
                  }
                </div>
              </div>

              <!-- Status Badge -->
              @if (employee()?.status) {
                <div class="md:self-start">
                  <sw-badge [variant]="getStatusVariant(employee()!.status)" [dot]="true" [rounded]="true">
                    {{ formatStatus(employee()!.status) }}
                  </sw-badge>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Tabbed Content -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
          <sw-tabs [tabs]="tabs()" [activeTab]="activeTab()" (activeTabChange)="activeTab.set($event)" [ariaLabel]="'profile.profileSections' | translate">
            <!-- Personal Tab -->
            <sw-tab-panel id="personal">
              <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-4">
                    <h3 class="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{{ 'profile.contactInformation' | translate }}</h3>
                    <dl class="space-y-3">
                      <div class="flex flex-col">
                        <dt class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'profile.fullName' | translate }}</dt>
                        <dd class="text-base font-medium text-neutral-800 dark:text-neutral-200">{{ employee()?.fullName || '-' }}</dd>
                      </div>
                      <div class="flex flex-col">
                        <dt class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'profile.email' | translate }}</dt>
                        <dd class="text-base font-medium text-neutral-800 dark:text-neutral-200">{{ employee()?.email || '-' }}</dd>
                      </div>
                      <div class="flex flex-col">
                        <dt class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'profile.phone' | translate }}</dt>
                        <dd class="text-base font-medium text-neutral-800 dark:text-neutral-200">{{ employee()?.phone || '-' }}</dd>
                      </div>
                    </dl>
                  </div>

                  <div class="space-y-4">
                    <h3 class="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{{ 'profile.personalDetails' | translate }}</h3>
                    <dl class="space-y-3">
                      <div class="flex flex-col">
                        <dt class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'profile.idNumber' | translate }}</dt>
                        <dd class="text-base font-medium text-neutral-800 dark:text-neutral-200">{{ maskIdNumber(employee()?.idNumber) }}</dd>
                      </div>
                      <div class="flex flex-col">
                        <dt class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'profile.dateOfBirth' | translate }}</dt>
                        <dd class="text-base font-medium text-neutral-800 dark:text-neutral-200">{{ formatDate(employee()?.dateOfBirth) }}</dd>
                      </div>
                      <div class="flex flex-col">
                        <dt class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'profile.gender' | translate }}</dt>
                        <dd class="text-base font-medium text-neutral-800 dark:text-neutral-200">{{ employee()?.gender || '-' }}</dd>
                      </div>
                      <div class="flex flex-col">
                        <dt class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'profile.maritalStatus' | translate }}</dt>
                        <dd class="text-base font-medium text-neutral-800 dark:text-neutral-200">{{ employee()?.maritalStatus || '-' }}</dd>
                      </div>
                    </dl>
                  </div>

                  <div class="md:col-span-2 space-y-4">
                    <h3 class="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{{ 'profile.address' | translate }}</h3>
                    <dl class="space-y-3">
                      <div class="flex flex-col">
                        <dt class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'profile.streetAddress' | translate }}</dt>
                        <dd class="text-base font-medium text-neutral-800 dark:text-neutral-200">{{ getFullAddress() }}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </sw-tab-panel>

            <!-- Employment Tab -->
            <sw-tab-panel id="employment">
              <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-4">
                    <h3 class="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{{ 'profile.positionDetails' | translate }}</h3>
                    <dl class="space-y-3">
                      <div class="flex flex-col">
                        <dt class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'profile.employeeNumber' | translate }}</dt>
                        <dd class="text-base font-medium text-neutral-800 dark:text-neutral-200">{{ employee()?.employeeNumber || '-' }}</dd>
                      </div>
                      <div class="flex flex-col">
                        <dt class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'profile.department' | translate }}</dt>
                        <dd class="text-base font-medium text-neutral-800 dark:text-neutral-200">{{ employee()?.department?.name || '-' }}</dd>
                      </div>
                      <div class="flex flex-col">
                        <dt class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'profile.jobTitle' | translate }}</dt>
                        <dd class="text-base font-medium text-neutral-800 dark:text-neutral-200">{{ employee()?.jobTitle?.title || '-' }}</dd>
                      </div>
                      <div class="flex flex-col">
                        <dt class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'profile.manager' | translate }}</dt>
                        <dd class="text-base font-medium text-neutral-800 dark:text-neutral-200">{{ employee()?.manager?.fullName || '-' }}</dd>
                      </div>
                    </dl>
                  </div>

                  <div class="space-y-4">
                    <h3 class="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{{ 'profile.employmentDetails' | translate }}</h3>
                    <dl class="space-y-3">
                      <div class="flex flex-col">
                        <dt class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'profile.employmentType' | translate }}</dt>
                        <dd class="text-base font-medium text-neutral-800 dark:text-neutral-200">{{ formatEmploymentType(employee()?.employmentType) }}</dd>
                      </div>
                      <div class="flex flex-col">
                        <dt class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'profile.hireDate' | translate }}</dt>
                        <dd class="text-base font-medium text-neutral-800 dark:text-neutral-200">{{ formatDate(employee()?.hireDate) }}</dd>
                      </div>
                      <div class="flex flex-col">
                        <dt class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'profile.status' | translate }}</dt>
                        <dd>
                          @if (employee()?.status) {
                            <sw-badge [variant]="getStatusVariant(employee()!.status)" [dot]="true">
                              {{ formatStatus(employee()!.status) }}
                            </sw-badge>
                          } @else {
                            <span class="text-base font-medium text-neutral-800 dark:text-neutral-200">-</span>
                          }
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </sw-tab-panel>

            <!-- Banking Tab -->
            <sw-tab-panel id="banking">
              <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-4">
                    <h3 class="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{{ 'profile.bankDetails' | translate }}</h3>
                    <dl class="space-y-3">
                      <div class="flex flex-col">
                        <dt class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'profile.bankName' | translate }}</dt>
                        <dd class="text-base font-medium text-neutral-800 dark:text-neutral-200">{{ employee()?.banking?.bankName || '-' }}</dd>
                      </div>
                      <div class="flex flex-col">
                        <dt class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'profile.accountNumber' | translate }}</dt>
                        <dd class="text-base font-medium text-neutral-800 dark:text-neutral-200">{{ maskAccountNumber(employee()?.banking?.accountNumber) }}</dd>
                      </div>
                      <div class="flex flex-col">
                        <dt class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'profile.branchCode' | translate }}</dt>
                        <dd class="text-base font-medium text-neutral-800 dark:text-neutral-200">{{ employee()?.banking?.branchCode || '-' }}</dd>
                      </div>
                      <div class="flex flex-col">
                        <dt class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'profile.accountType' | translate }}</dt>
                        <dd class="text-base font-medium text-neutral-800 dark:text-neutral-200">{{ employee()?.banking?.accountType || '-' }}</dd>
                      </div>
                    </dl>
                  </div>

                  <div class="flex items-center justify-center p-8 bg-neutral-50 dark:bg-dark-elevated rounded-lg">
                    <div class="text-center">
                      <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-2">account_balance</span>
                      <p class="text-sm text-neutral-500 dark:text-neutral-400">
                        {{ 'profile.bankingHintText' | translate }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </sw-tab-panel>

            <!-- Emergency Tab -->
            <sw-tab-panel id="emergency">
              <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-4">
                    <h3 class="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{{ 'profile.emergencyContact' | translate }}</h3>
                    <dl class="space-y-3">
                      <div class="flex flex-col">
                        <dt class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'profile.contactName' | translate }}</dt>
                        <dd class="text-base font-medium text-neutral-800 dark:text-neutral-200">{{ employee()?.emergencyContact?.name || '-' }}</dd>
                      </div>
                      <div class="flex flex-col">
                        <dt class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'profile.phoneNumber' | translate }}</dt>
                        <dd class="text-base font-medium text-neutral-800 dark:text-neutral-200">{{ employee()?.emergencyContact?.phone || '-' }}</dd>
                      </div>
                      <div class="flex flex-col">
                        <dt class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'profile.relationship' | translate }}</dt>
                        <dd class="text-base font-medium text-neutral-800 dark:text-neutral-200">{{ employee()?.emergencyContact?.relationship || '-' }}</dd>
                      </div>
                    </dl>
                  </div>

                  <div class="flex items-center justify-center p-8 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
                    <div class="text-center">
                      <span class="material-icons text-5xl text-warning-400 mb-2">emergency</span>
                      <p class="text-sm text-warning-700 dark:text-warning-300">
                        {{ 'profile.emergencyContactHintText' | translate }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </sw-tab-panel>

            <!-- Account Tab -->
            <sw-tab-panel id="account">
              <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-4">
                    <h3 class="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{{ 'profile.accountInformation' | translate }}</h3>
                    <dl class="space-y-3">
                      <div class="flex flex-col">
                        <dt class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'profile.userId' | translate }}</dt>
                        <dd class="text-base font-mono text-neutral-800 dark:text-neutral-200 text-sm">{{ currentUser()?.userId || '-' }}</dd>
                      </div>
                      <div class="flex flex-col">
                        <dt class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'profile.email' | translate }}</dt>
                        <dd class="text-base font-medium text-neutral-800 dark:text-neutral-200">{{ currentUser()?.email || '-' }}</dd>
                      </div>
                      <div class="flex flex-col">
                        <dt class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'profile.mfaStatus' | translate }}</dt>
                        <dd>
                          <sw-badge [variant]="currentUser()?.mfaEnabled ? 'success' : 'warning'" [dot]="true">
                            {{ currentUser()?.mfaEnabled ? ('profile.mfaEnabled' | translate) : ('profile.mfaDisabled' | translate) }}
                          </sw-badge>
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div class="space-y-4">
                    <h3 class="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{{ 'profile.rolesPermissions' | translate }}</h3>
                    <dl class="space-y-3">
                      <div class="flex flex-col">
                        <dt class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'profile.roles' | translate }}</dt>
                        <dd class="flex flex-wrap gap-2 mt-1">
                          @for (role of currentUser()?.roles || []; track role) {
                            <sw-badge variant="primary" [rounded]="true">{{ formatRole(role) }}</sw-badge>
                          }
                          @if ((currentUser()?.roles || []).length === 0) {
                            <span class="text-neutral-500 dark:text-neutral-400">{{ 'profile.noRolesAssigned' | translate }}</span>
                          }
                        </dd>
                      </div>
                      <div class="flex flex-col">
                        <dt class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'profile.permissions' | translate }}</dt>
                        <dd class="text-base font-medium text-neutral-800 dark:text-neutral-200">
                          {{ (currentUser()?.permissions || []).length }} {{ 'profile.permissionsLabel' | translate }}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div class="md:col-span-2 flex items-center justify-center p-6 bg-neutral-50 dark:bg-dark-elevated rounded-lg">
                    <div class="text-center">
                      <span class="material-icons text-4xl text-neutral-300 dark:text-neutral-600 mb-2">settings</span>
                      <p class="text-sm text-neutral-500 dark:text-neutral-400">
                        {{ 'profile.securityHintText1' | translate }}<br />
                        {{ 'profile.securityHintText2' | translate }} <a href="/settings" class="text-primary-600 dark:text-primary-400 hover:underline">{{ 'profile.settings' | translate }}</a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </sw-tab-panel>
          </sw-tabs>
        </div>
      }
    </div>
  `
})
export class ProfileComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private readonly employeeService = inject(EmployeeService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly store = inject(Store);
  private readonly translate = inject(TranslateService);

  // Auth state from store
  readonly currentUser = toSignal(this.store.select(selectCurrentUser));

  // Component state
  employee = signal<Employee | null>(null);
  loading = signal(true);
  activeTab = signal(0);
  avatarUploading = signal(false);
  avatarUrl = signal<string | null>(null);
  tabs = signal<string[]>([]);

  constructor() {
    // Load tabs when language changes
    effect(() => {
      const tabKeys = [
        'profile.tabPersonal',
        'profile.tabEmployment',
        'profile.tabBanking',
        'profile.tabEmergency',
        'profile.tabAccount'
      ];
      this.translate.get(tabKeys).subscribe((translations: any) => {
        this.tabs.set(tabKeys.map(key => translations[key]));
      });
    });
  }

  ngOnInit(): void {
    this.loadProfileData();
  }

  loadProfileData(): void {
    this.loading.set(true);
    const user = this.currentUser();

    if (!user?.employeeId) {
      // User without employee record - just show account info
      this.loading.set(false);
      return;
    }

    this.employeeService.getEmployee(user.employeeId).pipe(
      timeout(30000),
      catchError(err => {
        console.error('[Profile] Error loading employee data:', err);
        this.toast.error('Failed to load profile data');
        return of(null);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (employee) => {
        if (employee) {
          this.employee.set(employee);
        }
      }
    });
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      this.toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.toast.error('Image file must be less than 5MB');
      return;
    }

    this.uploadAvatar(file);
    input.value = ''; // Reset input
  }

  private uploadAvatar(file: File): void {
    const userId = this.currentUser()?.userId;
    if (!userId) {
      this.toast.error('User not found');
      return;
    }

    this.avatarUploading.set(true);

    this.authService.uploadAvatar(userId, file).pipe(
      timeout(60000),
      catchError(err => {
        console.error('[Profile] Error uploading avatar:', err);
        this.toast.error('Failed to upload avatar');
        return of(null);
      }),
      finalize(() => this.avatarUploading.set(false))
    ).subscribe({
      next: (response) => {
        if (response?.avatarUrl) {
          this.avatarUrl.set(response.avatarUrl);
          this.toast.success('Avatar updated successfully');
          // Refresh user data in store
          this.store.dispatch(loadCurrentUser());
        }
      }
    });
  }

  getInitials(): string {
    const user = this.currentUser();
    if (!user) return '?';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  getFullAddress(): string {
    const addr = this.employee()?.address;
    if (!addr) return '-';

    const parts = [
      addr.streetAddress,
      addr.suburb,
      addr.city,
      addr.province,
      addr.postalCode
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : '-';
  }

  maskIdNumber(idNumber: string | undefined): string {
    if (!idNumber) return '-';
    if (idNumber.length <= 4) return idNumber;
    return '****' + idNumber.slice(-4);
  }

  maskAccountNumber(accountNumber: string | undefined): string {
    if (!accountNumber) return '-';
    if (accountNumber.length <= 4) return accountNumber;
    return '****' + accountNumber.slice(-4);
  }

  formatEmploymentType(type: string | undefined): string {
    if (!type) return '-';
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatRole(role: string): string {
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getStatusVariant(status: string): 'success' | 'warning' | 'error' | 'neutral' {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'ON_LEAVE':
        return 'warning';
      case 'SUSPENDED':
      case 'TERMINATED':
        return 'error';
      default:
        return 'neutral';
    }
  }
}
