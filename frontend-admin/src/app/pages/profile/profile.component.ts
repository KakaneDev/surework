import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { ProfileService, UpdateProfileRequest } from '@core/services/profile.service';
import { AdminUser } from '@core/models/user.model';
import { CardComponent } from '@core/components/ui/card.component';
import { ButtonComponent } from '@core/components/ui/button.component';
import { InputComponent } from '@core/components/ui/input.component';
import { BadgeComponent } from '@core/components/ui/badge.component';
import { RelativeTimePipe } from '@core/pipes/relative-time.pipe';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    ButtonComponent,
    InputComponent,
    BadgeComponent,
    RelativeTimePipe
  ],
  template: `
    <div class="flex flex-col gap-6">
      <!-- Page Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Profile</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your personal information and account settings.</p>
        </div>
      </div>

      <!-- Profile Header Card -->
      <app-card>
        <div class="flex flex-col items-center gap-6 sm:flex-row">
          <!-- Avatar -->
          <div class="relative">
            <div class="h-24 w-24 rounded-full bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center overflow-hidden">
              @if (user()?.avatarUrl) {
                <img [src]="user()!.avatarUrl" alt="Avatar" class="h-full w-full object-cover" />
              } @else {
                <span class="text-3xl font-semibold text-brand-600 dark:text-brand-400">
                  {{ user()?.firstName?.charAt(0) }}{{ user()?.lastName?.charAt(0) }}
                </span>
              }
            </div>
            <label class="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-brand-500 text-white shadow-theme-sm hover:bg-brand-600 transition-colors">
              <input
                type="file"
                accept="image/*"
                class="hidden"
                (change)="onAvatarChange($event)"
                [disabled]="uploadingAvatar()"
              />
              @if (uploadingAvatar()) {
                <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              } @else {
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              }
            </label>
          </div>

          <!-- User Info -->
          <div class="flex-1 text-center sm:text-left">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ user()?.firstName }} {{ user()?.lastName }}
            </h2>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ user()?.email }}</p>
            <div class="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              @for (role of user()?.roles; track role.id) {
                <app-badge [color]="role.systemRole ? 'info' : 'brand'">{{ role.name }}</app-badge>
              }
            </div>
          </div>

          <!-- Avatar Actions -->
          @if (user()?.avatarUrl) {
            <app-button variant="ghost" size="sm" (onClick)="deleteAvatar()" [loading]="deletingAvatar()">
              Remove Photo
            </app-button>
          }
        </div>
      </app-card>

      <!-- Personal Information -->
      <app-card title="Personal Information" subtitle="Update your personal details here.">
        @if (editingPersonal()) {
          <form (ngSubmit)="savePersonalInfo()" class="space-y-4">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <app-input
                label="First Name"
                [(ngModel)]="personalForm.firstName"
                name="firstName"
                placeholder="Enter first name"
                [required]="true"
              />
              <app-input
                label="Last Name"
                [(ngModel)]="personalForm.lastName"
                name="lastName"
                placeholder="Enter last name"
                [required]="true"
              />
            </div>
            <app-input
              label="Display Name"
              [(ngModel)]="personalForm.displayName"
              name="displayName"
              placeholder="How you'd like to be called"
              hint="This name will be displayed across the platform"
            />
            <app-input
              label="Email Address"
              [ngModel]="user()?.email"
              name="email"
              type="email"
              [readonly]="true"
              hint="Contact support to change your email"
            />
            <div class="flex justify-end gap-3">
              <app-button variant="outline" type="button" (onClick)="cancelPersonalEdit()">Cancel</app-button>
              <app-button type="submit" [loading]="savingPersonal()">Save Changes</app-button>
            </div>
          </form>
        } @else {
          <div class="space-y-4">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">First Name</p>
                <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ user()?.firstName || '-' }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Last Name</p>
                <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ user()?.lastName || '-' }}</p>
              </div>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Display Name</p>
              <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ user()?.displayName || user()?.firstName + ' ' + user()?.lastName }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Email Address</p>
              <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ user()?.email }}</p>
            </div>
            <div class="flex justify-end">
              <app-button variant="outline" size="sm" (onClick)="startPersonalEdit()">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                </svg>
                Edit
              </app-button>
            </div>
          </div>
        }
      </app-card>

      <!-- Contact Details -->
      <app-card title="Contact Details" subtitle="Manage your contact information.">
        @if (editingContact()) {
          <form (ngSubmit)="saveContactInfo()" class="space-y-4">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <app-input
                label="Phone Number"
                [(ngModel)]="contactForm.phoneNumber"
                name="phoneNumber"
                type="tel"
                placeholder="+27 11 123 4567"
              />
              <app-input
                label="Mobile Number"
                [(ngModel)]="contactForm.mobileNumber"
                name="mobileNumber"
                type="tel"
                placeholder="+27 82 123 4567"
              />
            </div>
            <div class="flex justify-end gap-3">
              <app-button variant="outline" type="button" (onClick)="cancelContactEdit()">Cancel</app-button>
              <app-button type="submit" [loading]="savingContact()">Save Changes</app-button>
            </div>
          </form>
        } @else {
          <div class="space-y-4">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Phone Number</p>
                <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ user()?.phoneNumber || 'Not provided' }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Mobile Number</p>
                <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ user()?.mobileNumber || 'Not provided' }}</p>
              </div>
            </div>
            <div class="flex justify-end">
              <app-button variant="outline" size="sm" (onClick)="startContactEdit()">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                </svg>
                Edit
              </app-button>
            </div>
          </div>
        }
      </app-card>

      <!-- Account Information -->
      <app-card title="Account Information" subtitle="Details about your account.">
        <div class="space-y-4">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Username</p>
              <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ user()?.username || user()?.email }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Employee ID</p>
              <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ user()?.employeeId || 'Not assigned' }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Account Status</p>
              <div class="mt-1">
                <app-badge [color]="user()?.status === 'ACTIVE' ? 'success' : 'warning'">
                  {{ user()?.status }}
                </app-badge>
              </div>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Email Verified</p>
              <div class="mt-1">
                <app-badge [color]="user()?.emailVerified ? 'success' : 'warning'">
                  {{ user()?.emailVerified ? 'Verified' : 'Pending' }}
                </app-badge>
              </div>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">MFA Status</p>
              <div class="mt-1">
                <app-badge [color]="user()?.mfaEnabled ? 'success' : 'gray'">
                  {{ user()?.mfaEnabled ? 'Enabled' : 'Disabled' }}
                </app-badge>
              </div>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Last Login</p>
              <p class="mt-1 text-sm text-gray-900 dark:text-white">
                {{ user()?.lastLoginAt ? (user()!.lastLoginAt | relativeTime) : 'Never' }}
              </p>
            </div>
          </div>
          <div class="border-t border-gray-200 pt-4 dark:border-gray-800">
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Account Created</p>
              <p class="mt-1 text-sm text-gray-900 dark:text-white">
                {{ user()?.createdAt | date:'mediumDate' }}
              </p>
            </div>
          </div>
        </div>
      </app-card>

      <!-- Toast Notification -->
      @if (toast().show) {
        <div
          class="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-theme-lg animate-slide-up"
          [ngClass]="{
            'border-success-200 bg-success-50 text-success-800 dark:border-success-800 dark:bg-success-900/50 dark:text-success-200': toast().type === 'success',
            'border-error-200 bg-error-50 text-error-800 dark:border-error-800 dark:bg-error-900/50 dark:text-error-200': toast().type === 'error'
          }"
        >
          @if (toast().type === 'success') {
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          } @else {
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          }
          <span class="text-sm font-medium">{{ toast().message }}</span>
        </div>
      }
    </div>
  `
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);

  user = this.authService.currentUser;

  // Edit states
  editingPersonal = signal(false);
  editingContact = signal(false);

  // Loading states
  savingPersonal = signal(false);
  savingContact = signal(false);
  uploadingAvatar = signal(false);
  deletingAvatar = signal(false);

  // Toast state
  toast = signal<{ show: boolean; type: 'success' | 'error'; message: string }>({
    show: false,
    type: 'success',
    message: ''
  });

  // Form data
  personalForm: { firstName: string; lastName: string; displayName: string } = {
    firstName: '',
    lastName: '',
    displayName: ''
  };

  contactForm: { phoneNumber: string; mobileNumber: string } = {
    phoneNumber: '',
    mobileNumber: ''
  };

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    this.profileService.getCurrentProfile().subscribe({
      next: (user) => {
        this.authService.currentUser.set(user);
      },
      error: (err) => {
        console.error('Failed to load profile:', err);
      }
    });
  }

  // Avatar methods
  onAvatarChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.showToast('error', 'File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.showToast('error', 'Please select an image file');
      return;
    }

    this.uploadingAvatar.set(true);
    this.profileService.uploadAvatar(file).subscribe({
      next: () => {
        this.uploadingAvatar.set(false);
        this.showToast('success', 'Avatar updated successfully');
      },
      error: (err) => {
        this.uploadingAvatar.set(false);
        this.showToast('error', 'Failed to upload avatar');
        console.error('Avatar upload failed:', err);
      }
    });
  }

  deleteAvatar(): void {
    this.deletingAvatar.set(true);
    this.profileService.deleteAvatar().subscribe({
      next: () => {
        this.deletingAvatar.set(false);
        this.showToast('success', 'Avatar removed successfully');
      },
      error: (err) => {
        this.deletingAvatar.set(false);
        this.showToast('error', 'Failed to remove avatar');
        console.error('Avatar delete failed:', err);
      }
    });
  }

  // Personal info methods
  startPersonalEdit(): void {
    const currentUser = this.user();
    this.personalForm = {
      firstName: currentUser?.firstName ?? '',
      lastName: currentUser?.lastName ?? '',
      displayName: currentUser?.displayName ?? ''
    };
    this.editingPersonal.set(true);
  }

  cancelPersonalEdit(): void {
    this.editingPersonal.set(false);
  }

  savePersonalInfo(): void {
    if (!this.personalForm.firstName || !this.personalForm.lastName) {
      this.showToast('error', 'First name and last name are required');
      return;
    }

    this.savingPersonal.set(true);
    const data: UpdateProfileRequest = {
      firstName: this.personalForm.firstName,
      lastName: this.personalForm.lastName,
      displayName: this.personalForm.displayName || undefined
    };

    this.profileService.updateProfile(data).subscribe({
      next: () => {
        this.savingPersonal.set(false);
        this.editingPersonal.set(false);
        this.showToast('success', 'Personal information updated');
      },
      error: (err) => {
        this.savingPersonal.set(false);
        this.showToast('error', 'Failed to update personal information');
        console.error('Profile update failed:', err);
      }
    });
  }

  // Contact info methods
  startContactEdit(): void {
    const currentUser = this.user();
    this.contactForm = {
      phoneNumber: currentUser?.phoneNumber ?? '',
      mobileNumber: currentUser?.mobileNumber ?? ''
    };
    this.editingContact.set(true);
  }

  cancelContactEdit(): void {
    this.editingContact.set(false);
  }

  saveContactInfo(): void {
    this.savingContact.set(true);
    const data: UpdateProfileRequest = {
      phoneNumber: this.contactForm.phoneNumber || undefined,
      mobileNumber: this.contactForm.mobileNumber || undefined
    };

    this.profileService.updateProfile(data).subscribe({
      next: () => {
        this.savingContact.set(false);
        this.editingContact.set(false);
        this.showToast('success', 'Contact information updated');
      },
      error: (err) => {
        this.savingContact.set(false);
        this.showToast('error', 'Failed to update contact information');
        console.error('Contact update failed:', err);
      }
    });
  }

  // Toast helper
  private showToast(type: 'success' | 'error', message: string): void {
    this.toast.set({ show: true, type, message });
    setTimeout(() => {
      this.toast.set({ show: false, type: 'success', message: '' });
    }, 3000);
  }
}
