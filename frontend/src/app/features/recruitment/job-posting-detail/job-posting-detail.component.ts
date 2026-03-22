import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  RecruitmentService,
  JobPosting,
  Application,
  RecruitmentStage,
  ExternalJobPosting,
  ExternalPostingStatus,
  JobPortal,
  CompensationType
} from '../../../core/services/recruitment.service';
import { StageChangeDialogComponent } from '../dialogs/stage-change-dialog.component';
import { ScheduleInterviewDialogComponent } from '../dialogs/schedule-interview-dialog.component';
import { MakeOfferDialogComponent } from '../dialogs/make-offer-dialog.component';
import { HireCandidateDialogComponent } from '../dialogs/hire-candidate-dialog.component';
import { PostToPortalsDialogComponent } from '../dialogs/post-to-portals-dialog/post-to-portals-dialog.component';
import { SpinnerComponent, ButtonComponent, TabsComponent, TabPanelComponent, DropdownComponent, DropdownItemComponent, ToastService, DialogService } from '@shared/ui';

@Component({
  selector: 'app-job-posting-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DatePipe,
    TranslateModule,
    SpinnerComponent,
    ButtonComponent,
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
          <a routerLink="/recruitment/jobs" class="px-4 py-2 text-primary-500 hover:text-primary-600 font-medium">
            {{ 'recruitment.jobDetail.backToJobs' | translate }}
          </a>
        </div>
      } @else if (job()) {
        <!-- Header -->
        <div class="sw-page-header">
          <div class="flex items-center gap-3">
            <a routerLink="/recruitment/jobs" class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated transition-colors" [attr.aria-label]="'common.back' | translate">
              <span class="material-icons" aria-hidden="true">arrow_back</span>
            </a>
            <div>
              <h1 class="sw-page-title flex items-center gap-3">
                {{ job()!.title }}
                <span class="inline-block px-3 py-1 rounded-full text-xs font-medium"
                      [style.background]="getJobStatusColor(job()!.status).background"
                      [style.color]="getJobStatusColor(job()!.status).color">
                  {{ getJobStatusLabelTranslated(job()!.status) }}
                </span>
                @if (job()!.remote) {
                  <span class="px-2 py-1 bg-success-100 text-success-700 dark:bg-success-900/20 dark:text-success-400 rounded text-xs font-medium">{{ 'recruitment.jobDetail.remote' | translate }}</span>
                }
              </h1>
              <p class="text-sm text-neutral-500 dark:text-neutral-400 font-mono">{{ job()!.jobReference }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <a [routerLink]="['/recruitment/jobs', job()!.id, 'edit']">
              <sw-button variant="outline">
                <span class="material-icons text-lg">edit</span>
                {{ 'recruitment.jobDetail.actions.edit' | translate }}
              </sw-button>
            </a>
            @if (job()!.status === 'DRAFT') {
              <sw-button variant="primary" (clicked)="publishJob()">
                <span class="material-icons text-lg">publish</span>
                {{ 'recruitment.jobDetail.actions.publish' | translate }}
              </sw-button>
            }
            @if (job()!.status === 'OPEN') {
              <sw-dropdown position="bottom-end">
                <button trigger class="inline-flex items-center gap-2 px-3 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-elevated rounded-lg">
                  <span class="material-icons">more_vert</span>
                  {{ 'recruitment.jobDetail.actions.actions' | translate }}
                </button>
                <sw-dropdown-item icon="pause" (click)="putOnHold()">{{ 'recruitment.jobDetail.actions.putOnHold' | translate }}</sw-dropdown-item>
                <sw-dropdown-item icon="close" (click)="closeJob()">{{ 'recruitment.jobDetail.actions.closeJob' | translate }}</sw-dropdown-item>
                <sw-dropdown-item icon="check_circle" (click)="markAsFilled()">{{ 'recruitment.jobDetail.actions.markAsFilled' | translate }}</sw-dropdown-item>
              </sw-dropdown>
            }
            @if (job()!.status === 'ON_HOLD') {
              <sw-button variant="primary" (clicked)="reopenJob()">
                <span class="material-icons text-lg">play_arrow</span>
                {{ 'recruitment.jobDetail.actions.reopen' | translate }}
              </sw-button>
            }
            @if (job()!.status === 'OPEN') {
              <sw-button variant="outline" (clicked)="openPostToPortalsDialog()">
                <span class="material-icons text-lg">share</span>
                Post to Portals
              </sw-button>
            }
          </div>
        </div>

        <!-- Stats -->
        <div class="flex items-center gap-8 p-4 bg-neutral-50 dark:bg-dark-elevated rounded-xl">
          <div class="flex items-center gap-3">
            <span class="material-icons text-neutral-400">people</span>
            <span class="text-xl font-semibold text-neutral-800 dark:text-neutral-200">{{ job()!.applicationCount }}</span>
            <span class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'recruitment.jobDetail.stats.applications' | translate }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="material-icons text-neutral-400">visibility</span>
            <span class="text-xl font-semibold text-neutral-800 dark:text-neutral-200">{{ job()!.viewCount }}</span>
            <span class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'recruitment.jobDetail.stats.views' | translate }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="material-icons text-neutral-400">work</span>
            <span class="text-xl font-semibold text-neutral-800 dark:text-neutral-200">{{ job()!.positionsFilled }}/{{ job()!.positionsAvailable }}</span>
            <span class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'recruitment.jobDetail.stats.filled' | translate }}</span>
          </div>
          @if (job()!.closingDate) {
            <div class="flex items-center gap-3">
              <span class="material-icons text-neutral-400">event</span>
              <span class="text-xl font-semibold text-neutral-800 dark:text-neutral-200">{{ job()!.closingDate | date:'mediumDate' }}</span>
              <span class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'recruitment.jobDetail.stats.closing' | translate }}</span>
            </div>
          }
        </div>

        <!-- External Postings Status -->
        @if (externalPostings().length > 0) {
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-base font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                <span class="material-icons text-primary-500">share</span>
                External Portal Postings
              </h3>
              <button (click)="refreshExternalPostings()" class="p-1 rounded hover:bg-neutral-100 dark:hover:bg-dark-elevated">
                <span class="material-icons text-neutral-400 text-lg">refresh</span>
              </button>
            </div>
            <div class="flex flex-wrap gap-3">
              @for (posting of externalPostings(); track posting.id) {
                <a [routerLink]="['/recruitment/external-postings', posting.id]"
                   class="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-50 dark:bg-dark-elevated hover:bg-neutral-100 dark:hover:bg-dark-border transition-colors">
                  <span class="material-icons text-lg" [ngClass]="getPortalIconClass(posting.portal)">{{ getPortalIcon(posting.portal) }}</span>
                  <span class="font-medium text-neutral-700 dark:text-neutral-300">{{ getPortalLabel(posting.portal) }}</span>
                  <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                        [style.background]="getExternalPostingStatusColor(posting.status).background"
                        [style.color]="getExternalPostingStatusColor(posting.status).color">
                    {{ getExternalPostingStatusLabel(posting.status) }}
                  </span>
                </a>
              }
            </div>
          </div>
        }

        <!-- Tabs -->
        <sw-tabs [tabs]="tabLabels()" [(activeTab)]="activeTab">
          <!-- Overview Tab -->
          <sw-tab-panel [active]="activeTab === 0">
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 class="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-4">{{ 'recruitment.jobDetail.sections.basicInformation' | translate }}</h3>
                  <div class="space-y-3">
                    <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                      <span class="text-neutral-500 dark:text-neutral-400">{{ 'recruitment.jobDetail.fields.department' | translate }}</span>
                      <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ job()!.departmentName || '-' }}</span>
                    </div>
                    <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                      <span class="text-neutral-500 dark:text-neutral-400">{{ 'recruitment.jobDetail.fields.location' | translate }}</span>
                      <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ job()!.location || '-' }}</span>
                    </div>
                    <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                      <span class="text-neutral-500 dark:text-neutral-400">{{ 'recruitment.jobDetail.fields.employmentType' | translate }}</span>
                      <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ getEmploymentTypeLabelTranslated(job()!.employmentType) }}</span>
                    </div>
                    <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                      <span class="text-neutral-500 dark:text-neutral-400">{{ 'recruitment.jobDetail.fields.experienceRequired' | translate }}</span>
                      <span class="font-medium text-neutral-800 dark:text-neutral-200">
                        @if (job()!.experienceYearsMin || job()!.experienceYearsMax) {
                          {{ job()!.experienceYearsMin || 0 }} - {{ job()!.experienceYearsMax || ('recruitment.jobDetail.any' | translate) }} {{ 'recruitment.jobDetail.years' | translate }}
                        } @else {
                          {{ 'recruitment.jobDetail.notSpecified' | translate }}
                        }
                      </span>
                    </div>
                    <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                      <span class="text-neutral-500 dark:text-neutral-400">{{ 'recruitment.jobDetail.fields.salaryRange' | translate }}</span>
                      <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ job()!.salaryRange || ('recruitment.jobDetail.notDisclosed' | translate) }}</span>
                    </div>
                    @if (job()!.compensationType && job()!.compensationType !== 'MONTHLY') {
                      <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                        <span class="text-neutral-500 dark:text-neutral-400">Compensation Type</span>
                        <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ getCompensationTypeLabel(job()!.compensationType!) }}</span>
                      </div>
                    }
                    @if (job()!.salaryCurrency && job()!.salaryCurrency !== 'ZAR') {
                      <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                        <span class="text-neutral-500 dark:text-neutral-400">Currency</span>
                        <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ job()!.salaryCurrency }}</span>
                      </div>
                    }
                    @if (job()!.clientName) {
                      <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                        <span class="text-neutral-500 dark:text-neutral-400">Client</span>
                        <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ job()!.clientName }}</span>
                      </div>
                    }
                    @if (job()!.projectName) {
                      <div class="flex justify-between py-2">
                        <span class="text-neutral-500 dark:text-neutral-400">Project</span>
                        <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ job()!.projectName }}</span>
                      </div>
                    }
                  </div>
                </div>

                <div>
                  <h3 class="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-4">{{ 'recruitment.jobDetail.sections.team' | translate }}</h3>
                  <div class="space-y-3">
                    <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                      <span class="text-neutral-500 dark:text-neutral-400">{{ 'recruitment.jobDetail.fields.hiringManager' | translate }}</span>
                      <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ job()!.hiringManagerName || '-' }}</span>
                    </div>
                    <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                      <span class="text-neutral-500 dark:text-neutral-400">{{ 'recruitment.jobDetail.fields.recruiter' | translate }}</span>
                      <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ job()!.recruiterName || '-' }}</span>
                    </div>
                    <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                      <span class="text-neutral-500 dark:text-neutral-400">{{ 'recruitment.jobDetail.fields.postedDate' | translate }}</span>
                      <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ job()!.postingDate | date:'mediumDate' }}</span>
                    </div>
                    <div class="flex justify-between py-2">
                      <span class="text-neutral-500 dark:text-neutral-400">{{ 'recruitment.jobDetail.fields.internalOnly' | translate }}</span>
                      <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ job()!.internalOnly ? ('common.yes' | translate) : ('common.no' | translate) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              @if (job()!.description) {
                <div class="border-t border-neutral-200 dark:border-dark-border pt-6 mt-6">
                  <h3 class="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-3">{{ 'recruitment.jobDetail.sections.description' | translate }}</h3>
                  <p class="text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap leading-relaxed">{{ job()!.description }}</p>
                </div>
              }

              @if (job()!.requirements) {
                <div class="border-t border-neutral-200 dark:border-dark-border pt-6 mt-6">
                  <h3 class="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-3">{{ 'recruitment.jobDetail.sections.requirements' | translate }}</h3>
                  <p class="text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap leading-relaxed">{{ job()!.requirements }}</p>
                </div>
              }

              @if (job()!.responsibilities) {
                <div class="border-t border-neutral-200 dark:border-dark-border pt-6 mt-6">
                  <h3 class="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-3">{{ 'recruitment.jobDetail.sections.responsibilities' | translate }}</h3>
                  <p class="text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap leading-relaxed">{{ job()!.responsibilities }}</p>
                </div>
              }

              @if (job()!.qualifications) {
                <div class="border-t border-neutral-200 dark:border-dark-border pt-6 mt-6">
                  <h3 class="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-3">{{ 'recruitment.jobDetail.sections.qualifications' | translate }}</h3>
                  <p class="text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap leading-relaxed">{{ job()!.qualifications }}</p>
                </div>
              }

              @if (job()!.skills) {
                <div class="border-t border-neutral-200 dark:border-dark-border pt-6 mt-6">
                  <h3 class="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-3">{{ 'recruitment.jobDetail.sections.skills' | translate }}</h3>
                  <p class="text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap leading-relaxed">{{ job()!.skills }}</p>
                </div>
              }

              @if (job()!.benefits) {
                <div class="border-t border-neutral-200 dark:border-dark-border pt-6 mt-6">
                  <h3 class="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-3">{{ 'recruitment.jobDetail.sections.benefits' | translate }}</h3>
                  <p class="text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap leading-relaxed">{{ job()!.benefits }}</p>
                </div>
              }
            </div>
          </sw-tab-panel>

          <!-- Candidates Tab -->
          <sw-tab-panel [active]="activeTab === 1">
            <!-- Pipeline Summary -->
            @if (applications().length > 0) {
              <div class="flex flex-wrap gap-2 mb-6">
                @for (stage of pipelineStages; track stage) {
                  <button (click)="filterByStage(stage)"
                          class="flex flex-col items-center px-4 py-3 rounded-lg min-w-[80px] transition-all"
                          [class.bg-primary-100]="selectedStage() === stage"
                          [class.border-2]="selectedStage() === stage"
                          [class.border-primary-500]="selectedStage() === stage"
                          [class.bg-neutral-100]="selectedStage() !== stage"
                          [class.dark:bg-dark-elevated]="selectedStage() !== stage">
                    <span class="text-xl font-semibold text-neutral-800 dark:text-neutral-200">{{ getStageCount(stage) }}</span>
                    <span class="text-xs text-neutral-500 dark:text-neutral-400 text-center">{{ getStageLabelTranslated(stage) }}</span>
                  </button>
                }
              </div>
            }

            @if (applicationsLoading()) {
              <div class="flex justify-center items-center py-16">
                <sw-spinner size="md" />
              </div>
            } @else if (filteredApplications().length === 0) {
              <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
                <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4">people_outline</span>
                <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">{{ 'recruitment.jobDetail.candidates.noCandidatesTitle' | translate }}</h3>
                <p class="text-neutral-500 dark:text-neutral-400">{{ 'recruitment.jobDetail.candidates.noCandidatesDescription' | translate }}</p>
              </div>
            } @else {
              <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
                <div class="overflow-x-auto">
                  <table class="sw-table">
                    <thead>
                      <tr>
                        <th>{{ 'recruitment.jobDetail.candidates.table.candidate' | translate }}</th>
                        <th>{{ 'recruitment.jobDetail.candidates.table.stage' | translate }}</th>
                        <th>{{ 'recruitment.jobDetail.candidates.table.rating' | translate }}</th>
                        <th>{{ 'recruitment.jobDetail.candidates.table.applied' | translate }}</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (app of filteredApplications(); track app.id) {
                        <tr [ngClass]="{'bg-warning-50': app.starred}">
                          <td>
                            <div class="flex flex-col">
                              <a [routerLink]="['/recruitment/candidates', app.candidate.id]" class="text-primary-500 hover:text-primary-600 font-medium">
                                {{ app.candidate.fullName }}
                              </a>
                              <span class="text-xs text-neutral-500 dark:text-neutral-400">{{ app.candidate.currentJobTitle || '-' }}</span>
                            </div>
                          </td>
                          <td>
                            <span class="inline-block px-2 py-1 rounded-full text-xs font-medium"
                                  [style.background]="getStageColor(app.stage).background"
                                  [style.color]="getStageColor(app.stage).color">
                              {{ getStageLabelTranslated(app.stage) }}
                            </span>
                          </td>
                          <td>
                            @if (app.overallRating) {
                              <div class="flex gap-0.5">
                                @for (star of [1, 2, 3, 4, 5]; track star) {
                                  <span class="material-icons text-sm" [class.text-warning-400]="star <= app.overallRating" [class.text-neutral-300]="star > app.overallRating">star</span>
                                }
                              </div>
                            } @else {
                              <span class="text-neutral-400">-</span>
                            }
                          </td>
                          <td class="text-neutral-600 dark:text-neutral-400">{{ app.applicationDate | date:'mediumDate' }}</td>
                          <td (click)="$event.stopPropagation()">
                            <sw-dropdown position="bottom-end">
                              <button trigger class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated" [attr.aria-label]="'common.moreOptions' | translate">
                                <span class="material-icons">more_vert</span>
                              </button>
                              <sw-dropdown-item icon="person" [routerLink]="['/recruitment/candidates', app.candidate.id]">{{ 'recruitment.jobDetail.candidates.actions.viewCandidate' | translate }}</sw-dropdown-item>
                              <sw-dropdown-item icon="trending_up" (click)="changeStage(app)">{{ 'recruitment.jobDetail.candidates.actions.changeStage' | translate }}</sw-dropdown-item>
                              <sw-dropdown-item icon="event" (click)="scheduleInterview(app)">{{ 'recruitment.jobDetail.candidates.actions.scheduleInterview' | translate }}</sw-dropdown-item>
                              @if (app.stage !== 'OFFER' && app.stage !== 'COMPLETED') {
                                <sw-dropdown-item icon="local_offer" (click)="makeOffer(app)">{{ 'recruitment.jobDetail.candidates.actions.makeOffer' | translate }}</sw-dropdown-item>
                              }
                              @if (app.stage === 'ONBOARDING') {
                                <sw-dropdown-item icon="check_circle" (click)="markAsHired(app)">
                                  {{ 'recruitment.jobDetail.candidates.actions.markAsHired' | translate }}
                                </sw-dropdown-item>
                              }
                              <sw-dropdown-item [icon]="app.starred ? 'star' : 'star_border'" (click)="toggleStarred(app)">{{ app.starred ? ('recruitment.jobDetail.candidates.actions.unstar' | translate) : ('recruitment.jobDetail.candidates.actions.star' | translate) }}</sw-dropdown-item>
                              <sw-dropdown-item icon="block" (click)="rejectApplication(app)" class="text-error-600">{{ 'recruitment.jobDetail.candidates.actions.reject' | translate }}</sw-dropdown-item>
                            </sw-dropdown>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }
          </sw-tab-panel>

          <!-- Statistics Tab -->
          <sw-tab-panel [active]="activeTab === 2">
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="text-center p-6 bg-neutral-50 dark:bg-dark-elevated rounded-xl">
                  <h4 class="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">{{ 'recruitment.jobDetail.statistics.conversionRate' | translate }}</h4>
                  <span class="text-4xl font-bold text-primary-500">{{ conversionRate() }}%</span>
                  <span class="block text-sm text-neutral-500 dark:text-neutral-400 mt-1">{{ 'recruitment.jobDetail.statistics.applicationsToHire' | translate }}</span>
                </div>
                <div class="text-center p-6 bg-neutral-50 dark:bg-dark-elevated rounded-xl">
                  <h4 class="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">{{ 'recruitment.jobDetail.statistics.avgTimeInPipeline' | translate }}</h4>
                  <span class="text-4xl font-bold text-primary-500">{{ avgDaysInPipeline() }}</span>
                  <span class="block text-sm text-neutral-500 dark:text-neutral-400 mt-1">{{ 'recruitment.jobDetail.statistics.days' | translate }}</span>
                </div>
                <div class="text-center p-6 bg-neutral-50 dark:bg-dark-elevated rounded-xl">
                  <h4 class="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">{{ 'recruitment.jobDetail.statistics.interviewRate' | translate }}</h4>
                  <span class="text-4xl font-bold text-primary-500">{{ interviewRate() }}%</span>
                  <span class="block text-sm text-neutral-500 dark:text-neutral-400 mt-1">{{ 'recruitment.jobDetail.statistics.applicationsToInterview' | translate }}</span>
                </div>
              </div>
            </div>
          </sw-tab-panel>
        </sw-tabs>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobPostingDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly recruitmentService = inject(RecruitmentService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(DialogService);
  private readonly translate = inject(TranslateService);

  job = signal<JobPosting | null>(null);
  applications = signal<Application[]>([]);
  externalPostings = signal<ExternalJobPosting[]>([]);
  loading = signal(true);
  applicationsLoading = signal(false);
  error = signal<string | null>(null);
  selectedStage = signal<RecruitmentStage | null>(null);

  // Tab state
  activeTab = 0;

  pipelineStages: RecruitmentStage[] = ['NEW', 'SCREENING', 'PHONE_SCREEN', 'ASSESSMENT', 'FIRST_INTERVIEW', 'SECOND_INTERVIEW', 'FINAL_INTERVIEW', 'REFERENCE_CHECK', 'BACKGROUND_CHECK', 'OFFER', 'ONBOARDING', 'COMPLETED'];
  applicationColumns = ['candidate', 'stage', 'rating', 'applied', 'actions'];

  // Computed tab labels with translation and dynamic count
  tabLabels = computed(() => [
    this.translate.instant('recruitment.jobDetail.tabs.overview'),
    this.translate.instant('recruitment.jobDetail.tabs.candidates', { count: this.applications().length }),
    this.translate.instant('recruitment.jobDetail.tabs.statistics')
  ]);

  filteredApplications = computed(() => {
    const stage = this.selectedStage();
    const apps = this.applications();
    if (!stage) return apps;
    return apps.filter(a => a.stage === stage);
  });

  conversionRate = computed(() => {
    const apps = this.applications();
    if (apps.length === 0) return 0;
    const hired = apps.filter(a => a.status === 'HIRED').length;
    return Math.round((hired / apps.length) * 100);
  });

  avgDaysInPipeline = computed(() => {
    const apps = this.applications();
    if (apps.length === 0) return 0;
    const totalDays = apps.reduce((sum, a) => sum + a.daysSinceApplication, 0);
    return Math.round(totalDays / apps.length);
  });

  interviewRate = computed(() => {
    const apps = this.applications();
    if (apps.length === 0) return 0;
    const interviewed = apps.filter(a =>
      a.stage === 'FIRST_INTERVIEW' || a.stage === 'SECOND_INTERVIEW' ||
      a.stage === 'FINAL_INTERVIEW' || a.stage === 'OFFER' ||
      a.stage === 'COMPLETED' || a.status === 'HIRED'
    ).length;
    return Math.round((interviewed / apps.length) * 100);
  });

  ngOnInit(): void {
    const jobId = this.route.snapshot.paramMap.get('id');
    if (jobId) {
      this.loadJob(jobId);
      this.loadApplications(jobId);
      this.loadExternalPostings(jobId);
    } else {
      this.error.set(this.translate.instant('recruitment.jobDetail.errors.jobIdNotFound'));
      this.loading.set(false);
    }
  }

  loadJob(jobId: string): void {
    this.loading.set(true);
    this.recruitmentService.getJob(jobId).subscribe({
      next: (job) => {
        this.job.set(job);
        this.loading.set(false);
        // Track view
        this.recruitmentService.incrementJobViews(jobId).subscribe();
      },
      error: (err) => {
        console.error('Failed to load job', err);
        this.error.set(this.translate.instant('recruitment.jobDetail.errors.failedToLoadJob'));
        this.loading.set(false);
      }
    });
  }

  loadApplications(jobId: string): void {
    this.applicationsLoading.set(true);
    this.recruitmentService.getApplicationsForJob(jobId).subscribe({
      next: (apps) => {
        this.applications.set(apps);
        this.applicationsLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load applications', err);
        this.applicationsLoading.set(false);
      }
    });
  }

  loadExternalPostings(jobId: string): void {
    this.recruitmentService.getExternalPostingsForJob(jobId).subscribe({
      next: (postings) => {
        this.externalPostings.set(postings);
      },
      error: (err) => {
        console.error('Failed to load external postings', err);
      }
    });
  }

  refreshExternalPostings(): void {
    if (this.job()) {
      this.loadExternalPostings(this.job()!.id);
    }
  }

  openPostToPortalsDialog(): void {
    if (!this.job()) return;

    const dialogRef = this.dialog.open(PostToPortalsDialogComponent, {
      width: '480px',
      maxWidth: '480px',
      data: { job: this.job() }
    });

    dialogRef.afterClosed().then(result => {
      if (result) {
        this.loadExternalPostings(this.job()!.id);
      }
    });
  }

  filterByStage(stage: RecruitmentStage): void {
    if (this.selectedStage() === stage) {
      this.selectedStage.set(null);
    } else {
      this.selectedStage.set(stage);
    }
  }

  getStageCount(stage: RecruitmentStage): number {
    return this.applications().filter(a => a.stage === stage).length;
  }

  publishJob(): void {
    if (!this.job()) return;
    const closingDate = new Date();
    closingDate.setMonth(closingDate.getMonth() + 1);
    const dateStr = closingDate.toISOString().split('T')[0];

    this.recruitmentService.publishJob(this.job()!.id, dateStr).subscribe({
      next: (job) => {
        this.job.set(job);
        this.toast.success(this.translate.instant('recruitment.jobDetail.toast.jobPublished'));
      },
      error: () => this.toast.error(this.translate.instant('recruitment.jobDetail.toast.failedToPublish'))
    });
  }

  putOnHold(): void {
    if (!this.job()) return;
    this.recruitmentService.putJobOnHold(this.job()!.id).subscribe({
      next: (job) => {
        this.job.set(job);
        this.toast.success(this.translate.instant('recruitment.jobDetail.toast.jobOnHold'));
      },
      error: () => this.toast.error(this.translate.instant('recruitment.jobDetail.toast.failedToPutOnHold'))
    });
  }

  reopenJob(): void {
    if (!this.job()) return;
    this.recruitmentService.reopenJob(this.job()!.id).subscribe({
      next: (job) => {
        this.job.set(job);
        this.toast.success(this.translate.instant('recruitment.jobDetail.toast.jobReopened'));
      },
      error: () => this.toast.error(this.translate.instant('recruitment.jobDetail.toast.failedToReopen'))
    });
  }

  closeJob(): void {
    if (!this.job()) return;
    this.recruitmentService.closeJob(this.job()!.id).subscribe({
      next: (job) => {
        this.job.set(job);
        this.toast.success(this.translate.instant('recruitment.jobDetail.toast.jobClosed'));
      },
      error: () => this.toast.error(this.translate.instant('recruitment.jobDetail.toast.failedToClose'))
    });
  }

  markAsFilled(): void {
    if (!this.job()) return;
    this.recruitmentService.markJobAsFilled(this.job()!.id).subscribe({
      next: (job) => {
        this.job.set(job);
        this.toast.success(this.translate.instant('recruitment.jobDetail.toast.jobMarkedAsFilled'));
      },
      error: () => this.toast.error(this.translate.instant('recruitment.jobDetail.toast.failedToMarkAsFilled'))
    });
  }

  changeStage(app: Application): void {
    const dialogRef = this.dialog.open(StageChangeDialogComponent, {
      width: '400px',
      data: { application: app }
    });

    dialogRef.afterClosed().then(result => {
      if (result) {
        this.loadApplications(this.job()!.id);
      }
    });
  }

  scheduleInterview(app: Application): void {
    const dialogRef = this.dialog.open(ScheduleInterviewDialogComponent, {
      width: '500px',
      data: { application: app }
    });

    dialogRef.afterClosed().then(result => {
      if (result) {
        this.loadApplications(this.job()!.id);
        this.toast.success(this.translate.instant('recruitment.jobDetail.toast.interviewScheduled'));
      }
    });
  }

  makeOffer(app: Application): void {
    const dialogRef = this.dialog.open(MakeOfferDialogComponent, {
      width: '500px',
      data: { application: app }
    });

    dialogRef.afterClosed().then(result => {
      if (result) {
        this.loadApplications(this.job()!.id);
        this.toast.success(this.translate.instant('recruitment.jobDetail.toast.offerSent'));
      }
    });
  }

  markAsHired(app: Application): void {
    const dialogRef = this.dialog.open(HireCandidateDialogComponent, {
      width: '500px',
      data: { application: app }
    });

    dialogRef.afterClosed().then(result => {
      if (result) {
        this.loadApplications(this.job()!.id);
        this.toast.success(this.translate.instant('recruitment.jobDetail.toast.candidateHired'));
      }
    });
  }

  toggleStarred(app: Application): void {
    this.recruitmentService.toggleStarred(app.id).subscribe({
      next: () => {
        this.loadApplications(this.job()!.id);
      },
      error: () => this.toast.error(this.translate.instant('recruitment.jobDetail.toast.failedToUpdate'))
    });
  }

  rejectApplication(app: Application): void {
    const reason = prompt(this.translate.instant('recruitment.jobDetail.prompts.rejectionReason'));
    if (reason) {
      this.recruitmentService.rejectApplication(app.id, reason, 'current-user').subscribe({
        next: () => {
          this.loadApplications(this.job()!.id);
          this.toast.success(this.translate.instant('recruitment.jobDetail.toast.applicationRejected'));
        },
        error: () => this.toast.error(this.translate.instant('recruitment.jobDetail.toast.failedToReject'))
      });
    }
  }

  getJobStatusLabel(status: string): string {
    return RecruitmentService.getJobStatusLabel(status as any);
  }

  getJobStatusLabelTranslated(status: string): string {
    const statusKey = status.toLowerCase().replace(/_/g, '');
    return this.translate.instant(`recruitment.jobDetail.status.${statusKey}`);
  }

  getJobStatusColor(status: string): { background: string; color: string } {
    return RecruitmentService.getJobStatusColor(status as any);
  }

  getEmploymentTypeLabel(type: string): string {
    return RecruitmentService.getEmploymentTypeLabel(type as any);
  }

  getEmploymentTypeLabelTranslated(type: string): string {
    const typeKey = type.toLowerCase().replace(/_/g, '');
    return this.translate.instant(`recruitment.jobDetail.employmentType.${typeKey}`);
  }

  getStageLabel(stage: RecruitmentStage): string {
    return RecruitmentService.getRecruitmentStageLabel(stage);
  }

  getStageLabelTranslated(stage: RecruitmentStage): string {
    const stageKey = stage.toLowerCase().replace(/_/g, '');
    return this.translate.instant(`recruitment.jobDetail.stages.${stageKey}`);
  }

  getStageColor(stage: RecruitmentStage): { background: string; color: string } {
    return RecruitmentService.getStageColor(stage);
  }

  // External posting helper methods
  getPortalLabel(portal: JobPortal): string {
    return RecruitmentService.getJobPortalLabel(portal);
  }

  getPortalIcon(portal: JobPortal): string {
    const icons: Record<JobPortal, string> = {
      LINKEDIN: 'work',
      PNET: 'public',
      CAREERS24: 'language',
      INDEED: 'search'
    };
    return icons[portal] || 'public';
  }

  getPortalIconClass(portal: JobPortal): string {
    const classes: Record<JobPortal, string> = {
      LINKEDIN: 'text-blue-600',
      PNET: 'text-orange-500',
      CAREERS24: 'text-green-600',
      INDEED: 'text-purple-600'
    };
    return classes[portal] || 'text-neutral-500';
  }

  getExternalPostingStatusLabel(status: ExternalPostingStatus): string {
    return RecruitmentService.getExternalPostingStatusLabel(status);
  }

  getExternalPostingStatusColor(status: ExternalPostingStatus): { background: string; color: string } {
    return RecruitmentService.getExternalPostingStatusColor(status);
  }

  getCompensationTypeLabel(type: CompensationType): string {
    return RecruitmentService.getCompensationTypeLabel(type);
  }
}
