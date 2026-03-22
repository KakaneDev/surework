import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  RecruitmentService,
  Candidate,
  CreateCandidateRequest,
  UpdateCandidateRequest,
  Gender
} from '../../../core/services/recruitment.service';
import { SpinnerComponent, ToastService } from '@shared/ui';

@Component({
  selector: 'app-candidate-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    TranslateModule,
    SpinnerComponent
  ],
  template: `
    <div class="space-y-6 max-w-4xl mx-auto">
      <!-- Header -->
      <div class="sw-page-header">
        <div class="flex items-center gap-3">
          <a [routerLink]="isEditMode() ? ['/recruitment/candidates', candidateId()] : '/recruitment/candidates'"
             class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated transition-colors"
             [attr.aria-label]="'common.back' | translate">
            <span class="material-icons" aria-hidden="true">arrow_back</span>
          </a>
          <span class="material-icons text-3xl text-primary-500">person_add</span>
          <div>
            <h1 class="sw-page-title">{{ isEditMode() ? ('recruitment.candidateForm.editTitle' | translate) : ('recruitment.candidateForm.addTitle' | translate) }}</h1>
            <p class="sw-page-description">{{ isEditMode() ? ('recruitment.candidateForm.editDescription' | translate) : ('recruitment.candidateForm.addDescription' | translate) }}</p>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center items-center py-24">
          <sw-spinner size="lg" />
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
            <!-- Personal Information -->
            <section class="p-6 border-b border-neutral-200 dark:border-dark-border">
              <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
                <span class="material-icons text-primary-500">person</span>
                {{ 'recruitment.candidateForm.personalInformation' | translate }}
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="sw-label">{{ 'recruitment.candidateForm.firstName' | translate }} *</label>
                  <input type="text" formControlName="firstName" class="sw-input w-full"
                         [class.border-error-500]="form.get('firstName')?.touched && form.get('firstName')?.hasError('required')">
                  @if (form.get('firstName')?.touched && form.get('firstName')?.hasError('required')) {
                    <p class="text-sm text-error-500 mt-1">{{ 'recruitment.candidateForm.firstNameRequired' | translate }}</p>
                  }
                </div>

                <div>
                  <label class="sw-label">{{ 'recruitment.candidateForm.lastName' | translate }} *</label>
                  <input type="text" formControlName="lastName" class="sw-input w-full"
                         [class.border-error-500]="form.get('lastName')?.touched && form.get('lastName')?.hasError('required')">
                  @if (form.get('lastName')?.touched && form.get('lastName')?.hasError('required')) {
                    <p class="text-sm text-error-500 mt-1">{{ 'recruitment.candidateForm.lastNameRequired' | translate }}</p>
                  }
                </div>

                <div>
                  <label class="sw-label">{{ 'recruitment.candidateForm.email' | translate }} *</label>
                  <input type="email" formControlName="email" class="sw-input w-full"
                         [class.border-error-500]="form.get('email')?.touched && form.get('email')?.invalid">
                  @if (form.get('email')?.touched && form.get('email')?.hasError('required')) {
                    <p class="text-sm text-error-500 mt-1">{{ 'recruitment.candidateForm.emailRequired' | translate }}</p>
                  }
                  @if (form.get('email')?.touched && form.get('email')?.hasError('email')) {
                    <p class="text-sm text-error-500 mt-1">{{ 'recruitment.candidateForm.emailInvalid' | translate }}</p>
                  }
                </div>

                <div>
                  <label class="sw-label">{{ 'recruitment.candidateForm.phone' | translate }}</label>
                  <input type="tel" formControlName="phone" class="sw-input w-full" [placeholder]="'recruitment.candidateForm.phonePlaceholder' | translate">
                </div>

                <div>
                  <label class="sw-label">{{ 'recruitment.candidateForm.idNumber' | translate }}</label>
                  <input type="text" formControlName="idNumber" class="sw-input w-full">
                </div>

                <div>
                  <label class="sw-label">{{ 'recruitment.candidateForm.dateOfBirth' | translate }}</label>
                  <input type="date" formControlName="dateOfBirth" class="sw-input w-full">
                </div>

                <div>
                  <label class="sw-label">{{ 'recruitment.candidateForm.gender' | translate }}</label>
                  <select formControlName="gender" class="sw-input w-full">
                    <option value="">{{ 'recruitment.candidateForm.genderPreferNotToSay' | translate }}</option>
                    <option value="MALE">{{ 'recruitment.candidateForm.genderMale' | translate }}</option>
                    <option value="FEMALE">{{ 'recruitment.candidateForm.genderFemale' | translate }}</option>
                    <option value="OTHER">{{ 'recruitment.candidateForm.genderOther' | translate }}</option>
                  </select>
                </div>

                <div>
                  <label class="sw-label">{{ 'recruitment.candidateForm.nationality' | translate }}</label>
                  <input type="text" formControlName="nationality" class="sw-input w-full" [placeholder]="'recruitment.candidateForm.nationalityPlaceholder' | translate">
                </div>
              </div>
            </section>

            <!-- Address -->
            <section class="p-6 border-b border-neutral-200 dark:border-dark-border">
              <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
                <span class="material-icons text-primary-500">location_on</span>
                {{ 'recruitment.candidateForm.address' | translate }}
              </h3>

              <div class="space-y-4">
                <div>
                  <label class="sw-label">{{ 'recruitment.candidateForm.addressLine1' | translate }}</label>
                  <input type="text" formControlName="addressLine1" class="sw-input w-full">
                </div>

                <div>
                  <label class="sw-label">{{ 'recruitment.candidateForm.addressLine2' | translate }}</label>
                  <input type="text" formControlName="addressLine2" class="sw-input w-full">
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label class="sw-label">{{ 'recruitment.candidateForm.city' | translate }}</label>
                    <input type="text" formControlName="city" class="sw-input w-full">
                  </div>

                  <div>
                    <label class="sw-label">{{ 'recruitment.candidateForm.province' | translate }}</label>
                    <input type="text" formControlName="province" class="sw-input w-full">
                  </div>

                  <div>
                    <label class="sw-label">{{ 'recruitment.candidateForm.postalCode' | translate }}</label>
                    <input type="text" formControlName="postalCode" class="sw-input w-full">
                  </div>
                </div>
              </div>
            </section>

            <!-- Professional Information -->
            <section class="p-6 border-b border-neutral-200 dark:border-dark-border">
              <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
                <span class="material-icons text-primary-500">work</span>
                {{ 'recruitment.candidateForm.professionalInformation' | translate }}
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="sw-label">{{ 'recruitment.candidateForm.currentJobTitle' | translate }}</label>
                  <input type="text" formControlName="currentJobTitle" class="sw-input w-full">
                </div>

                <div>
                  <label class="sw-label">{{ 'recruitment.candidateForm.currentEmployer' | translate }}</label>
                  <input type="text" formControlName="currentEmployer" class="sw-input w-full">
                </div>

                <div>
                  <label class="sw-label">{{ 'recruitment.candidateForm.yearsExperience' | translate }}</label>
                  <input type="number" formControlName="yearsExperience" class="sw-input w-full" min="0">
                </div>

                <div>
                  <label class="sw-label">{{ 'recruitment.candidateForm.highestQualification' | translate }}</label>
                  <input type="text" formControlName="highestQualification" class="sw-input w-full" [placeholder]="'recruitment.candidateForm.highestQualificationPlaceholder' | translate">
                </div>

                <div class="md:col-span-2">
                  <label class="sw-label">{{ 'recruitment.candidateForm.fieldOfStudy' | translate }}</label>
                  <input type="text" formControlName="fieldOfStudy" class="sw-input w-full" [placeholder]="'recruitment.candidateForm.fieldOfStudyPlaceholder' | translate">
                </div>

                <div class="md:col-span-2">
                  <label class="sw-label">{{ 'recruitment.candidateForm.skills' | translate }}</label>
                  <textarea formControlName="skills" class="sw-input w-full" rows="3"
                            [placeholder]="'recruitment.candidateForm.skillsPlaceholder' | translate"></textarea>
                </div>

                <div class="md:col-span-2">
                  <label class="sw-label">{{ 'recruitment.candidateForm.languages' | translate }}</label>
                  <input type="text" formControlName="languages" class="sw-input w-full"
                         [placeholder]="'recruitment.candidateForm.languagesPlaceholder' | translate">
                </div>
              </div>
            </section>

            <!-- Preferences -->
            <section class="p-6 border-b border-neutral-200 dark:border-dark-border">
              <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
                <span class="material-icons text-primary-500">tune</span>
                {{ 'recruitment.candidateForm.preferences' | translate }}
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="sw-label">{{ 'recruitment.candidateForm.expectedSalary' | translate }}</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">R</span>
                    <input type="number" formControlName="expectedSalary" class="sw-input w-full pl-8" min="0">
                  </div>
                </div>

                <div>
                  <label class="sw-label">{{ 'recruitment.candidateForm.noticePeriodDays' | translate }}</label>
                  <input type="number" formControlName="noticePeriodDays" class="sw-input w-full" min="0">
                </div>

                <div>
                  <label class="sw-label">{{ 'recruitment.candidateForm.availableFrom' | translate }}</label>
                  <input type="date" formControlName="availableFrom" class="sw-input w-full">
                </div>

                <div>
                  <label class="sw-label">{{ 'recruitment.candidateForm.preferredLocations' | translate }}</label>
                  <input type="text" formControlName="preferredLocations" class="sw-input w-full"
                         [placeholder]="'recruitment.candidateForm.preferredLocationsPlaceholder' | translate">
                </div>

                <div class="md:col-span-2">
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" formControlName="willingToRelocate"
                           class="w-5 h-5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500">
                    <span class="text-neutral-700 dark:text-neutral-300">{{ 'recruitment.candidateForm.willingToRelocate' | translate }}</span>
                  </label>
                </div>
              </div>
            </section>

            <!-- Links & Source -->
            <section class="p-6">
              <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
                <span class="material-icons text-primary-500">link</span>
                {{ 'recruitment.candidateForm.linksAndSource' | translate }}
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="sw-label">{{ 'recruitment.candidateForm.linkedinUrl' | translate }}</label>
                  <input type="url" formControlName="linkedinUrl" class="sw-input w-full" [placeholder]="'recruitment.candidateForm.linkedinUrlPlaceholder' | translate">
                </div>

                <div>
                  <label class="sw-label">{{ 'recruitment.candidateForm.portfolioUrl' | translate }}</label>
                  <input type="url" formControlName="portfolioUrl" class="sw-input w-full" [placeholder]="'recruitment.candidateForm.portfolioUrlPlaceholder' | translate">
                </div>

                @if (!isEditMode()) {
                  <div>
                    <label class="sw-label">{{ 'recruitment.candidateForm.source' | translate }}</label>
                    <select formControlName="source" class="sw-input w-full">
                      <option value="">{{ 'recruitment.candidateForm.selectSource' | translate }}</option>
                      <option value="CAREER_SITE">{{ 'recruitment.candidateForm.sourceCareerSite' | translate }}</option>
                      <option value="LINKEDIN">{{ 'recruitment.candidateForm.sourceLinkedin' | translate }}</option>
                      <option value="REFERRAL">{{ 'recruitment.candidateForm.sourceEmployeeReferral' | translate }}</option>
                      <option value="JOB_BOARD">{{ 'recruitment.candidateForm.sourceJobBoard' | translate }}</option>
                      <option value="RECRUITMENT_AGENCY">{{ 'recruitment.candidateForm.sourceRecruitmentAgency' | translate }}</option>
                      <option value="DIRECT">{{ 'recruitment.candidateForm.sourceDirectApplication' | translate }}</option>
                      <option value="OTHER">{{ 'recruitment.candidateForm.sourceOther' | translate }}</option>
                    </select>
                  </div>

                  <div>
                    <label class="sw-label">{{ 'recruitment.candidateForm.referredBy' | translate }}</label>
                    <input type="text" formControlName="referredBy" class="sw-input w-full"
                           [placeholder]="'recruitment.candidateForm.referredByPlaceholder' | translate">
                  </div>
                }
              </div>
            </section>
          </div>

          <!-- Actions -->
          <div class="flex justify-between items-center mt-6">
            <button type="button" (click)="cancel()"
                    class="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-elevated rounded-lg transition-colors">
              {{ 'common.cancel' | translate }}
            </button>
            <button type="submit"
                    [disabled]="form.invalid || saving()"
                    class="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-fast">
              @if (saving()) {
                <sw-spinner size="sm" />
              } @else {
                <span class="material-icons text-lg">save</span>
              }
              {{ isEditMode() ? ('recruitment.candidateForm.updateButton' | translate) : ('recruitment.candidateForm.addButton' | translate) }}
            </button>
          </div>
        </form>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CandidateFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly recruitmentService = inject(RecruitmentService);
  private readonly toast = inject(ToastService);

  form: FormGroup;
  loading = signal(false);
  saving = signal(false);
  candidateId = signal<string | null>(null);
  isEditMode = signal(false);

  constructor() {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      idNumber: [''],
      dateOfBirth: [null],
      gender: [''],
      nationality: [''],
      addressLine1: [''],
      addressLine2: [''],
      city: [''],
      province: [''],
      postalCode: [''],
      currentJobTitle: [''],
      currentEmployer: [''],
      yearsExperience: [null],
      highestQualification: [''],
      fieldOfStudy: [''],
      skills: [''],
      languages: [''],
      expectedSalary: [null],
      noticePeriodDays: [null],
      availableFrom: [null],
      willingToRelocate: [false],
      preferredLocations: [''],
      linkedinUrl: [''],
      portfolioUrl: [''],
      source: [''],
      referredBy: ['']
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.candidateId.set(id);
      this.isEditMode.set(true);
      this.loadCandidate(id);
    }
  }

  loadCandidate(id: string): void {
    this.loading.set(true);
    this.recruitmentService.getCandidate(id).subscribe({
      next: (candidate) => {
        this.form.patchValue({
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          email: candidate.email,
          phone: candidate.phone,
          idNumber: candidate.idNumber,
          dateOfBirth: candidate.dateOfBirth ? this.toInputDate(candidate.dateOfBirth) : null,
          gender: candidate.gender || '',
          nationality: candidate.nationality,
          city: candidate.city,
          province: candidate.province,
          currentJobTitle: candidate.currentJobTitle,
          currentEmployer: candidate.currentEmployer,
          yearsExperience: candidate.yearsExperience,
          highestQualification: candidate.highestQualification,
          fieldOfStudy: candidate.fieldOfStudy,
          skills: candidate.skills,
          languages: candidate.languages,
          expectedSalary: candidate.expectedSalary,
          noticePeriodDays: candidate.noticePeriodDays,
          availableFrom: candidate.availableFrom ? this.toInputDate(candidate.availableFrom) : null,
          willingToRelocate: candidate.willingToRelocate,
          preferredLocations: candidate.preferredLocations,
          linkedinUrl: candidate.linkedinUrl,
          portfolioUrl: candidate.portfolioUrl
        });
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load candidate', err);
        this.toast.error('recruitment.candidateForm.loadError');
        this.loading.set(false);
        this.router.navigate(['/recruitment/candidates']);
      }
    });
  }

  private toInputDate(dateStr: string): string {
    return dateStr.split('T')[0];
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving.set(true);
    const formValue = this.form.value;

    if (this.isEditMode()) {
      const request: UpdateCandidateRequest = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        phone: formValue.phone,
        currentJobTitle: formValue.currentJobTitle,
        currentEmployer: formValue.currentEmployer,
        yearsExperience: formValue.yearsExperience,
        skills: formValue.skills,
        expectedSalary: formValue.expectedSalary,
        noticePeriodDays: formValue.noticePeriodDays,
        willingToRelocate: formValue.willingToRelocate
      };

      this.recruitmentService.updateCandidate(this.candidateId()!, request).subscribe({
        next: (candidate) => {
          this.saving.set(false);
          this.toast.success('recruitment.candidateForm.updateSuccess');
          this.router.navigate(['/recruitment/candidates', candidate.id]);
        },
        error: (err) => {
          console.error('Failed to update candidate', err);
          this.saving.set(false);
          this.toast.error('recruitment.candidateForm.updateError');
        }
      });
    } else {
      const request: CreateCandidateRequest = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        phone: formValue.phone,
        idNumber: formValue.idNumber,
        dateOfBirth: formValue.dateOfBirth || undefined,
        gender: formValue.gender || undefined,
        nationality: formValue.nationality,
        addressLine1: formValue.addressLine1,
        addressLine2: formValue.addressLine2,
        city: formValue.city,
        province: formValue.province,
        postalCode: formValue.postalCode,
        currentJobTitle: formValue.currentJobTitle,
        currentEmployer: formValue.currentEmployer,
        yearsExperience: formValue.yearsExperience,
        highestQualification: formValue.highestQualification,
        fieldOfStudy: formValue.fieldOfStudy,
        skills: formValue.skills,
        languages: formValue.languages,
        expectedSalary: formValue.expectedSalary,
        noticePeriodDays: formValue.noticePeriodDays,
        availableFrom: formValue.availableFrom || undefined,
        willingToRelocate: formValue.willingToRelocate,
        preferredLocations: formValue.preferredLocations,
        linkedinUrl: formValue.linkedinUrl,
        portfolioUrl: formValue.portfolioUrl,
        source: formValue.source,
        referredBy: formValue.referredBy
      };

      this.recruitmentService.createCandidate(request).subscribe({
        next: (candidate) => {
          this.saving.set(false);
          this.toast.success('recruitment.candidateForm.createSuccess');
          this.router.navigate(['/recruitment/candidates', candidate.id]);
        },
        error: (err) => {
          console.error('Failed to create candidate', err);
          this.saving.set(false);
          this.toast.error('recruitment.candidateForm.createError');
        }
      });
    }
  }

  cancel(): void {
    if (this.isEditMode()) {
      this.router.navigate(['/recruitment/candidates', this.candidateId()]);
    } else {
      this.router.navigate(['/recruitment/candidates']);
    }
  }
}
