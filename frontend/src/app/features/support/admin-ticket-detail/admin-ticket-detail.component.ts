import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  SupportService,
  SupportTicket,
  TicketStatus,
  TicketPriority
} from '@core/services/support.service';

@Component({
  selector: 'app-admin-ticket-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="sw-page-header">
        <div class="flex items-center gap-4">
          <a routerLink="/support/admin" class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated transition-colors">
            <span class="material-icons">arrow_back</span>
          </a>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="sw-page-title">{{ ticket()?.ticketReference }}</h1>
              <ng-container *ngIf="ticket() as t">
                <span [class]="statusBadgeClasses(t.status)">{{ formatStatus(t.status) }}</span>
                <span [class]="priorityBadgeClasses(t.priority)">{{ t.priority }}</span>
              </ng-container>
            </div>
            <p class="sw-page-description">{{ ticket()?.subject }}</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
        <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 animate-spin mb-4">refresh</span>
        <p class="text-neutral-500">{{ 'support.adminTicketDetail.loadingTicket' | translate }}</p>
      </div>

      <!-- Error State -->
      <div *ngIf="!loading() && error()" class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
        <span class="material-icons text-5xl text-error-300 dark:text-error-600 mb-4 block">error_outline</span>
        <h2 class="text-lg font-semibold text-neutral-600 dark:text-neutral-400 mb-2">{{ 'support.adminTicketDetail.errorLoadingTicket' | translate }}</h2>
        <p class="text-neutral-500 dark:text-neutral-500 mb-6">{{ error() }}</p>
        <a routerLink="/support/admin" class="sw-btn sw-btn-primary sw-btn-md inline-flex">
          <span class="material-icons text-base">arrow_back</span>
          <span>{{ 'support.adminTicketDetail.backToDashboard' | translate }}</span>
        </a>
      </div>

      <!-- Ticket Content -->
      <ng-container *ngIf="!loading() && !error() && ticket() as t">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Main Content -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Description -->
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{{ 'support.adminTicketDetail.description' | translate }}</h2>
              <p class="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{{ t.description }}</p>
            </div>

            <!-- Comments Timeline -->
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border">
              <div class="p-4 border-b border-neutral-200 dark:border-dark-border">
                <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{{ 'support.adminTicketDetail.commentsAndActivity' | translate }}</h2>
              </div>

              <!-- No Comments -->
              <div *ngIf="t.comments.length === 0" class="p-8 text-center">
                <span class="material-icons text-3xl text-neutral-300 dark:text-neutral-600 mb-2">chat_bubble_outline</span>
                <p class="text-neutral-500">{{ 'support.adminTicketDetail.noCommentsYet' | translate }}</p>
              </div>

              <!-- Comments List -->
              <div *ngIf="t.comments.length > 0" class="divide-y divide-neutral-200 dark:divide-dark-border">
                <div *ngFor="let comment of t.comments"
                     class="p-4"
                     [ngClass]="{'bg-yellow-50 dark:bg-yellow-900/10': comment.internal}">
                  <div class="flex items-start gap-3">
                    <div [class]="comment.authorRole === 'agent' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'"
                         class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {{ comment.authorName.charAt(0).toUpperCase() }}
                    </div>
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-1 flex-wrap">
                        <span class="font-medium text-neutral-900 dark:text-neutral-100">{{ comment.authorName }}</span>
                        <span *ngIf="comment.authorRole === 'agent'" class="px-1.5 py-0.5 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded">{{ 'support.adminTicketDetail.support' | translate }}</span>
                        <span *ngIf="comment.internal" class="px-1.5 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded">{{ 'support.adminTicketDetail.internalNote' | translate }}</span>
                        <span class="text-xs text-neutral-400">{{ formatDate(comment.createdAt) }}</span>
                      </div>
                      <p class="text-neutral-700 dark:text-neutral-300">{{ comment.content }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Add Comment (Admin) -->
              <div *ngIf="t.status !== 'CLOSED'" class="p-4 border-t border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-elevated rounded-b-xl">
                <textarea
                  [(ngModel)]="newComment"
                  class="sw-input min-h-[80px] mb-3 resize-y"
                  [placeholder]="'support.adminTicketDetail.addComment' | translate"
                  [attr.aria-label]="'support.adminTicketDetail.addComment' | translate"
                ></textarea>
                <div class="flex items-center justify-between">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      [(ngModel)]="isInternalNote"
                      class="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span class="text-sm text-neutral-600 dark:text-neutral-400">{{ 'support.adminTicketDetail.internalNoteDescription' | translate }}</span>
                  </label>
                  <button
                    type="button"
                    class="sw-btn sw-btn-primary sw-btn-md"
                    [disabled]="!newComment.trim() || submittingComment()"
                    (click)="addComment()">
                    <span *ngIf="submittingComment()" class="material-icons animate-spin text-base">refresh</span>
                    <span *ngIf="submittingComment()">{{ 'support.adminTicketDetail.sending' | translate }}</span>
                    <span *ngIf="!submittingComment()" class="material-icons text-base">send</span>
                    <span *ngIf="!submittingComment()">{{ 'support.adminTicketDetail.send' | translate }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Ticket Details -->
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{{ 'support.adminTicketDetail.details' | translate }}</h2>
              <dl class="space-y-4">
                <div>
                  <dt class="text-sm text-neutral-500">{{ 'support.adminTicketDetail.requester' | translate }}</dt>
                  <dd class="font-medium text-neutral-900 dark:text-neutral-100">{{ t.requesterName }}</dd>
                  <dd *ngIf="t.requesterEmail" class="text-sm text-neutral-500">{{ t.requesterEmail }}</dd>
                </div>
                <div>
                  <dt class="text-sm text-neutral-500">{{ 'support.adminTicketDetail.category' | translate }}</dt>
                  <dd class="font-medium text-neutral-900 dark:text-neutral-100">{{ t.category.name }}</dd>
                </div>
                <div *ngIf="t.subcategory">
                  <dt class="text-sm text-neutral-500">{{ 'support.adminTicketDetail.subcategory' | translate }}</dt>
                  <dd class="font-medium text-neutral-900 dark:text-neutral-100">{{ t.subcategory }}</dd>
                </div>
                <div>
                  <dt class="text-sm text-neutral-500">{{ 'support.adminTicketDetail.assignedTeam' | translate }}</dt>
                  <dd class="font-medium text-neutral-900 dark:text-neutral-100">{{ t.assignedTeam }}</dd>
                </div>
                <div>
                  <dt class="text-sm text-neutral-500">{{ 'support.adminTicketDetail.assignedTo' | translate }}</dt>
                  <dd class="font-medium text-neutral-900 dark:text-neutral-100">{{ t.assignedUserName || ('support.adminTicketDetail.unassigned' | translate) }}</dd>
                </div>
                <div>
                  <dt class="text-sm text-neutral-500">{{ 'support.adminTicketDetail.created' | translate }}</dt>
                  <dd class="font-medium text-neutral-900 dark:text-neutral-100">{{ formatDate(t.createdAt) }}</dd>
                </div>
                <div>
                  <dt class="text-sm text-neutral-500">{{ 'support.adminTicketDetail.lastUpdated' | translate }}</dt>
                  <dd class="font-medium text-neutral-900 dark:text-neutral-100">{{ formatDate(t.updatedAt) }}</dd>
                </div>
                <div *ngIf="t.slaDeadline">
                  <dt class="text-sm text-neutral-500">{{ 'support.adminTicketDetail.slaDeadline' | translate }}</dt>
                  <dd class="font-medium" [class.text-red-600]="isSlaBreached()" [class.dark:text-red-400]="isSlaBreached()" [class.text-neutral-900]="!isSlaBreached()" [class.dark:text-neutral-100]="!isSlaBreached()">
                    {{ formatDate(t.slaDeadline) }}
                    <span *ngIf="isSlaBreached()" class="text-xs ml-1">({{ 'support.adminTicketDetail.overdue' | translate }})</span>
                  </dd>
                </div>
                <div *ngIf="t.resolvedAt">
                  <dt class="text-sm text-neutral-500">{{ 'support.adminTicketDetail.resolved' | translate }}</dt>
                  <dd class="font-medium text-neutral-900 dark:text-neutral-100">{{ formatDate(t.resolvedAt) }}</dd>
                </div>
              </dl>
            </div>

            <!-- Admin Actions -->
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{{ 'support.adminTicketDetail.adminActions' | translate }}</h2>
              <div class="space-y-3">
                <!-- Assign Ticket Button -->
                <button
                  *ngIf="!showAssignDialog() && t.status !== 'CLOSED'"
                  type="button"
                  class="sw-btn sw-btn-secondary sw-btn-md w-full"
                  [disabled]="performingAction()"
                  (click)="openAssignDialog()">
                  <span class="material-icons text-base">person_add</span>
                  <span>{{ 'support.adminTicketDetail.assignTicket' | translate }}</span>
                </button>

                <!-- Assign Dialog -->
                <div *ngIf="showAssignDialog()" class="p-4 bg-neutral-50 dark:bg-dark-elevated rounded-lg border border-neutral-200 dark:border-dark-border">
                  <h3 class="font-medium text-neutral-900 dark:text-neutral-100 mb-3">{{ 'support.adminTicketDetail.assignTicket' | translate }}</h3>
                  <div class="space-y-3">
                    <div>
                      <label class="block text-sm text-neutral-500 mb-1">{{ 'support.adminTicketDetail.assignToUser' | translate }}</label>
                      <input
                        type="text"
                        [(ngModel)]="assignUserName"
                        class="sw-input"
                        [placeholder]="'support.adminTicketDetail.enterUserName' | translate"
                      />
                    </div>
                    <div>
                      <label class="block text-sm text-neutral-500 mb-1">{{ 'support.adminTicketDetail.team' | translate }}</label>
                      <select [(ngModel)]="assignTeam" class="sw-select">
                        <option value="">{{ 'support.adminTicketDetail.keepCurrentTeam' | translate }}</option>
                        <option value="HR Team">{{ 'support.adminTicketDetail.hrTeam' | translate }}</option>
                        <option value="Payroll Team">{{ 'support.adminTicketDetail.payrollTeam' | translate }}</option>
                        <option value="Leave Admin">{{ 'support.adminTicketDetail.leaveAdmin' | translate }}</option>
                        <option value="IT Team">{{ 'support.adminTicketDetail.itTeam' | translate }}</option>
                        <option value="Facilities Team">{{ 'support.adminTicketDetail.facilitiesTeam' | translate }}</option>
                        <option value="Finance Team">{{ 'support.adminTicketDetail.financeTeam' | translate }}</option>
                        <option value="General Admin">{{ 'support.adminTicketDetail.generalAdmin' | translate }}</option>
                      </select>
                    </div>
                    <div class="flex gap-2">
                      <button
                        type="button"
                        class="sw-btn sw-btn-primary sw-btn-sm flex-1"
                        [disabled]="performingAction()"
                        (click)="assignTicket()">
                        <span *ngIf="performingAction()" class="material-icons animate-spin text-sm">refresh</span>
                        <span *ngIf="!performingAction()">{{ 'support.adminTicketDetail.assign' | translate }}</span>
                      </button>
                      <button
                        type="button"
                        class="sw-btn sw-btn-outline sw-btn-sm flex-1"
                        [disabled]="performingAction()"
                        (click)="closeAssignDialog()">
                        {{ 'support.adminTicketDetail.cancel' | translate }}
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Resolve Ticket Button -->
                <button
                  *ngIf="!showResolveDialog() && t.status !== 'RESOLVED' && t.status !== 'CLOSED'"
                  type="button"
                  class="sw-btn sw-btn-md w-full bg-green-600 hover:bg-green-700 text-white"
                  [disabled]="performingAction()"
                  (click)="openResolveDialog()">
                  <span class="material-icons text-base">check_circle</span>
                  <span>{{ 'support.adminTicketDetail.resolveTicket' | translate }}</span>
                </button>

                <!-- Resolve Dialog -->
                <div *ngIf="showResolveDialog()" class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h3 class="font-medium text-green-700 dark:text-green-300 mb-3">{{ 'support.adminTicketDetail.resolveTicket' | translate }}</h3>
                  <textarea
                    [(ngModel)]="resolutionNotes"
                    class="sw-input min-h-[80px] mb-3 resize-y"
                    [placeholder]="'support.adminTicketDetail.enterResolutionNotes' | translate"
                  ></textarea>
                  <div class="flex gap-2">
                    <button
                      type="button"
                      class="sw-btn sw-btn-sm flex-1 bg-green-600 hover:bg-green-700 text-white"
                      [disabled]="!resolutionNotes.trim() || performingAction()"
                      (click)="resolveTicket()">
                      <span *ngIf="performingAction()" class="material-icons animate-spin text-sm">refresh</span>
                      <span *ngIf="!performingAction()">{{ 'support.adminTicketDetail.resolve' | translate }}</span>
                    </button>
                    <button
                      type="button"
                      class="sw-btn sw-btn-outline sw-btn-sm flex-1"
                      [disabled]="performingAction()"
                      (click)="closeResolveDialog()">
                      {{ 'support.adminTicketDetail.cancel' | translate }}
                    </button>
                  </div>
                </div>

                <!-- Reopen Ticket (for resolved tickets) -->
                <button
                  *ngIf="t.status === 'RESOLVED'"
                  type="button"
                  class="sw-btn sw-btn-secondary sw-btn-md w-full"
                  [disabled]="performingAction()"
                  (click)="reopenTicket()">
                  <span *ngIf="performingAction()" class="material-icons animate-spin text-base">refresh</span>
                  <span *ngIf="performingAction()">{{ 'support.adminTicketDetail.reopening' | translate }}</span>
                  <span *ngIf="!performingAction()" class="material-icons text-base">replay</span>
                  <span *ngIf="!performingAction()">{{ 'support.adminTicketDetail.reopenTicket' | translate }}</span>
                </button>
              </div>
            </div>

            <!-- Resolution Notes -->
            <div *ngIf="t.resolutionNotes" class="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-6">
              <h2 class="text-lg font-semibold text-green-700 dark:text-green-300 mb-2">{{ 'support.adminTicketDetail.resolution' | translate }}</h2>
              <p class="text-green-600 dark:text-green-400">{{ t.resolutionNotes }}</p>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminTicketDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly supportService = inject(SupportService);
  private readonly translate = inject(TranslateService);

  // State signals
  loading = signal(true);
  error = signal<string | null>(null);
  ticket = signal<SupportTicket | null>(null);
  submittingComment = signal(false);
  performingAction = signal(false);

  // Comment state
  newComment = '';
  isInternalNote = false;

  // Dialog state
  showAssignDialog = signal(false);
  showResolveDialog = signal(false);

  // Assign form state
  assignUserName = '';
  assignTeam = '';

  // Resolve form state
  resolutionNotes = '';

  ngOnInit(): void {
    const ticketId = this.route.snapshot.paramMap.get('id');
    if (ticketId) {
      this.loadTicket(ticketId);
    } else {
      this.error.set(this.translate.instant('support.adminTicketDetail.invalidTicketId'));
      this.loading.set(false);
    }
  }

  loadTicket(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.supportService.getTicketAdmin(id).subscribe({
      next: (ticket) => {
        this.ticket.set(ticket);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading ticket:', err);
        if (err.status === 404) {
          this.error.set(this.translate.instant('support.adminTicketDetail.ticketNotFound'));
        } else if (err.status === 403) {
          this.error.set(this.translate.instant('support.adminTicketDetail.noPermissionToView'));
        } else {
          this.error.set(this.translate.instant('support.adminTicketDetail.failedToLoadTicket'));
        }
        this.loading.set(false);
      }
    });
  }

  addComment(): void {
    const content = this.newComment.trim();
    if (!content || !this.ticket()) return;

    this.submittingComment.set(true);

    this.supportService.addAgentComment(this.ticket()!.id, {
      content,
      internal: this.isInternalNote
    }).subscribe({
      next: (comment) => {
        const currentTicket = this.ticket()!;
        this.ticket.set({
          ...currentTicket,
          comments: [...currentTicket.comments, comment]
        });
        this.newComment = '';
        this.isInternalNote = false;
        this.submittingComment.set(false);
      },
      error: (err) => {
        console.error('Error adding comment:', err);
        this.submittingComment.set(false);
      }
    });
  }

  openAssignDialog(): void {
    this.assignUserName = this.ticket()?.assignedUserName || '';
    this.assignTeam = '';
    this.showAssignDialog.set(true);
  }

  closeAssignDialog(): void {
    this.showAssignDialog.set(false);
    this.assignUserName = '';
    this.assignTeam = '';
  }

  assignTicket(): void {
    if (!this.ticket()) return;

    this.performingAction.set(true);

    this.supportService.assignTicket(this.ticket()!.id, {
      assignToUserName: this.assignUserName.trim() || undefined,
      assignedTeam: this.assignTeam || undefined
    }).subscribe({
      next: (ticket) => {
        this.ticket.set(ticket);
        this.performingAction.set(false);
        this.closeAssignDialog();
      },
      error: (err) => {
        console.error('Error assigning ticket:', err);
        this.performingAction.set(false);
      }
    });
  }

  openResolveDialog(): void {
    this.resolutionNotes = '';
    this.showResolveDialog.set(true);
  }

  closeResolveDialog(): void {
    this.showResolveDialog.set(false);
    this.resolutionNotes = '';
  }

  resolveTicket(): void {
    if (!this.ticket() || !this.resolutionNotes.trim()) return;

    this.performingAction.set(true);

    this.supportService.resolveTicket(this.ticket()!.id, {
      resolutionNotes: this.resolutionNotes.trim()
    }).subscribe({
      next: (ticket) => {
        this.ticket.set(ticket);
        this.performingAction.set(false);
        this.closeResolveDialog();
      },
      error: (err) => {
        console.error('Error resolving ticket:', err);
        this.performingAction.set(false);
      }
    });
  }

  reopenTicket(): void {
    if (!this.ticket()) return;

    this.performingAction.set(true);

    this.supportService.reopenTicket(this.ticket()!.id).subscribe({
      next: (ticket) => {
        this.ticket.set(ticket);
        this.performingAction.set(false);
      },
      error: (err) => {
        console.error('Error reopening ticket:', err);
        this.performingAction.set(false);
      }
    });
  }

  isSlaBreached(): boolean {
    const deadline = this.ticket()?.slaDeadline;
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  }

  statusBadgeClasses(status: TicketStatus): string {
    const base = 'px-2 py-0.5 text-xs font-medium rounded';
    switch (status) {
      case 'NEW': return `${base} bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300`;
      case 'IN_PROGRESS': return `${base} bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300`;
      case 'PENDING': return `${base} bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300`;
      case 'RESOLVED': return `${base} bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300`;
      case 'CLOSED': return `${base} bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400`;
      default: return `${base} bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400`;
    }
  }

  priorityBadgeClasses(priority: TicketPriority): string {
    const base = 'px-2 py-0.5 text-xs font-medium rounded';
    switch (priority) {
      case 'URGENT': return `${base} bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300`;
      case 'HIGH': return `${base} bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300`;
      case 'MEDIUM': return `${base} bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300`;
      default: return `${base} bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400`;
    }
  }

  formatStatus(status: TicketStatus): string {
    return status.replace('_', ' ');
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
