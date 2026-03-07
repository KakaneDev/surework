import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  RecruitmentService,
  JobPosting,
  CreateJobRequest,
  UpdateJobRequest,
  EmploymentType,
  Province,
  Industry,
  EducationLevel,
  JobPortal,
  CompanyMentionPreference,
  CompensationType,
  ClientVisibility,
  ClientSummary
} from '../../../core/services/recruitment.service';
import { SpinnerComponent, ToastService } from '@shared/ui';

@Component({
  selector: 'app-job-posting-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    TranslateModule,
    SpinnerComponent
  ],
  template: `
    <div class="max-w-4xl mx-auto space-y-6">
      <!-- Header -->
      <div class="sw-page-header">
        <div class="flex items-center gap-3">
          <a [routerLink]="isEditMode() ? ['/recruitment/jobs', jobId()] : '/recruitment/jobs'" class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated transition-colors" [attr.aria-label]="'common.back' | translate">
            <span class="material-icons" aria-hidden="true">arrow_back</span>
          </a>
          <span class="material-icons text-3xl text-primary-500">work</span>
          <h1 class="sw-page-title">{{ (isEditMode() ? 'recruitment.jobForm.editTitle' : 'recruitment.jobForm.createTitle') | translate }}</h1>
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center items-center py-24">
          <sw-spinner size="lg" />
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
          <!-- Basic Information -->
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
            <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4">{{ 'recruitment.jobForm.basicInfo' | translate }}</h3>

            <div class="space-y-4">
              <div class="flex flex-col gap-1">
                <label class="sw-label">{{ 'recruitment.jobForm.jobTitle' | translate }} <span class="text-error-500">*</span></label>
                <input type="text" formControlName="title" [placeholder]="'recruitment.jobForm.jobTitlePlaceholder' | translate" class="sw-input" />
                @if (form.get('title')?.hasError('required') && form.get('title')?.touched) {
                  <span class="text-xs text-error-500">{{ 'recruitment.jobForm.titleRequired' | translate }}</span>
                }
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex flex-col gap-1">
                  <label class="sw-label">{{ 'recruitment.jobForm.department' | translate }}</label>
                  <input type="text" formControlName="departmentName" [placeholder]="'recruitment.jobForm.departmentPlaceholder' | translate" class="sw-input" />
                </div>

                <div class="flex flex-col gap-1">
                  <label class="sw-label">{{ 'recruitment.jobForm.location' | translate }}</label>
                  <input type="text" formControlName="location" [placeholder]="'recruitment.jobForm.locationPlaceholder' | translate" class="sw-input" />
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex flex-col gap-1">
                  <label class="sw-label">{{ 'recruitment.jobForm.employmentType' | translate }} <span class="text-error-500">*</span></label>
                  <select formControlName="employmentType" class="sw-input">
                    @for (type of employmentTypes; track type.value) {
                      <option [value]="type.value">{{ type.label | translate }}</option>
                    }
                  </select>
                </div>

                <div class="flex flex-col gap-1">
                  <label class="sw-label">{{ 'recruitment.jobForm.positionsAvailable' | translate }}</label>
                  <input type="number" formControlName="positionsAvailable" min="1" class="sw-input" />
                  @if (form.get('positionsAvailable')?.hasError('min')) {
                    <span class="text-xs text-error-500">{{ 'recruitment.jobForm.minPositionsRequired' | translate }}</span>
                  }
                </div>
              </div>

              <div class="flex gap-6">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" formControlName="remote" class="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500" />
                  <span class="text-neutral-700 dark:text-neutral-300">{{ 'recruitment.jobForm.remotePosition' | translate }}</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" formControlName="internalOnly" class="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500" />
                  <span class="text-neutral-700 dark:text-neutral-300">{{ 'recruitment.jobForm.internalCandidatesOnly' | translate }}</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Client & Engagement -->
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
            <div class="flex items-center gap-3 mb-4">
              <span class="material-icons text-primary-500">business</span>
              <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200">Client & Engagement</h3>
            </div>

            <div class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex flex-col gap-1">
                  <label class="sw-label">Client</label>
                  <select formControlName="clientId" class="sw-input">
                    <option value="">No client (direct hire)</option>
                    @for (client of activeClients(); track client.id) {
                      <option [value]="client.id">{{ client.name }}</option>
                    }
                  </select>
                  <span class="text-xs text-neutral-500">Select the client company this position is for</span>
                </div>

                @if (form.get('clientId')?.value) {
                  <div class="flex flex-col gap-1">
                    <label class="sw-label">Project / Engagement Name</label>
                    <input type="text" formControlName="projectName" placeholder="e.g., Digital Transformation Project" class="sw-input" />
                  </div>
                }
              </div>

              @if (form.get('clientId')?.value) {
                <div>
                  <label class="sw-label mb-2 block">Client Visibility on Public Listings</label>
                  <div class="space-y-2">
                    @for (vis of clientVisibilityOptions; track vis.value) {
                      <label class="flex items-start gap-2 cursor-pointer">
                        <input type="radio" formControlName="clientVisibility" [value]="vis.value"
                               class="w-4 h-4 mt-0.5 border-neutral-300 text-primary-500 focus:ring-primary-500" />
                        <span class="text-neutral-700 dark:text-neutral-300">
                          <span class="font-medium">{{ vis.label }}</span>
                          <span class="text-sm text-neutral-500 dark:text-neutral-400 block">{{ vis.description }}</span>
                        </span>
                      </label>
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Job Description -->
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
            <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4">{{ 'recruitment.jobForm.jobDescription' | translate }}</h3>

            <div class="space-y-4">
              <div class="flex flex-col gap-1">
                <label class="sw-label">{{ 'recruitment.jobForm.description' | translate }}</label>
                <textarea formControlName="description" rows="5" [placeholder]="'recruitment.jobForm.descriptionPlaceholder' | translate" class="sw-input"></textarea>
              </div>

              <div class="flex flex-col gap-1">
                <label class="sw-label">{{ 'recruitment.jobForm.requirements' | translate }}</label>
                <textarea formControlName="requirements" rows="4" [placeholder]="'recruitment.jobForm.requirementsPlaceholder' | translate" class="sw-input"></textarea>
              </div>

              <div class="flex flex-col gap-1">
                <label class="sw-label">{{ 'recruitment.jobForm.responsibilities' | translate }}</label>
                <textarea formControlName="responsibilities" rows="4" [placeholder]="'recruitment.jobForm.responsibilitiesPlaceholder' | translate" class="sw-input"></textarea>
              </div>

              <div class="flex flex-col gap-1">
                <label class="sw-label">{{ 'recruitment.jobForm.qualifications' | translate }}</label>
                <textarea formControlName="qualifications" rows="3" [placeholder]="'recruitment.jobForm.qualificationsPlaceholder' | translate" class="sw-input"></textarea>
              </div>

              <div class="flex flex-col gap-1">
                <label class="sw-label">{{ 'recruitment.jobForm.skills' | translate }}</label>
                <textarea formControlName="skills" rows="2" [placeholder]="'recruitment.jobForm.skillsPlaceholder' | translate" class="sw-input"></textarea>
              </div>
            </div>
          </div>

          <!-- Experience & Compensation -->
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
            <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4">{{ 'recruitment.jobForm.experienceCompensation' | translate }}</h3>

            <div class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex flex-col gap-1">
                  <label class="sw-label">{{ 'recruitment.jobForm.minExperience' | translate }}</label>
                  <input type="number" formControlName="experienceYearsMin" min="0" class="sw-input" />
                </div>

                <div class="flex flex-col gap-1">
                  <label class="sw-label">{{ 'recruitment.jobForm.maxExperience' | translate }}</label>
                  <input type="number" formControlName="experienceYearsMax" min="0" class="sw-input" />
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex flex-col gap-1">
                  <label class="sw-label">Compensation Type</label>
                  <select formControlName="compensationType" class="sw-input">
                    @for (ct of compensationTypes; track ct.value) {
                      <option [value]="ct.value">{{ ct.label }}</option>
                    }
                  </select>
                </div>

                <div class="flex flex-col gap-1">
                  <label class="sw-label">Currency</label>
                  <select formControlName="salaryCurrency" class="sw-input">
                    @for (c of currencies; track c.value) {
                      <option [value]="c.value">{{ c.label }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex flex-col gap-1">
                  <label class="sw-label">Min {{ getCompensationLabel() }} Rate</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">{{ getCurrencyPrefix() }}</span>
                    <input type="number" formControlName="salaryMin" min="0" class="sw-input pl-8" />
                  </div>
                </div>

                <div class="flex flex-col gap-1">
                  <label class="sw-label">Max {{ getCompensationLabel() }} Rate</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">{{ getCurrencyPrefix() }}</span>
                    <input type="number" formControlName="salaryMax" min="0" class="sw-input pl-8" />
                  </div>
                </div>
              </div>

              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" formControlName="showSalary" class="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500" />
                <span class="text-neutral-700 dark:text-neutral-300">{{ 'recruitment.jobForm.showSalary' | translate }}</span>
              </label>

              <div class="flex flex-col gap-1">
                <label class="sw-label">{{ 'recruitment.jobForm.benefits' | translate }}</label>
                <textarea formControlName="benefits" rows="3" [placeholder]="'recruitment.jobForm.benefitsPlaceholder' | translate" class="sw-input"></textarea>
              </div>
            </div>
          </div>

          <!-- Hiring Team -->
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
            <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4">{{ 'recruitment.jobForm.hiringTeam' | translate }}</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1">
                <label class="sw-label">{{ 'recruitment.jobForm.hiringManager' | translate }}</label>
                <input type="text" formControlName="hiringManagerName" [placeholder]="'recruitment.jobForm.hiringManagerPlaceholder' | translate" class="sw-input" />
              </div>

              <div class="flex flex-col gap-1">
                <label class="sw-label">{{ 'recruitment.jobForm.recruiter' | translate }}</label>
                <input type="text" formControlName="recruiterName" [placeholder]="'recruitment.jobForm.recruiterPlaceholder' | translate" class="sw-input" />
              </div>
            </div>
          </div>

          <!-- External Portal Publishing -->
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
            <div class="flex items-center gap-3 mb-4">
              <span class="material-icons text-primary-500">public</span>
              <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200">External Portal Publishing</h3>
            </div>

            <div class="space-y-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" formControlName="publishToExternal" class="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500" />
                <span class="text-neutral-700 dark:text-neutral-300">Publish to external job portals</span>
              </label>

              <p class="text-sm text-neutral-500 dark:text-neutral-400">
                Job will be posted under SureWork's accounts on selected portals. Candidates will apply via SureWork's careers page.
              </p>

              @if (form.get('publishToExternal')?.value) {
                <!-- Portal Selection -->
                <div class="p-4 bg-neutral-50 dark:bg-dark-elevated rounded-lg space-y-4">
                  <div>
                    <label class="sw-label mb-2 block">Select Portals</label>
                    <div class="flex flex-wrap gap-4">
                      @for (portal of jobPortals; track portal.value) {
                        <label class="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" [checked]="isPortalSelected(portal.value)" (change)="togglePortal(portal.value)"
                                 class="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500" />
                          <span class="text-neutral-700 dark:text-neutral-300">{{ portal.label }}</span>
                        </label>
                      }
                    </div>
                  </div>

                  <!-- Location Details -->
                  <div class="pt-4 border-t border-neutral-200 dark:border-dark-border">
                    <label class="sw-label mb-2 block">Location Details (required for external portals)</label>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div class="flex flex-col gap-1">
                        <label class="sw-label text-sm">City</label>
                        <input type="text" formControlName="city" placeholder="e.g., Johannesburg" class="sw-input" />
                      </div>

                      <div class="flex flex-col gap-1">
                        <label class="sw-label text-sm">Province</label>
                        <select formControlName="province" class="sw-input">
                          <option value="">Select province</option>
                          @for (province of provinces; track province.value) {
                            <option [value]="province.value">{{ province.label }}</option>
                          }
                        </select>
                      </div>

                      <div class="flex flex-col gap-1">
                        <label class="sw-label text-sm">Postal Code</label>
                        <input type="text" formControlName="postalCode" placeholder="e.g., 2000" class="sw-input" />
                      </div>
                    </div>
                  </div>

                  <!-- Industry & Education -->
                  <div class="pt-4 border-t border-neutral-200 dark:border-dark-border">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div class="flex flex-col gap-1">
                        <label class="sw-label">Industry</label>
                        <select formControlName="industry" class="sw-input">
                          <option value="">Select industry</option>
                          @for (ind of industries; track ind.value) {
                            <option [value]="ind.value">{{ ind.label }}</option>
                          }
                        </select>
                      </div>

                      <div class="flex flex-col gap-1">
                        <label class="sw-label">Education Level</label>
                        <select formControlName="educationLevel" class="sw-input">
                          <option value="">Select education level</option>
                          @for (level of educationLevels; track level.value) {
                            <option [value]="level.value">{{ level.label }}</option>
                          }
                        </select>
                      </div>
                    </div>
                  </div>

                  <!-- Company Mention Preference -->
                  <div class="pt-4 border-t border-neutral-200 dark:border-dark-border">
                    <label class="sw-label mb-2 block">How to reference your company in the job ad</label>
                    <div class="space-y-2">
                      @for (pref of companyMentionPreferences; track pref.value) {
                        <label class="flex items-start gap-2 cursor-pointer">
                          <input type="radio" formControlName="companyMentionPreference" [value]="pref.value"
                                 class="w-4 h-4 mt-0.5 border-neutral-300 text-primary-500 focus:ring-primary-500" />
                          <span class="text-neutral-700 dark:text-neutral-300">
                            <span class="font-medium">{{ pref.label }}</span>
                            <span class="text-sm text-neutral-500 dark:text-neutral-400 block">{{ pref.description }}</span>
                          </span>
                        </label>
                      }
                    </div>
                  </div>

                  <!-- Keywords -->
                  <div class="pt-4 border-t border-neutral-200 dark:border-dark-border">
                    <div class="flex flex-col gap-1">
                      <label class="sw-label">Keywords (for search optimization)</label>
                      <input type="text" formControlName="keywords" placeholder="e.g., Java, Spring Boot, Microservices" class="sw-input" />
                      <span class="text-xs text-neutral-500">Comma-separated keywords to help candidates find this job</span>
                    </div>
                  </div>

                  <!-- Contract Duration (for CONTRACT/TEMPORARY) -->
                  @if (form.get('employmentType')?.value === 'CONTRACT' || form.get('employmentType')?.value === 'TEMPORARY') {
                    <div class="pt-4 border-t border-neutral-200 dark:border-dark-border">
                      <div class="flex flex-col gap-1">
                        <label class="sw-label">Contract Duration</label>
                        <input type="text" formControlName="contractDuration" placeholder="e.g., 6 months, 1 year" class="sw-input" />
                      </div>
                    </div>
                  }

                  <!-- Application URL Info -->
                  <div class="pt-4 border-t border-neutral-200 dark:border-dark-border">
                    <div class="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                      <span class="material-icons text-primary-500 text-lg">info</span>
                      <div>
                        <p class="font-medium">Applications will be received at:</p>
                        <p class="text-primary-600 dark:text-primary-400">careers.surework.co.za/apply/{{ form.get('title')?.value ? 'JOB-XXXX' : '{jobRef}' }}</p>
                        <p class="mt-1">Candidates will appear in your Applicants dashboard after applying.</p>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-between items-center py-4">
            <button type="button" (click)="cancel()" class="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-elevated rounded-lg transition-colors">
              {{ 'common.cancel' | translate }}
            </button>
            <div class="flex gap-3">
              @if (!isEditMode()) {
                <button type="button" [disabled]="saving()" (click)="saveAsDraft()"
                        class="px-4 py-2 border border-neutral-300 dark:border-dark-border text-neutral-700 dark:text-neutral-300 font-medium rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {{ 'recruitment.jobForm.saveAsDraft' | translate }}
                </button>
              }
              <button type="submit" [disabled]="form.invalid || saving()"
                      class="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                @if (saving()) {
                  <sw-spinner size="sm" />
                }
                {{ (isEditMode() ? 'recruitment.jobForm.updateJob' : 'recruitment.jobForm.createJob') | translate }}
              </button>
            </div>
          </div>
        </form>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobPostingFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly recruitmentService = inject(RecruitmentService);
  private readonly toast = inject(ToastService);

  form: FormGroup;
  loading = signal(false);
  saving = signal(false);
  jobId = signal<string | null>(null);
  isEditMode = signal(false);

  employmentTypes = [
    { value: 'FULL_TIME', label: 'recruitment.employmentTypes.fullTime' },
    { value: 'PART_TIME', label: 'recruitment.employmentTypes.partTime' },
    { value: 'CONTRACT', label: 'recruitment.employmentTypes.contract' },
    { value: 'TEMPORARY', label: 'recruitment.employmentTypes.temporary' },
    { value: 'INTERNSHIP', label: 'recruitment.employmentTypes.internship' },
    { value: 'FREELANCE', label: 'recruitment.employmentTypes.freelance' }
  ];

  jobPortals = [
    { value: 'PNET' as JobPortal, label: 'Pnet' },
    { value: 'LINKEDIN' as JobPortal, label: 'LinkedIn' },
    { value: 'INDEED' as JobPortal, label: 'Indeed' },
    { value: 'CAREERS24' as JobPortal, label: 'Careers24' }
  ];

  provinces = [
    { value: 'GAUTENG' as Province, label: 'Gauteng' },
    { value: 'WESTERN_CAPE' as Province, label: 'Western Cape' },
    { value: 'KWAZULU_NATAL' as Province, label: 'KwaZulu-Natal' },
    { value: 'EASTERN_CAPE' as Province, label: 'Eastern Cape' },
    { value: 'FREE_STATE' as Province, label: 'Free State' },
    { value: 'LIMPOPO' as Province, label: 'Limpopo' },
    { value: 'MPUMALANGA' as Province, label: 'Mpumalanga' },
    { value: 'NORTH_WEST' as Province, label: 'North West' },
    { value: 'NORTHERN_CAPE' as Province, label: 'Northern Cape' }
  ];

  industries = [
    { value: 'IT_SOFTWARE' as Industry, label: 'IT & Software' },
    { value: 'FINANCE_BANKING' as Industry, label: 'Finance & Banking' },
    { value: 'HEALTHCARE' as Industry, label: 'Healthcare' },
    { value: 'RETAIL' as Industry, label: 'Retail' },
    { value: 'MANUFACTURING' as Industry, label: 'Manufacturing' },
    { value: 'CONSTRUCTION' as Industry, label: 'Construction' },
    { value: 'EDUCATION' as Industry, label: 'Education' },
    { value: 'HOSPITALITY_TOURISM' as Industry, label: 'Hospitality & Tourism' },
    { value: 'LOGISTICS_TRANSPORT' as Industry, label: 'Logistics & Transport' },
    { value: 'LEGAL' as Industry, label: 'Legal' },
    { value: 'MARKETING_ADVERTISING' as Industry, label: 'Marketing & Advertising' },
    { value: 'HUMAN_RESOURCES' as Industry, label: 'Human Resources' },
    { value: 'ENGINEERING' as Industry, label: 'Engineering' },
    { value: 'MINING' as Industry, label: 'Mining' },
    { value: 'AGRICULTURE' as Industry, label: 'Agriculture' },
    { value: 'TELECOMMUNICATIONS' as Industry, label: 'Telecommunications' },
    { value: 'REAL_ESTATE' as Industry, label: 'Real Estate' },
    { value: 'MEDIA_ENTERTAINMENT' as Industry, label: 'Media & Entertainment' },
    { value: 'GOVERNMENT_PUBLIC_SECTOR' as Industry, label: 'Government & Public Sector' },
    { value: 'NON_PROFIT' as Industry, label: 'Non-Profit' },
    { value: 'OTHER' as Industry, label: 'Other' }
  ];

  educationLevels = [
    { value: 'NO_REQUIREMENT' as EducationLevel, label: 'No Requirement' },
    { value: 'MATRIC' as EducationLevel, label: 'Matric / Grade 12' },
    { value: 'CERTIFICATE' as EducationLevel, label: 'Certificate' },
    { value: 'DIPLOMA' as EducationLevel, label: 'Diploma' },
    { value: 'DEGREE' as EducationLevel, label: 'Bachelor\'s Degree' },
    { value: 'HONOURS' as EducationLevel, label: 'Honours Degree' },
    { value: 'MASTERS' as EducationLevel, label: 'Master\'s Degree' },
    { value: 'DOCTORATE' as EducationLevel, label: 'Doctorate / PhD' }
  ];

  companyMentionPreferences = [
    { value: 'ANONYMOUS' as CompanyMentionPreference, label: 'Anonymous', description: '"A leading company in [industry]..."' },
    { value: 'NAMED_BY_SUREWORK' as CompanyMentionPreference, label: 'Named by SureWork', description: '"SureWork on behalf of [Your Company Name]..."' },
    { value: 'DIRECT_MENTION' as CompanyMentionPreference, label: 'Direct mention', description: 'Include company name directly in the job description' }
  ];

  selectedPortals = signal<JobPortal[]>([]);
  activeClients = signal<ClientSummary[]>([]);

  compensationTypes = [
    { value: 'HOURLY' as CompensationType, label: 'Hourly' },
    { value: 'DAILY' as CompensationType, label: 'Daily' },
    { value: 'WEEKLY' as CompensationType, label: 'Weekly' },
    { value: 'MONTHLY' as CompensationType, label: 'Monthly' },
    { value: 'ANNUAL' as CompensationType, label: 'Annual' }
  ];

  currencies = [
    { value: 'ZAR', label: 'ZAR (R)' },
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (\u20AC)' },
    { value: 'GBP', label: 'GBP (\u00A3)' }
  ];

  clientVisibilityOptions = [
    { value: 'SHOW_NAME' as ClientVisibility, label: 'Show Client Name', description: 'Client name visible on public job listing' },
    { value: 'CONFIDENTIAL' as ClientVisibility, label: 'Confidential', description: 'Shows "Confidential Client" on listing' },
    { value: 'HIDDEN' as ClientVisibility, label: 'Hidden', description: 'No client information shown publicly' }
  ];

  constructor() {
    this.form = this.fb.group({
      title: ['', Validators.required],
      departmentName: [''],
      location: [''],
      employmentType: ['FULL_TIME', Validators.required],
      positionsAvailable: [1, [Validators.required, Validators.min(1)]],
      remote: [false],
      internalOnly: [false],
      // Client & Engagement fields
      clientId: [''],
      clientVisibility: ['HIDDEN'],
      projectName: [''],
      description: [''],
      requirements: [''],
      responsibilities: [''],
      qualifications: [''],
      skills: [''],
      experienceYearsMin: [null],
      experienceYearsMax: [null],
      compensationType: ['MONTHLY'],
      salaryCurrency: ['ZAR'],
      salaryMin: [null],
      salaryMax: [null],
      showSalary: [false],
      benefits: [''],
      hiringManagerName: [''],
      recruiterName: [''],
      // External portal publishing fields
      publishToExternal: [false],
      city: [''],
      province: [''],
      postalCode: [''],
      industry: [''],
      educationLevel: [''],
      keywords: [''],
      contractDuration: [''],
      companyMentionPreference: ['ANONYMOUS']
    });
  }

  isPortalSelected(portal: JobPortal): boolean {
    return this.selectedPortals().includes(portal);
  }

  togglePortal(portal: JobPortal): void {
    const current = this.selectedPortals();
    if (current.includes(portal)) {
      this.selectedPortals.set(current.filter(p => p !== portal));
    } else {
      this.selectedPortals.set([...current, portal]);
    }
  }

  ngOnInit(): void {
    this.loadActiveClients();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.jobId.set(id);
      this.isEditMode.set(true);
      this.loadJob(id);
    }
  }

  private loadActiveClients(): void {
    this.recruitmentService.getActiveClients().subscribe({
      next: (clients) => this.activeClients.set(clients),
      error: () => {} // Silently fail — dropdown just empty
    });
  }

  getCompensationLabel(): string {
    const type = this.form.get('compensationType')?.value as CompensationType;
    return RecruitmentService.getCompensationTypeLabel(type || 'MONTHLY');
  }

  getCurrencyPrefix(): string {
    const currency = this.form.get('salaryCurrency')?.value || 'ZAR';
    return RecruitmentService.getCurrencySymbol(currency);
  }

  loadJob(id: string): void {
    this.loading.set(true);
    this.recruitmentService.getJob(id).subscribe({
      next: (job) => {
        this.form.patchValue({
          title: job.title,
          departmentName: job.departmentName,
          location: job.location,
          employmentType: job.employmentType,
          positionsAvailable: job.positionsAvailable,
          remote: job.remote,
          internalOnly: job.internalOnly,
          description: job.description,
          requirements: job.requirements,
          responsibilities: job.responsibilities,
          qualifications: job.qualifications,
          skills: job.skills,
          experienceYearsMin: job.experienceYearsMin,
          experienceYearsMax: job.experienceYearsMax,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          showSalary: job.showSalary,
          benefits: job.benefits,
          hiringManagerName: job.hiringManagerName,
          recruiterName: job.recruiterName,
          // Client & Compensation fields
          clientId: job.clientId || '',
          clientVisibility: job.clientVisibility || 'HIDDEN',
          projectName: job.projectName || '',
          compensationType: job.compensationType || 'MONTHLY',
          salaryCurrency: job.salaryCurrency || 'ZAR',
          // External portal fields
          publishToExternal: job.publishToExternal || false,
          city: job.city || '',
          province: job.province || '',
          postalCode: job.postalCode || '',
          industry: job.industry || '',
          educationLevel: job.educationLevel || '',
          keywords: job.keywords || '',
          contractDuration: job.contractDuration || '',
          companyMentionPreference: job.companyMentionPreference || 'ANONYMOUS'
        });
        // Set selected portals
        if (job.externalPortals) {
          this.selectedPortals.set(job.externalPortals);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load job', err);
        this.toast.error('recruitment.jobForm.loadError');
        this.loading.set(false);
        this.router.navigate(['/recruitment/jobs']);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving.set(true);
    const formValue = this.form.value;

    if (this.isEditMode()) {
      const request: UpdateJobRequest = {
        title: formValue.title,
        location: formValue.location,
        description: formValue.description,
        requirements: formValue.requirements,
        responsibilities: formValue.responsibilities,
        qualifications: formValue.qualifications,
        skills: formValue.skills,
        experienceYearsMin: formValue.experienceYearsMin,
        experienceYearsMax: formValue.experienceYearsMax,
        salaryMin: formValue.salaryMin,
        salaryMax: formValue.salaryMax,
        showSalary: formValue.showSalary,
        benefits: formValue.benefits,
        positionsAvailable: formValue.positionsAvailable,
        internalOnly: formValue.internalOnly,
        remote: formValue.remote,
        // Client & Compensation fields
        clientId: formValue.clientId || undefined,
        clientVisibility: formValue.clientId ? formValue.clientVisibility : undefined,
        compensationType: formValue.compensationType || undefined,
        salaryCurrency: formValue.salaryCurrency || undefined,
        projectName: formValue.projectName || undefined,
        // External portal fields
        publishToExternal: formValue.publishToExternal,
        city: formValue.city,
        province: formValue.province || undefined,
        postalCode: formValue.postalCode,
        industry: formValue.industry || undefined,
        educationLevel: formValue.educationLevel || undefined,
        keywords: formValue.keywords,
        contractDuration: formValue.contractDuration,
        externalPortals: this.selectedPortals().length > 0 ? this.selectedPortals() : undefined,
        companyMentionPreference: formValue.companyMentionPreference || undefined
      };

      this.recruitmentService.updateJob(this.jobId()!, request).subscribe({
        next: (job) => {
          this.saving.set(false);
          this.toast.success('recruitment.jobForm.updateSuccess');
          this.router.navigate(['/recruitment/jobs', job.id]);
        },
        error: (err) => {
          console.error('Failed to update job', err);
          this.saving.set(false);
          this.toast.error('recruitment.jobForm.updateError');
        }
      });
    } else {
      const request: CreateJobRequest = {
        title: formValue.title,
        departmentName: formValue.departmentName,
        location: formValue.location,
        employmentType: formValue.employmentType,
        description: formValue.description,
        requirements: formValue.requirements,
        responsibilities: formValue.responsibilities,
        qualifications: formValue.qualifications,
        skills: formValue.skills,
        experienceYearsMin: formValue.experienceYearsMin,
        experienceYearsMax: formValue.experienceYearsMax,
        salaryMin: formValue.salaryMin,
        salaryMax: formValue.salaryMax,
        showSalary: formValue.showSalary,
        benefits: formValue.benefits,
        positionsAvailable: formValue.positionsAvailable,
        hiringManagerName: formValue.hiringManagerName,
        recruiterName: formValue.recruiterName,
        internalOnly: formValue.internalOnly,
        remote: formValue.remote,
        // Client & Compensation fields
        clientId: formValue.clientId || undefined,
        clientVisibility: formValue.clientId ? formValue.clientVisibility : undefined,
        compensationType: formValue.compensationType || undefined,
        salaryCurrency: formValue.salaryCurrency || undefined,
        projectName: formValue.projectName || undefined,
        // External portal fields
        publishToExternal: formValue.publishToExternal,
        city: formValue.city,
        province: formValue.province || undefined,
        postalCode: formValue.postalCode,
        industry: formValue.industry || undefined,
        educationLevel: formValue.educationLevel || undefined,
        keywords: formValue.keywords,
        contractDuration: formValue.contractDuration,
        externalPortals: this.selectedPortals().length > 0 ? this.selectedPortals() : undefined,
        companyMentionPreference: formValue.companyMentionPreference || undefined
      };

      this.recruitmentService.createJob(request).subscribe({
        next: (job) => {
          this.saving.set(false);
          this.toast.success('recruitment.jobForm.createSuccess');
          this.router.navigate(['/recruitment/jobs', job.id]);
        },
        error: (err) => {
          console.error('Failed to create job', err);
          this.saving.set(false);
          this.toast.error('recruitment.jobForm.createError');
        }
      });
    }
  }

  saveAsDraft(): void {
    if (!this.form.get('title')?.value) {
      this.toast.error('recruitment.jobForm.titleRequired');
      return;
    }

    this.saving.set(true);
    const formValue = this.form.value;

    const request: CreateJobRequest = {
      title: formValue.title,
      departmentName: formValue.departmentName,
      location: formValue.location,
      employmentType: formValue.employmentType || 'FULL_TIME',
      description: formValue.description,
      requirements: formValue.requirements,
      responsibilities: formValue.responsibilities,
      qualifications: formValue.qualifications,
      skills: formValue.skills,
      experienceYearsMin: formValue.experienceYearsMin,
      experienceYearsMax: formValue.experienceYearsMax,
      salaryMin: formValue.salaryMin,
      salaryMax: formValue.salaryMax,
      showSalary: formValue.showSalary || false,
      benefits: formValue.benefits,
      positionsAvailable: formValue.positionsAvailable || 1,
      hiringManagerName: formValue.hiringManagerName,
      recruiterName: formValue.recruiterName,
      internalOnly: formValue.internalOnly || false,
      remote: formValue.remote || false,
      // Client & Compensation fields
      clientId: formValue.clientId || undefined,
      clientVisibility: formValue.clientId ? formValue.clientVisibility : undefined,
      compensationType: formValue.compensationType || undefined,
      salaryCurrency: formValue.salaryCurrency || undefined,
      projectName: formValue.projectName || undefined,
      // External portal fields (saved with draft)
      publishToExternal: formValue.publishToExternal || false,
      city: formValue.city,
      province: formValue.province || undefined,
      postalCode: formValue.postalCode,
      industry: formValue.industry || undefined,
      educationLevel: formValue.educationLevel || undefined,
      keywords: formValue.keywords,
      contractDuration: formValue.contractDuration,
      externalPortals: this.selectedPortals().length > 0 ? this.selectedPortals() : undefined,
      companyMentionPreference: formValue.companyMentionPreference || undefined
    };

    this.recruitmentService.createJob(request).subscribe({
      next: (job) => {
        this.saving.set(false);
        this.toast.success('recruitment.jobForm.draftSaveSuccess');
        this.router.navigate(['/recruitment/jobs', job.id]);
      },
      error: (err) => {
        console.error('Failed to save draft', err);
        this.saving.set(false);
        this.toast.error('recruitment.jobForm.draftSaveError');
      }
    });
  }

  cancel(): void {
    if (this.isEditMode()) {
      this.router.navigate(['/recruitment/jobs', this.jobId()]);
    } else {
      this.router.navigate(['/recruitment/jobs']);
    }
  }
}
