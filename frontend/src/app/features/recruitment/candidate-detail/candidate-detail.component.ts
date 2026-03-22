import { Component, ChangeDetectionStrategy, inject, signal, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpEventType } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  RecruitmentService,
  Candidate,
  Application,
  Interview
} from '../../../core/services/recruitment.service';
import { DocumentService, EmployeeDocument, DocumentCategory } from '../../../core/services/document.service';
import { ApplyToJobDialogComponent } from '../dialogs/apply-to-job-dialog.component';
import { SpinnerComponent, ButtonComponent, IconButtonComponent, TabsComponent, TabPanelComponent, DropdownComponent, DropdownItemComponent, ToastService, DialogService } from '@shared/ui';
import {
  getCandidateStatusClasses,
  getApplicationStageClasses,
  getVariantClasses,
  getInterviewStatusConfig,
  getRecommendationConfig
} from '@shared/ui/status-config';

@Component({
  selector: 'app-candidate-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DatePipe,
    DecimalPipe,
    TranslateModule,
    SpinnerComponent,
    ButtonComponent,
    IconButtonComponent,
    TabsComponent,
    TabPanelComponent,
    DropdownComponent,
    DropdownItemComponent
  ],
  template: `
    <div class="space-y-6">
      @if (loading()) {
        <div class="flex justify-center items-center py-24">
          <sw-spinner size="lg" />
        </div>
      } @else if (error()) {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <span class="material-icons text-5xl text-error-500 mb-4">error</span>
          <p class="text-neutral-600 dark:text-neutral-400 mb-4">{{ error() }}</p>
          <a routerLink="/recruitment/candidates" class="px-4 py-2 text-primary-500 hover:text-primary-600 font-medium">
            {{ 'recruitment.candidateDetail.backToCandidates' | translate }}
          </a>
        </div>
      } @else if (candidate()) {
        <!-- Header -->
        <div class="sw-page-header">
          <div class="flex items-center gap-3">
            <a routerLink="/recruitment/candidates" class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated transition-colors" [attr.aria-label]="'common.back' | translate">
              <span class="material-icons" aria-hidden="true">arrow_back</span>
            </a>
            <div>
              <h1 class="sw-page-title flex items-center gap-3">
                {{ candidate()!.fullName }}
                <span class="inline-block px-3 py-1 rounded-full text-xs font-medium"
                      [class]="getCandidateStatusClasses(candidate()!.status)">
                  {{ getCandidateStatusLabel(candidate()!.status) }}
                </span>
                @if (candidate()!.blacklisted) {
                  <span class="px-2 py-1 bg-error-100 text-error-700 dark:bg-error-900/20 dark:text-error-400 rounded text-xs font-medium">{{ 'recruitment.candidateDetail.blacklisted' | translate }}</span>
                }
              </h1>
              <p class="text-sm text-neutral-500 dark:text-neutral-400 font-mono">{{ candidate()!.candidateReference }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            @if (candidate()!.status === 'ACTIVE' && !candidate()!.blacklisted) {
              <sw-button variant="primary" (clicked)="openApplyToJobDialog()">
                <span class="material-icons text-lg">work</span>
                {{ 'recruitment.candidateDetail.applyToJob' | translate }}
              </sw-button>
            }
            <a [routerLink]="['/recruitment/candidates', candidate()!.id, 'edit']">
              <sw-button variant="outline">
                <span class="material-icons text-lg">edit</span>
                {{ 'recruitment.candidateDetail.edit' | translate }}
              </sw-button>
            </a>
            @if (candidate()!.status === 'ACTIVE' && !candidate()!.blacklisted) {
              <sw-dropdown position="bottom-end">
                <button trigger class="inline-flex items-center gap-2 px-3 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-elevated rounded-lg">
                  <span class="material-icons">more_vert</span>
                  {{ 'recruitment.candidateDetail.actions' | translate }}
                </button>
                <sw-dropdown-item icon="archive" (click)="archiveCandidate()">{{ 'recruitment.candidateDetail.archive' | translate }}</sw-dropdown-item>
                <sw-dropdown-item icon="block" [danger]="true" (click)="blacklistCandidate()">{{ 'recruitment.candidateDetail.blacklist' | translate }}</sw-dropdown-item>
              </sw-dropdown>
            }
            @if (candidate()!.blacklisted) {
              <sw-button variant="primary" (clicked)="removeFromBlacklist()">
                {{ 'recruitment.candidateDetail.removeFromBlacklist' | translate }}
              </sw-button>
            }
          </div>
        </div>

        <!-- Tabs -->
        <sw-tabs [tabs]="[
          ('recruitment.candidateDetail.tabs.profile' | translate),
          ('recruitment.candidateDetail.tabs.applications' | translate) + ' (' + applications().length + ')',
          ('recruitment.candidateDetail.tabs.interviews' | translate) + ' (' + interviews().length + ')',
          ('recruitment.candidateDetail.tabs.source' | translate),
          ('recruitment.candidateDetail.tabs.documents' | translate)
        ]" [(activeTab)]="activeTab">
          <!-- Profile Tab -->
          <sw-tab-panel [active]="activeTab === 0">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Contact Information -->
              <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
                <h3 class="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-4">{{ 'recruitment.candidateDetail.contactInformation' | translate }}</h3>
                <div class="space-y-3">
                  <div class="flex items-center gap-3 py-2">
                    <span class="material-icons text-neutral-400">email</span>
                    <a [href]="'mailto:' + candidate()!.email" class="text-primary-500 hover:text-primary-600">{{ candidate()!.email }}</a>
                  </div>
                  @if (candidate()!.phone) {
                    <div class="flex items-center gap-3 py-2">
                      <span class="material-icons text-neutral-400">phone</span>
                      <a [href]="'tel:' + candidate()!.phone" class="text-primary-500 hover:text-primary-600">{{ candidate()!.phone }}</a>
                    </div>
                  }
                  @if (candidate()!.city || candidate()!.province) {
                    <div class="flex items-center gap-3 py-2">
                      <span class="material-icons text-neutral-400">location_on</span>
                      <span class="text-neutral-700 dark:text-neutral-300">{{ getLocation() }}</span>
                    </div>
                  }
                  @if (candidate()!.linkedinUrl) {
                    <div class="flex items-center gap-3 py-2">
                      <span class="material-icons text-neutral-400">link</span>
                      <a [href]="candidate()!.linkedinUrl" target="_blank" class="text-primary-500 hover:text-primary-600">{{ 'recruitment.candidateDetail.linkedinProfile' | translate }}</a>
                    </div>
                  }
                  @if (candidate()!.portfolioUrl) {
                    <div class="flex items-center gap-3 py-2">
                      <span class="material-icons text-neutral-400">work</span>
                      <a [href]="candidate()!.portfolioUrl" target="_blank" class="text-primary-500 hover:text-primary-600">{{ 'recruitment.candidateDetail.portfolio' | translate }}</a>
                    </div>
                  }
                </div>
              </div>

              <!-- Professional Information -->
              <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
                <h3 class="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-4">{{ 'recruitment.candidateDetail.professionalInformation' | translate }}</h3>
                <div class="space-y-3">
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                    <span class="text-neutral-500 dark:text-neutral-400">{{ 'recruitment.candidateDetail.currentTitle' | translate }}</span>
                    <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ candidate()!.currentJobTitle || '-' }}</span>
                  </div>
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                    <span class="text-neutral-500 dark:text-neutral-400">{{ 'recruitment.candidateDetail.currentEmployer' | translate }}</span>
                    <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ candidate()!.currentEmployer || '-' }}</span>
                  </div>
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                    <span class="text-neutral-500 dark:text-neutral-400">{{ 'recruitment.candidateDetail.experience' | translate }}</span>
                    <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ candidate()!.experienceLevel || '-' }}</span>
                  </div>
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                    <span class="text-neutral-500 dark:text-neutral-400">{{ 'recruitment.candidateDetail.qualification' | translate }}</span>
                    <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ candidate()!.highestQualification || '-' }}</span>
                  </div>
                  <div class="flex justify-between py-2">
                    <span class="text-neutral-500 dark:text-neutral-400">{{ 'recruitment.candidateDetail.fieldOfStudy' | translate }}</span>
                    <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ candidate()!.fieldOfStudy || '-' }}</span>
                  </div>
                </div>
              </div>

              <!-- Preferences -->
              <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
                <h3 class="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-4">{{ 'recruitment.candidateDetail.preferences' | translate }}</h3>
                <div class="space-y-3">
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                    <span class="text-neutral-500 dark:text-neutral-400">{{ 'recruitment.candidateDetail.expectedSalary' | translate }}</span>
                    <span class="font-medium text-neutral-800 dark:text-neutral-200">
                      @if (candidate()!.expectedSalary) {
                        R{{ candidate()!.expectedSalary | number }}
                      } @else {
                        {{ 'recruitment.candidateDetail.notSpecified' | translate }}
                      }
                    </span>
                  </div>
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                    <span class="text-neutral-500 dark:text-neutral-400">{{ 'recruitment.candidateDetail.noticePeriod' | translate }}</span>
                    <span class="font-medium text-neutral-800 dark:text-neutral-200">
                      @if (candidate()!.noticePeriodDays) {
                        {{ candidate()!.noticePeriodDays }} {{ 'recruitment.candidateDetail.days' | translate }}
                      } @else {
                        {{ 'recruitment.candidateDetail.notSpecified' | translate }}
                      }
                    </span>
                  </div>
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                    <span class="text-neutral-500 dark:text-neutral-400">{{ 'recruitment.candidateDetail.availableFrom' | translate }}</span>
                    <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ candidate()!.availableFrom | date:'mediumDate' }}</span>
                  </div>
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                    <span class="text-neutral-500 dark:text-neutral-400">{{ 'recruitment.candidateDetail.willingToRelocate' | translate }}</span>
                    <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ candidate()!.willingToRelocate ? ('recruitment.candidateDetail.yes' | translate) : ('recruitment.candidateDetail.no' | translate) }}</span>
                  </div>
                  @if (candidate()!.preferredLocations) {
                    <div class="flex justify-between py-2">
                      <span class="text-neutral-500 dark:text-neutral-400">{{ 'recruitment.candidateDetail.preferredLocations' | translate }}</span>
                      <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ candidate()!.preferredLocations }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Skills -->
              <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
                <h3 class="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-4">{{ 'recruitment.candidateDetail.skillsAndLanguages' | translate }}</h3>
                @if (candidate()!.skills) {
                  <div class="mb-4">
                    <h4 class="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">{{ 'recruitment.candidateDetail.skills' | translate }}</h4>
                    <p class="text-neutral-700 dark:text-neutral-300 leading-relaxed">{{ candidate()!.skills }}</p>
                  </div>
                }
                @if (candidate()!.languages) {
                  <div>
                    <h4 class="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">{{ 'recruitment.candidateDetail.languages' | translate }}</h4>
                    <p class="text-neutral-700 dark:text-neutral-300 leading-relaxed">{{ candidate()!.languages }}</p>
                  </div>
                }
                @if (!candidate()!.skills && !candidate()!.languages) {
                  <p class="text-neutral-400 dark:text-neutral-500 italic">{{ 'recruitment.candidateDetail.noSkillsOrLanguages' | translate }}</p>
                }
              </div>
            </div>
          </sw-tab-panel>

          <!-- Applications Tab -->
          <sw-tab-panel [active]="activeTab === 1">
            @if (applications().length === 0) {
              <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
                <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4">work_outline</span>
                <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">{{ 'recruitment.candidateDetail.noApplicationsYet' | translate }}</h3>
                <p class="text-neutral-500 dark:text-neutral-400">{{ 'recruitment.candidateDetail.noApplicationsDescription' | translate }}</p>
              </div>
            } @else {
              <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
                <div class="overflow-x-auto">
                  <table class="sw-table">
                    <thead>
                      <tr>
                        <th>{{ 'recruitment.candidateDetail.position' | translate }}</th>
                        <th>{{ 'recruitment.candidateDetail.stage' | translate }}</th>
                        <th>{{ 'recruitment.candidateDetail.status' | translate }}</th>
                        <th>{{ 'recruitment.candidateDetail.applied' | translate }}</th>
                        <th>{{ 'recruitment.candidateDetail.daysInPipeline' | translate }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (app of applications(); track app.id) {
                        <tr>
                          <td>
                            <a [routerLink]="['/recruitment/jobs', app.job.id]" class="text-primary-500 hover:text-primary-600 font-medium">
                              {{ app.job.title }}
                            </a>
                          </td>
                          <td>
                            <span class="inline-block px-2 py-1 rounded-full text-xs font-medium"
                                  [class]="getApplicationStageClasses(app.stage)">
                              {{ getStageLabel(app.stage) }}
                            </span>
                          </td>
                          <td class="text-neutral-600 dark:text-neutral-400">{{ getApplicationStatusLabel(app.status) }}</td>
                          <td class="text-neutral-600 dark:text-neutral-400">{{ app.applicationDate | date:'mediumDate' }}</td>
                          <td class="text-neutral-600 dark:text-neutral-400">{{ app.daysSinceApplication }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }
          </sw-tab-panel>

          <!-- Interviews Tab -->
          <sw-tab-panel [active]="activeTab === 2">
            @if (loadingInterviews()) {
              <div class="flex justify-center items-center py-16 gap-3 text-neutral-500 dark:text-neutral-400">
                <sw-spinner size="sm" />
                <span>{{ 'recruitment.candidateDetail.loadingInterviews' | translate }}</span>
              </div>
            } @else if (interviews().length === 0) {
              <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
                <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4">event_busy</span>
                <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">{{ 'recruitment.candidateDetail.noInterviewsYet' | translate }}</h3>
                <p class="text-neutral-500 dark:text-neutral-400">{{ 'recruitment.candidateDetail.noInterviewsDescription' | translate }}</p>
              </div>
            } @else {
              <div class="space-y-4">
                @for (interview of interviews(); track interview.id) {
                  <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden"
                       [class.border-l-4]="interview.feedback"
                       [class.border-l-success-500]="interview.feedback">
                    <div class="p-6">
                      <div class="flex items-start justify-between mb-4">
                        <div class="flex items-center gap-3">
                          <span class="material-icons text-2xl text-primary-500">{{ getInterviewTypeIcon(interview.interviewType) }}</span>
                          <div>
                            <h4 class="font-semibold text-neutral-800 dark:text-neutral-200">{{ getInterviewTypeLabel(interview.interviewType) }}</h4>
                            <span class="text-sm text-neutral-500 dark:text-neutral-400">{{ interview.jobTitle }}</span>
                          </div>
                        </div>
                        <span class="inline-block px-3 py-1 rounded-full text-xs font-medium"
                              [class]="getInterviewStatusClasses(interview.status)">
                          {{ getInterviewStatusLabel(interview.status) }}
                        </span>
                      </div>

                      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div class="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                          <span class="material-icons text-lg">event</span>
                          <span>{{ interview.scheduledAt | date:'EEEE, MMM d, y' }}</span>
                        </div>
                        <div class="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                          <span class="material-icons text-lg">schedule</span>
                          <span>{{ interview.scheduledAt | date:'h:mm a' }} ({{ interview.durationMinutes }} min)</span>
                        </div>
                        <div class="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                          <span class="material-icons text-lg">person</span>
                          <span>{{ interview.interviewerName || ('recruitment.candidateDetail.notAssigned' | translate) }}</span>
                        </div>
                        <div class="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                          <span class="material-icons text-lg">{{ interview.locationType === 'REMOTE' ? 'videocam' : 'place' }}</span>
                          <span>{{ interview.locationDetails || interview.locationType }}</span>
                        </div>
                      </div>

                      @if (interview.overallRating || interview.recommendation || interview.feedback) {
                        <div class="border-t border-neutral-200 dark:border-dark-border mt-4 pt-4">
                          <h5 class="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-3">{{ 'recruitment.candidateDetail.interviewFeedback' | translate }}</h5>

                          @if (interview.overallRating) {
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              @if (interview.technicalRating) {
                                <div class="flex flex-col gap-1">
                                  <span class="text-xs text-neutral-500 dark:text-neutral-400">{{ 'recruitment.candidateDetail.technical' | translate }}</span>
                                  <div class="flex gap-0.5">
                                    @for (star of [1,2,3,4,5]; track star) {
                                      <span class="material-icons text-sm" [class.text-warning-400]="star <= interview.technicalRating!" [class.text-neutral-300]="star > interview.technicalRating!">star</span>
                                    }
                                  </div>
                                </div>
                              }
                              @if (interview.communicationRating) {
                                <div class="flex flex-col gap-1">
                                  <span class="text-xs text-neutral-500 dark:text-neutral-400">{{ 'recruitment.candidateDetail.communication' | translate }}</span>
                                  <div class="flex gap-0.5">
                                    @for (star of [1,2,3,4,5]; track star) {
                                      <span class="material-icons text-sm" [class.text-warning-400]="star <= interview.communicationRating!" [class.text-neutral-300]="star > interview.communicationRating!">star</span>
                                    }
                                  </div>
                                </div>
                              }
                              @if (interview.culturalFitRating) {
                                <div class="flex flex-col gap-1">
                                  <span class="text-xs text-neutral-500 dark:text-neutral-400">{{ 'recruitment.candidateDetail.culturalFit' | translate }}</span>
                                  <div class="flex gap-0.5">
                                    @for (star of [1,2,3,4,5]; track star) {
                                      <span class="material-icons text-sm" [class.text-warning-400]="star <= interview.culturalFitRating!" [class.text-neutral-300]="star > interview.culturalFitRating!">star</span>
                                    }
                                  </div>
                                </div>
                              }
                              <div class="flex flex-col gap-1 bg-neutral-50 dark:bg-dark-elevated p-2 rounded-lg">
                                <span class="text-xs text-neutral-500 dark:text-neutral-400">{{ 'recruitment.candidateDetail.overall' | translate }}</span>
                                <div class="flex gap-0.5">
                                  @for (star of [1,2,3,4,5]; track star) {
                                    <span class="material-icons text-sm" [class.text-warning-400]="star <= interview.overallRating!" [class.text-neutral-300]="star > interview.overallRating!">star</span>
                                  }
                                </div>
                              </div>
                            </div>
                          }

                          @if (interview.recommendation) {
                            <div class="flex items-center gap-2 mb-3">
                              <span class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'recruitment.candidateDetail.recommendation' | translate }}:</span>
                              <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                                    [class]="getRecommendationClasses(interview.recommendation)">
                                {{ getRecommendationLabel(interview.recommendation) }}
                              </span>
                            </div>
                          }

                          @if (interview.feedback) {
                            <div class="bg-neutral-50 dark:bg-dark-elevated p-3 rounded-lg">
                              <span class="text-xs font-medium text-neutral-500 dark:text-neutral-400 block mb-1">{{ 'recruitment.candidateDetail.notes' | translate }}:</span>
                              <p class="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{{ interview.feedback }}</p>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </sw-tab-panel>

          <!-- Source Tab -->
          <sw-tab-panel [active]="activeTab === 3">
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
              <div class="space-y-3">
                <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                  <span class="text-neutral-500 dark:text-neutral-400">{{ 'recruitment.candidateDetail.sourceLabel' | translate }}</span>
                  <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ candidate()!.source || ('recruitment.candidateDetail.notSpecified' | translate) }}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                  <span class="text-neutral-500 dark:text-neutral-400">{{ 'recruitment.candidateDetail.internalCandidate' | translate }}</span>
                  <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ candidate()!.internalCandidate ? ('recruitment.candidateDetail.yes' | translate) : ('recruitment.candidateDetail.no' | translate) }}</span>
                </div>
                <div class="flex justify-between py-2">
                  <span class="text-neutral-500 dark:text-neutral-400">{{ 'recruitment.candidateDetail.addedOn' | translate }}</span>
                  <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ candidate()!.createdAt | date:'medium' }}</span>
                </div>
              </div>
            </div>
          </sw-tab-panel>

          <!-- Documents Tab -->
          <sw-tab-panel [active]="activeTab === 4">
            <div class="max-w-4xl">
              <!-- Header -->
              <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-5 mb-6">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                      <span class="material-icons text-white text-2xl">folder_copy</span>
                    </div>
                    <div>
                      <h3 class="font-semibold text-neutral-800 dark:text-neutral-200">{{ 'recruitment.candidateDetail.candidateDocuments' | translate }}</h3>
                      <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'recruitment.candidateDetail.manageDocuments' | translate }}</p>
                    </div>
                  </div>
                  <input type="file" #fileInput (change)="onFileSelected($event)" class="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx" />
                  <sw-button variant="primary" [disabled]="uploading()" (clicked)="fileInput.click()">
                    <span class="material-icons text-lg">add</span>
                    {{ 'recruitment.candidateDetail.uploadDocument' | translate }}
                  </sw-button>
                </div>
              </div>

              <!-- Upload Progress -->
              @if (uploading()) {
                <div class="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4 mb-6">
                  <div class="flex items-center gap-4 mb-3">
                    <span class="material-icons text-2xl text-primary-500 animate-pulse">upload_file</span>
                    <div>
                      <span class="font-medium text-primary-700 dark:text-primary-300">{{ uploadingFileName() }}</span>
                      <span class="text-sm text-primary-600 dark:text-primary-400 block">{{ 'recruitment.candidateDetail.uploading' | translate }} {{ uploadProgress() }}%</span>
                    </div>
                  </div>
                  <div class="h-2 bg-primary-200 dark:bg-primary-800 rounded-full overflow-hidden">
                    <div class="h-full bg-primary-500 transition-all duration-300" [style.width.%]="uploadProgress()"></div>
                  </div>
                </div>
              }

              <!-- Content -->
              @if (loadingDocuments()) {
                <div class="flex justify-center items-center py-16 gap-3 text-neutral-500 dark:text-neutral-400">
                  <sw-spinner size="sm" />
                  <span>{{ 'recruitment.candidateDetail.loadingDocuments' | translate }}</span>
                </div>
              } @else if (documentsError()) {
                <div class="bg-warning-50 dark:bg-warning-900/20 border-2 border-dashed border-warning-300 dark:border-warning-700 rounded-xl p-12 text-center">
                  <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-warning-100 dark:bg-warning-800/50 flex items-center justify-center">
                    <span class="material-icons text-4xl text-warning-600 dark:text-warning-400">cloud_off</span>
                  </div>
                  <h4 class="text-lg font-semibold text-warning-800 dark:text-warning-200 mb-2">{{ 'recruitment.candidateDetail.unableToLoadDocuments' | translate }}</h4>
                  <p class="text-warning-600 dark:text-warning-400 mb-4">{{ 'recruitment.candidateDetail.documentServiceUnavailable' | translate }}</p>
                  <sw-button variant="outline" (clicked)="loadDocuments(candidateId)">
                    <span class="material-icons">refresh</span>
                    {{ 'recruitment.candidateDetail.tryAgain' | translate }}
                  </sw-button>
                </div>
              } @else if (documents().length === 0) {
                <div class="bg-neutral-50 dark:bg-dark-elevated border-2 border-dashed border-neutral-300 dark:border-dark-border rounded-xl p-12 text-center">
                  <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                    <span class="material-icons text-4xl text-white">description</span>
                  </div>
                  <h4 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">{{ 'recruitment.candidateDetail.noDocumentsYet' | translate }}</h4>
                  <p class="text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm mx-auto">{{ 'recruitment.candidateDetail.noDocumentsDescription' | translate }}</p>
                  <sw-button variant="primary" (clicked)="fileInput.click()">
                    <span class="material-icons">add</span>
                    {{ 'recruitment.candidateDetail.uploadFirstDocument' | translate }}
                  </sw-button>
                  <p class="text-xs text-neutral-400 dark:text-neutral-500 mt-4">{{ 'recruitment.candidateDetail.supportedFormats' | translate }}</p>
                </div>
              } @else {
                <!-- Stats -->
                <div class="flex gap-4 mb-4">
                  <div class="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-dark-elevated rounded-lg">
                    <span class="material-icons text-neutral-500">description</span>
                    <span class="font-bold text-neutral-800 dark:text-neutral-200">{{ documents().length }}</span>
                    <span class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'recruitment.candidateDetail.totalDocuments' | translate }}</span>
                  </div>
                  <div class="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-dark-elevated rounded-lg">
                    <span class="material-icons text-neutral-500">lock</span>
                    <span class="font-bold text-neutral-800 dark:text-neutral-200">{{ getConfidentialCount() }}</span>
                    <span class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'recruitment.candidateDetail.confidential' | translate }}</span>
                  </div>
                </div>

                <!-- Documents List -->
                <div class="space-y-3">
                  @for (doc of documents(); track doc.id) {
                    <div class="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200 dark:border-dark-border p-4 flex items-center gap-4 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all"
                         [class.border-l-4]="doc.confidential"
                         [class.border-l-warning-500]="doc.confidential">
                      <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                           [ngClass]="getCategoryBgClass(doc.category)">
                        <span class="material-icons text-xl" [ngClass]="getCategoryTextClass(doc.category)">{{ getCategoryIcon(doc.category) }}</span>
                        @if (doc.confidential) {
                          <span class="absolute -bottom-1 -right-1 w-5 h-5 bg-warning-500 rounded-full flex items-center justify-center">
                            <span class="material-icons text-white text-xs">lock</span>
                          </span>
                        }
                      </div>
                      <div class="flex-1 min-w-0">
                        <h4 class="font-semibold text-neutral-800 dark:text-neutral-200 truncate">{{ doc.name }}</h4>
                        <div class="flex items-center gap-2 text-sm">
                          <span class="px-2 py-0.5 bg-neutral-100 dark:bg-dark-elevated text-neutral-600 dark:text-neutral-400 rounded text-xs font-medium">{{ getCategoryLabel(doc.category) }}</span>
                          <span class="text-neutral-400">•</span>
                          <span class="text-neutral-500 dark:text-neutral-400">{{ doc.formattedFileSize || formatFileSize(doc.fileSize) }}</span>
                          <span class="text-neutral-400">•</span>
                          <span class="text-neutral-400 dark:text-neutral-500">{{ doc.uploadedAt | date:'mediumDate' }}</span>
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <sw-icon-button variant="primary" (clicked)="downloadDocument(doc)" [ariaLabel]="'common.download' | translate">
                          <span class="material-icons text-lg">download</span>
                        </sw-icon-button>
                        <sw-dropdown position="bottom-end">
                          <button trigger class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated" [attr.aria-label]="'common.moreOptions' | translate">
                            <span class="material-icons">more_vert</span>
                          </button>
                          <sw-dropdown-item icon="download" (click)="downloadDocument(doc)">{{ 'recruitment.candidateDetail.download' | translate }}</sw-dropdown-item>
                          <sw-dropdown-item icon="delete" [danger]="true" (click)="deleteDocument(doc)">{{ 'recruitment.candidateDetail.delete' | translate }}</sw-dropdown-item>
                        </sw-dropdown>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </sw-tab-panel>
        </sw-tabs>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CandidateDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly recruitmentService = inject(RecruitmentService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(DialogService);
  private readonly documentService = inject(DocumentService);
  private readonly translate = inject(TranslateService);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  candidate = signal<Candidate | null>(null);
  applications = signal<Application[]>([]);
  interviews = signal<Interview[]>([]);
  loadingInterviews = signal(false);
  loading = signal(true);
  error = signal<string | null>(null);

  // Tab state
  activeTab = 0;

  // Document state
  documents = signal<EmployeeDocument[]>([]);
  loadingDocuments = signal(false);
  documentsError = signal(false);
  uploading = signal(false);
  uploadProgress = signal(0);
  uploadingFileName = signal('');
  candidateId = '';

  applicationColumns = ['job', 'stage', 'status', 'applied', 'days'];

  ngOnInit(): void {
    const candidateId = this.route.snapshot.paramMap.get('id');
    if (candidateId) {
      this.candidateId = candidateId;
      this.loadCandidate(candidateId);
      this.loadApplications(candidateId);
      this.loadDocuments(candidateId);
    } else {
      this.error.set(this.translate.instant('recruitment.candidateDetail.errors.candidateIdNotFound'));
      this.loading.set(false);
    }
  }

  loadCandidate(candidateId: string): void {
    this.loading.set(true);
    this.recruitmentService.getCandidate(candidateId).subscribe({
      next: (candidate) => {
        this.candidate.set(candidate);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load candidate', err);
        this.error.set(this.translate.instant('recruitment.candidateDetail.errors.failedToLoadCandidate'));
        this.loading.set(false);
      }
    });
  }

  loadApplications(candidateId: string): void {
    this.recruitmentService.getApplicationsForCandidate(candidateId).subscribe({
      next: (apps) => {
        this.applications.set(apps);
        this.loadInterviewsForApplications(apps);
      },
      error: (err) => {
        console.error('Failed to load applications', err);
      }
    });
  }

  loadInterviewsForApplications(apps: Application[]): void {
    if (apps.length === 0) {
      this.interviews.set([]);
      return;
    }

    this.loadingInterviews.set(true);
    const allInterviews: Interview[] = [];
    let completed = 0;

    apps.forEach(app => {
      this.recruitmentService.getInterviewsForApplication(app.id).subscribe({
        next: (interviews) => {
          allInterviews.push(...interviews);
          completed++;
          if (completed === apps.length) {
            allInterviews.sort((a, b) =>
              new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
            );
            this.interviews.set(allInterviews);
            this.loadingInterviews.set(false);
          }
        },
        error: () => {
          completed++;
          if (completed === apps.length) {
            this.interviews.set(allInterviews);
            this.loadingInterviews.set(false);
          }
        }
      });
    });
  }

  openApplyToJobDialog(): void {
    if (!this.candidate()) return;

    const dialogRef = this.dialog.open(ApplyToJobDialogComponent, {
      width: '500px',
      data: { candidate: this.candidate() }
    });

    dialogRef.afterClosed().then(result => {
      if (result) {
        this.toast.success(this.translate.instant('recruitment.candidateDetail.messages.applicationSubmitted'));
        this.loadApplications(this.candidate()!.id);
      }
    });
  }

  archiveCandidate(): void {
    if (!this.candidate()) return;
    if (confirm(this.translate.instant('recruitment.candidateDetail.confirmations.archiveCandidate', { name: this.candidate()!.fullName }))) {
      this.recruitmentService.archiveCandidate(this.candidate()!.id).subscribe({
        next: () => {
          this.toast.success(this.translate.instant('recruitment.candidateDetail.messages.candidateArchived'));
          this.loadCandidate(this.candidate()!.id);
        },
        error: () => this.toast.error(this.translate.instant('recruitment.candidateDetail.errors.failedToArchive'))
      });
    }
  }

  blacklistCandidate(): void {
    if (!this.candidate()) return;
    const reason = prompt(this.translate.instant('recruitment.candidateDetail.prompts.blacklistReason'));
    if (reason) {
      this.recruitmentService.blacklistCandidate(this.candidate()!.id, reason).subscribe({
        next: () => {
          this.toast.success(this.translate.instant('recruitment.candidateDetail.messages.candidateBlacklisted'));
          this.loadCandidate(this.candidate()!.id);
        },
        error: () => this.toast.error(this.translate.instant('recruitment.candidateDetail.errors.failedToBlacklist'))
      });
    }
  }

  removeFromBlacklist(): void {
    if (!this.candidate()) return;
    if (confirm(this.translate.instant('recruitment.candidateDetail.confirmations.removeFromBlacklist', { name: this.candidate()!.fullName }))) {
      this.recruitmentService.removeFromBlacklist(this.candidate()!.id).subscribe({
        next: () => {
          this.toast.success(this.translate.instant('recruitment.candidateDetail.messages.removedFromBlacklist'));
          this.loadCandidate(this.candidate()!.id);
        },
        error: () => this.toast.error(this.translate.instant('recruitment.candidateDetail.errors.failedToRemoveFromBlacklist'))
      });
    }
  }

  getCandidateStatusLabel(status: string): string {
    return RecruitmentService.getCandidateStatusLabel(status as any);
  }

  getCandidateStatusClasses(status: string): string {
    return getCandidateStatusClasses(status);
  }

  getApplicationStageClasses(stage: string): string {
    return getApplicationStageClasses(stage);
  }

  getStageLabel(stage: string): string {
    return RecruitmentService.getRecruitmentStageLabel(stage as any);
  }

  getStageColor(stage: string): { background: string; color: string } {
    return RecruitmentService.getStageColor(stage as any);
  }

  getApplicationStatusLabel(status: string): string {
    return RecruitmentService.getApplicationStatusLabel(status as any);
  }

  getInterviewTypeLabel(type: string): string {
    return RecruitmentService.getInterviewTypeLabel(type as any);
  }

  getInterviewTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      PHONE_SCREEN: 'phone',
      VIDEO_CALL: 'videocam',
      IN_PERSON: 'person',
      TECHNICAL: 'code',
      BEHAVIORAL: 'psychology',
      PANEL: 'groups',
      GROUP: 'group',
      CASE_STUDY: 'assignment',
      FINAL: 'verified'
    };
    return icons[type] || 'event';
  }

  getInterviewStatusLabel(status: string): string {
    return RecruitmentService.getInterviewStatusLabel(status as any);
  }

  getInterviewStatusClasses(status: string): string {
    const config = getInterviewStatusConfig(status);
    return getVariantClasses(config.variant);
  }

  getRecommendationLabel(rec: string): string {
    return RecruitmentService.getRecommendationLabel(rec as any);
  }

  getRecommendationClasses(rec: string): string {
    const config = getRecommendationConfig(rec);
    return getVariantClasses(config.variant);
  }

  getLocation(): string {
    const c = this.candidate();
    if (!c) return '';
    const parts = [c.city, c.province].filter(p => !!p);
    return parts.join(', ');
  }

  // Document methods
  loadDocuments(candidateId: string): void {
    this.loadingDocuments.set(true);
    this.documentsError.set(false);
    this.documentService.getCandidateDocuments(candidateId).subscribe({
      next: (docs) => {
        this.documents.set(docs);
        this.loadingDocuments.set(false);
      },
      error: () => {
        this.loadingDocuments.set(false);
        this.documentsError.set(true);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    this.uploadingFileName.set(file.name);
    this.uploading.set(true);
    this.uploadProgress.set(0);

    const category = this.detectCategory(file.name);
    const candidate = this.candidate();

    const metadata = {
      name: file.name.replace(/\.[^/.]+$/, ''),
      category,
      ownerType: 'CANDIDATE' as const,
      ownerId: this.candidateId,
      ownerName: candidate?.fullName
    };

    const uploaderId = '00000000-0000-0000-0000-000000000100';

    this.documentService.uploadDocument(file, metadata, uploaderId).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress.set(Math.round(100 * event.loaded / event.total));
        } else if (event.type === HttpEventType.Response) {
          this.uploading.set(false);
          this.toast.success(this.translate.instant('recruitment.candidateDetail.messages.documentUploaded'));
          this.loadDocuments(this.candidateId);
        }
      },
      error: (err) => {
        this.uploading.set(false);
        this.toast.error(this.translate.instant('recruitment.candidateDetail.errors.failedToUpload'));
        console.error('Upload error:', err);
      }
    });

    input.value = '';
  }

  detectCategory(fileName: string): DocumentCategory {
    const lower = fileName.toLowerCase();
    if (lower.includes('cv') || lower.includes('resume')) return 'CV';
    if (lower.includes('id') || lower.includes('identity')) return 'ID_DOCUMENT';
    if (lower.includes('passport')) return 'PASSPORT';
    if (lower.includes('degree') || lower.includes('diploma') || lower.includes('qualification')) return 'QUALIFICATION';
    if (lower.includes('certificate') || lower.includes('cert')) return 'CERTIFICATION';
    if (lower.includes('training')) return 'TRAINING_CERTIFICATE';
    return 'OTHER';
  }

  downloadDocument(doc: EmployeeDocument): void {
    this.documentService.downloadDocument(doc.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.toast.error(this.translate.instant('recruitment.candidateDetail.errors.failedToDownload'));
      }
    });
  }

  deleteDocument(doc: EmployeeDocument): void {
    if (!confirm(this.translate.instant('recruitment.candidateDetail.confirmations.deleteDocument', { name: doc.name }))) return;

    this.documentService.deleteDocument(doc.id).subscribe({
      next: () => {
        this.toast.success(this.translate.instant('recruitment.candidateDetail.messages.documentDeleted'));
        this.loadDocuments(this.candidateId);
      },
      error: () => {
        this.toast.error(this.translate.instant('recruitment.candidateDetail.errors.failedToDelete'));
      }
    });
  }

  getConfidentialCount(): number {
    return this.documents().filter(d => d.confidential).length;
  }

  getCategoryLabel(category: string): string {
    return DocumentService.getCategoryLabel(category);
  }

  getCategoryIcon(category: string): string {
    return DocumentService.getCategoryIcon(category);
  }

  getCategoryBgClass(category: string): string {
    const classes: Record<string, string> = {
      'CV': 'bg-pink-100 dark:bg-pink-900/20',
      'ID_DOCUMENT': 'bg-amber-100 dark:bg-amber-900/20',
      'PASSPORT': 'bg-blue-100 dark:bg-blue-900/20',
      'QUALIFICATION': 'bg-green-100 dark:bg-green-900/20',
      'CERTIFICATION': 'bg-purple-100 dark:bg-purple-900/20',
      'TRAINING_CERTIFICATE': 'bg-red-100 dark:bg-red-900/20'
    };
    return classes[category] || 'bg-primary-100 dark:bg-primary-900/20';
  }

  getCategoryTextClass(category: string): string {
    const classes: Record<string, string> = {
      'CV': 'text-pink-600 dark:text-pink-400',
      'ID_DOCUMENT': 'text-amber-600 dark:text-amber-400',
      'PASSPORT': 'text-blue-600 dark:text-blue-400',
      'QUALIFICATION': 'text-green-600 dark:text-green-400',
      'CERTIFICATION': 'text-purple-600 dark:text-purple-400',
      'TRAINING_CERTIFICATE': 'text-red-600 dark:text-red-400'
    };
    return classes[category] || 'text-primary-600 dark:text-primary-400';
  }

  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
