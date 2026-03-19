import { Component, ChangeDetectionStrategy, inject, signal, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '@env/environment';
import { SettingsService, CompanyProfile } from '@core/services/settings.service';
import { AuthService } from '@core/services/auth.service';
import { SpinnerComponent, ToastService, ButtonComponent } from '@shared/ui';

@Component({
  selector: 'app-company-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, SpinnerComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      @if (loading()) {
        <div class="flex flex-col items-center justify-center py-16 gap-4">
          <sw-spinner size="lg" />
          <p class="text-neutral-500 dark:text-neutral-400">{{ 'settings.companyProfile.loading' | translate }}</p>
        </div>
      } @else {
        <!-- Company Logo -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
          <div class="p-6 border-b border-neutral-200 dark:border-dark-border">
            <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{{ 'settings.companyProfile.logo.title' | translate }}</h2>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{{ 'settings.companyProfile.logo.description' | translate }}</p>
          </div>
          <div class="p-6">
            <div class="flex items-center gap-6">
              <div class="relative group">
                <div class="w-24 h-24 rounded-xl overflow-hidden bg-neutral-100 dark:bg-dark-elevated flex items-center justify-center border-2 border-dashed border-neutral-300 dark:border-neutral-600">
                  @if (logoUrl()) {
                    <img [src]="logoUrl()" [alt]="'settings.companyProfile.logo.alt' | translate" class="w-full h-full object-contain" />
                  } @else {
                    <span class="material-icons text-4xl text-neutral-400">business</span>
                  }
                </div>
                <button
                  type="button"
                  (click)="triggerLogoInput()"
                  [disabled]="uploadingLogo()"
                  [attr.aria-label]="'settings.companyProfile.logo.uploadButton' | translate"
                  class="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                >
                  @if (uploadingLogo()) {
                    <sw-spinner size="md" color="white" />
                  } @else {
                    <span class="material-icons text-white text-2xl">photo_camera</span>
                  }
                </button>
                <input
                  #logoInput
                  type="file"
                  accept="image/jpeg,image/png,image/svg+xml"
                  class="hidden"
                  (change)="onLogoSelected($event)"
                />
              </div>
              <div>
                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                  {{ 'settings.companyProfile.logo.recommended' | translate }}<br />
                  {{ 'settings.companyProfile.logo.supportedFormats' | translate }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Company Information -->
        <form [formGroup]="profileForm" (ngSubmit)="onSave()">
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
            <div class="p-6 border-b border-neutral-200 dark:border-dark-border">
              <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{{ 'settings.companyProfile.information.title' | translate }}</h2>
              <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{{ 'settings.companyProfile.information.description' | translate }}</p>
            </div>
            <div class="p-6 space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="sw-label">{{ 'settings.companyProfile.fields.companyName' | translate }} *</label>
                  <input
                    type="text"
                    formControlName="name"
                    class="sw-input"
                    [class.sw-input-error]="profileForm.get('name')?.invalid && profileForm.get('name')?.touched"
                    [placeholder]="'settings.companyProfile.placeholders.companyName' | translate"
                  />
                  @if (profileForm.get('name')?.hasError('required') && profileForm.get('name')?.touched) {
                    <p class="sw-error-text">{{ 'settings.companyProfile.errors.companyNameRequired' | translate }}</p>
                  }
                </div>

                <div>
                  <label class="sw-label">{{ 'settings.companyProfile.fields.registrationNumber' | translate }}</label>
                  <input
                    type="text"
                    formControlName="registrationNumber"
                    class="sw-input"
                    [placeholder]="'settings.companyProfile.placeholders.registrationNumber' | translate"
                  />
                  <p class="sw-hint-text">{{ 'settings.companyProfile.hints.registrationNumber' | translate }}</p>
                </div>

                <div>
                  <label class="sw-label">{{ 'settings.companyProfile.fields.tradingName' | translate }}</label>
                  <input
                    type="text"
                    formControlName="tradingName"
                    class="sw-input"
                    [placeholder]="'settings.companyProfile.placeholders.tradingName' | translate"
                  />
                </div>

                <div>
                  <label class="sw-label">{{ 'settings.companyProfile.fields.industrySector' | translate }}</label>
                  <select formControlName="industrySector" class="sw-input">
                    <option value="">{{ 'settings.companyProfile.placeholders.selectIndustrySector' | translate }}</option>
                    <option value="AGRICULTURE">{{ 'settings.companyProfile.industrySectors.agriculture' | translate }}</option>
                    <option value="CONSTRUCTION">{{ 'settings.companyProfile.industrySectors.construction' | translate }}</option>
                    <option value="EDUCATION">{{ 'settings.companyProfile.industrySectors.education' | translate }}</option>
                    <option value="FINANCE">{{ 'settings.companyProfile.industrySectors.finance' | translate }}</option>
                    <option value="HEALTHCARE">{{ 'settings.companyProfile.industrySectors.healthcare' | translate }}</option>
                    <option value="HOSPITALITY">{{ 'settings.companyProfile.industrySectors.hospitality' | translate }}</option>
                    <option value="IT_TECHNOLOGY">{{ 'settings.companyProfile.industrySectors.itTechnology' | translate }}</option>
                    <option value="MANUFACTURING">{{ 'settings.companyProfile.industrySectors.manufacturing' | translate }}</option>
                    <option value="MINING">{{ 'settings.companyProfile.industrySectors.mining' | translate }}</option>
                    <option value="PROFESSIONAL_SERVICES">{{ 'settings.companyProfile.industrySectors.professionalServices' | translate }}</option>
                    <option value="RETAIL">{{ 'settings.companyProfile.industrySectors.retail' | translate }}</option>
                    <option value="TRANSPORT">{{ 'settings.companyProfile.industrySectors.transport' | translate }}</option>
                    <option value="OTHER">{{ 'settings.companyProfile.industrySectors.other' | translate }}</option>
                  </select>
                </div>

                <div>
                  <label class="sw-label">{{ 'settings.companyProfile.fields.taxNumber' | translate }}</label>
                  <input
                    type="text"
                    formControlName="taxNumber"
                    class="sw-input"
                    [placeholder]="'settings.companyProfile.placeholders.taxNumber' | translate"
                  />
                </div>

                <div>
                  <label class="sw-label">{{ 'settings.companyProfile.fields.website' | translate }}</label>
                  <input
                    type="url"
                    formControlName="website"
                    class="sw-input"
                    [placeholder]="'settings.companyProfile.placeholders.website' | translate"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Contact Information -->
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden mt-6">
            <div class="p-6 border-b border-neutral-200 dark:border-dark-border">
              <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{{ 'settings.companyProfile.contact.title' | translate }}</h2>
              <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{{ 'settings.companyProfile.contact.description' | translate }}</p>
            </div>
            <div class="p-6 space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="sw-label">{{ 'settings.companyProfile.fields.emailAddress' | translate }}</label>
                  <input
                    type="email"
                    formControlName="email"
                    class="sw-input"
                    [placeholder]="'settings.companyProfile.placeholders.emailAddress' | translate"
                  />
                </div>

                <div>
                  <label class="sw-label">{{ 'settings.companyProfile.fields.phoneNumber' | translate }}</label>
                  <input
                    type="tel"
                    formControlName="phone"
                    class="sw-input"
                    [placeholder]="'settings.companyProfile.placeholders.phoneNumber' | translate"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Address -->
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden mt-6" formGroupName="address">
            <div class="p-6 border-b border-neutral-200 dark:border-dark-border">
              <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-100">{{ 'settings.companyProfile.address.title' | translate }}</h2>
              <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{{ 'settings.companyProfile.address.description' | translate }}</p>
            </div>
            <div class="p-6 space-y-6">
              <div>
                <label class="sw-label">{{ 'settings.companyProfile.fields.streetAddress' | translate }}</label>
                <input
                  type="text"
                  formControlName="streetAddress"
                  class="sw-input"
                  [placeholder]="'settings.companyProfile.placeholders.streetAddress' | translate"
                />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="sw-label">{{ 'settings.companyProfile.fields.city' | translate }}</label>
                  <input
                    type="text"
                    formControlName="city"
                    class="sw-input"
                    [placeholder]="'settings.companyProfile.placeholders.city' | translate"
                  />
                </div>

                <div>
                  <label class="sw-label">{{ 'settings.companyProfile.fields.province' | translate }}</label>
                  <select formControlName="province" class="sw-input">
                    <option value="">{{ 'settings.companyProfile.placeholders.selectProvince' | translate }}</option>
                    <option value="Eastern Cape">{{ 'settings.companyProfile.provinces.easternCape' | translate }}</option>
                    <option value="Free State">{{ 'settings.companyProfile.provinces.freeState' | translate }}</option>
                    <option value="Gauteng">{{ 'settings.companyProfile.provinces.gauteng' | translate }}</option>
                    <option value="KwaZulu-Natal">{{ 'settings.companyProfile.provinces.kwazuluNatal' | translate }}</option>
                    <option value="Limpopo">{{ 'settings.companyProfile.provinces.limpopo' | translate }}</option>
                    <option value="Mpumalanga">{{ 'settings.companyProfile.provinces.mpumalanga' | translate }}</option>
                    <option value="Northern Cape">{{ 'settings.companyProfile.provinces.northernCape' | translate }}</option>
                    <option value="North West">{{ 'settings.companyProfile.provinces.northWest' | translate }}</option>
                    <option value="Western Cape">{{ 'settings.companyProfile.provinces.westernCape' | translate }}</option>
                  </select>
                </div>

                <div>
                  <label class="sw-label">{{ 'settings.companyProfile.fields.postalCode' | translate }}</label>
                  <input
                    type="text"
                    formControlName="postalCode"
                    class="sw-input"
                    [placeholder]="'settings.companyProfile.placeholders.postalCode' | translate"
                  />
                </div>

                <div>
                  <label class="sw-label">{{ 'settings.companyProfile.fields.country' | translate }}</label>
                  <input
                    type="text"
                    formControlName="country"
                    class="sw-input"
                    [placeholder]="'settings.companyProfile.placeholders.country' | translate"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Save Button -->
          <div class="flex justify-end mt-6">
            <button
              type="submit"
              [disabled]="profileForm.invalid || saving()"
              class="sw-btn sw-btn-primary sw-btn-md"
            >
              @if (saving()) {
                <sw-spinner size="sm" color="white" />
                <span>{{ 'settings.companyProfile.actions.saving' | translate }}</span>
              } @else {
                <span class="material-icons text-sm">save</span>
                <span>{{ 'settings.companyProfile.actions.saveChanges' | translate }}</span>
              }
            </button>
          </div>
        </form>
      }
    </div>
  `
})
export class CompanyProfileComponent implements OnInit {
  @ViewChild('logoInput') logoInput!: ElementRef<HTMLInputElement>;

  private readonly fb = inject(FormBuilder);
  private readonly settingsService = inject(SettingsService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  private readonly tenantId = environment.tenantId;

  loading = signal(true);
  saving = signal(false);
  uploadingLogo = signal(false);
  logoUrl = signal<string | null>(null);

  profileForm: FormGroup;

  constructor() {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      registrationNumber: [''],
      tradingName: [''],
      industrySector: [''],
      taxNumber: [''],
      website: [''],
      email: ['', Validators.email],
      phone: [''],
      address: this.fb.group({
        streetAddress: [''],
        city: [''],
        province: [''],
        postalCode: [''],
        country: ['South Africa']
      })
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    this.loading.set(true);

    this.settingsService.getCompanyProfile(this.tenantId).pipe(
      catchError(err => {
        console.error('Error loading company profile:', err);
        this.toast.error(this.translate.instant('settings.companyProfile.messages.loadError'));
        return of(null);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe(profile => {
      if (profile) {
        this.profileForm.patchValue({
          name: profile.name || '',
          registrationNumber: profile.registrationNumber || '',
          tradingName: (profile as any).tradingName || '',
          industrySector: (profile as any).industrySector || '',
          taxNumber: profile.taxNumber || '',
          website: profile.website || '',
          email: profile.email || '',
          phone: profile.phone || '',
          address: {
            streetAddress: profile.address?.streetAddress || '',
            city: profile.address?.city || '',
            province: profile.address?.province || '',
            postalCode: profile.address?.postalCode || '',
            country: profile.address?.country || 'South Africa'
          }
        });
        this.logoUrl.set(profile.logo || null);
      }
    });
  }

  triggerLogoInput(): void {
    this.logoInput.nativeElement.click();
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      this.toast.error(this.translate.instant('settings.companyProfile.messages.invalidImageType'));
      return;
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      this.toast.error(this.translate.instant('settings.companyProfile.messages.logoFileTooLarge'));
      return;
    }

    this.uploadLogo(file);
    input.value = '';
  }

  private uploadLogo(file: File): void {
    this.uploadingLogo.set(true);

    this.settingsService.uploadCompanyLogo(this.tenantId, file).pipe(
      catchError(err => {
        console.error('Error uploading logo:', err);
        this.toast.error(this.translate.instant('settings.companyProfile.messages.uploadError'));
        return of(null);
      }),
      finalize(() => this.uploadingLogo.set(false))
    ).subscribe(result => {
      if (result?.logoUrl) {
        this.logoUrl.set(result.logoUrl);
        this.toast.success(this.translate.instant('settings.companyProfile.messages.uploadSuccess'));
      }
    });
  }

  onSave(): void {
    if (this.profileForm.invalid) return;

    this.saving.set(true);
    const values = this.profileForm.value;

    this.settingsService.updateCompanyProfile(this.tenantId, values).pipe(
      catchError(err => {
        console.error('Error saving company profile:', err);
        this.toast.error(this.translate.instant('settings.companyProfile.messages.saveError'));
        return of(null);
      }),
      finalize(() => this.saving.set(false))
    ).subscribe(result => {
      if (result) {
        this.toast.success(this.translate.instant('settings.companyProfile.messages.saveSuccess'));
        // Also persist to the setup/completion endpoint and refresh cached flags
        this.settingsService.saveCompanySetupDetails(values).pipe(
          catchError(() => of(null))
        ).subscribe(() => {
          this.authService.refreshSetupStatus().subscribe();
        });
      }
    });
  }
}
