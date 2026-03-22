import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { SupportService, SupportTicket, TicketComment, TicketStatus, TicketPriority } from '@core/services/support.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  template: `
    <div class="space-y-6">
      <div class="sw-page-header">
        <div class="flex items-center gap-4">
          <a routerLink="/support" class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated transition-colors">
            <span class="material-icons">arrow_back</span>
          </a>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="sw-page-title">{{ ticket()?.ticketReference }}</h1>
              @if (ticket()) {
                <span [class]="statusBadgeClasses(ticket()!.status)">{{ formatStatus(ticket()!.status) }}</span>
              }
            </div>
            <p class="sw-page-description">{{ ticket()?.subject }}</p>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 animate-spin mb-4">refresh</span>
          <p class="text-neutral-500">{{ 'support.ticketDetail.loadingTicket' | translate }}</p>
        </div>
      } @else if (error()) {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <span class="material-icons text-5xl text-error-300 dark:text-error-600 mb-4 block">error_outline</span>
          <h2 class="text-lg font-semibold text-neutral-600 dark:text-neutral-400 mb-2">{{ 'support.ticketDetail.errorLoadingTicket' | translate }}</h2>
          <p class="text-neutral-500 dark:text-neutral-500 mb-6">{{ error() }}</p>
          <a routerLink="/support" class="sw-btn sw-btn-primary sw-btn-md inline-flex">
            <span class="material-icons text-base">arrow_back</span>
            <span>{{ 'support.ticketDetail.backToTickets' | translate }}</span>
          </a>
        </div>
      } @else if (!ticket()) {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4 block">error_outline</span>
          <h2 class="text-lg font-semibold text-neutral-600 dark:text-neutral-400 mb-2">{{ 'support.ticketDetail.ticketNotFound' | translate }}</h2>
          <p class="text-neutral-500 dark:text-neutral-500 mb-6">{{ 'support.ticketDetail.ticketNotFoundMessage' | translate }}</p>
          <a routerLink="/support" class="sw-btn sw-btn-primary sw-btn-md inline-flex">
            <span class="material-icons text-base">arrow_back</span>
            <span>{{ 'support.ticketDetail.backToTickets' | translate }}</span>
          </a>
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Main Content -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Description -->
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{{ 'support.ticketDetail.description' | translate }}</h2>
              <p class="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{{ ticket()!.description }}</p>
            </div>

            <!-- Comments -->
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border">
              <div class="p-4 border-b border-neutral-200 dark:border-dark-border">
                <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{{ 'support.ticketDetail.comments' | translate }}</h2>
              </div>

              @if (ticket()!.comments.length === 0) {
                <div class="p-8 text-center">
                  <span class="material-icons text-3xl text-neutral-300 dark:text-neutral-600 mb-2">chat_bubble_outline</span>
                  <p class="text-neutral-500">{{ 'support.ticketDetail.noCommentsYet' | translate }}</p>
                </div>
              } @else {
                <div class="divide-y divide-neutral-200 dark:divide-dark-border">
                  @for (comment of ticket()!.comments; track comment.id) {
                    <div class="p-4">
                      <div class="flex items-start gap-3">
                        <div
                          [class]="comment.authorRole === 'agent' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'"
                          class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
                        >
                          {{ comment.authorName.charAt(0).toUpperCase() }}
                        </div>
                        <div class="flex-1">
                          <div class="flex items-center gap-2 mb-1">
                            <span class="font-medium text-neutral-900 dark:text-neutral-100">{{ comment.authorName }}</span>
                            @if (comment.authorRole === 'agent') {
                              <span class="px-1.5 py-0.5 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded">{{ 'support.ticketDetail.support' | translate }}</span>
                            }
                            <span class="text-xs text-neutral-400">{{ formatDate(comment.createdAt) }}</span>
                          </div>
                          <p class="text-neutral-700 dark:text-neutral-300">{{ comment.content }}</p>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }

              <!-- Add Comment -->
              @if (ticket()!.status !== 'CLOSED') {
                <div class="p-4 border-t border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-elevated rounded-b-xl">
                  <textarea
                    [(ngModel)]="newComment"
                    class="sw-input min-h-[80px] mb-3 resize-y"
                    [placeholder]="'support.ticketDetail.addComment' | translate"
                    [attr.aria-label]="'support.ticketDetail.addComment' | translate"
                    [attr.aria-disabled]="submittingComment()"
                  ></textarea>
                  <div class="flex justify-end">
                    <button
                      type="button"
                      class="sw-btn sw-btn-primary sw-btn-md"
                      [disabled]="!newComment.trim() || submittingComment()"
                      (click)="addComment()"
                      [attr.aria-label]="'support.ticketDetail.sendComment' | translate"
                    >
                      @if (submittingComment()) {
                        <span class="material-icons animate-spin text-base">refresh</span>
                        <span>{{ 'support.ticketDetail.sending' | translate }}</span>
                      } @else {
                        <span class="material-icons text-base">send</span>
                        <span>{{ 'support.ticketDetail.send' | translate }}</span>
                      }
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Ticket Details -->
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{{ 'support.ticketDetail.details' | translate }}</h2>
              <dl class="space-y-4">
                <div>
                  <dt class="text-sm text-neutral-500">{{ 'support.ticketDetail.category' | translate }}</dt>
                  <dd class="font-medium text-neutral-900 dark:text-neutral-100">{{ ticket()!.category.name }}</dd>
                </div>
                @if (ticket()!.subcategory) {
                  <div>
                    <dt class="text-sm text-neutral-500">{{ 'support.ticketDetail.subcategory' | translate }}</dt>
                    <dd class="font-medium text-neutral-900 dark:text-neutral-100">{{ ticket()!.subcategory }}</dd>
                  </div>
                }
                <div>
                  <dt class="text-sm text-neutral-500">{{ 'support.ticketDetail.priority' | translate }}</dt>
                  <dd><span [class]="priorityBadgeClasses(ticket()!.priority)">{{ ticket()!.priority }}</span></dd>
                </div>
                <div>
                  <dt class="text-sm text-neutral-500">{{ 'support.ticketDetail.assignedTo' | translate }}</dt>
                  <dd class="font-medium text-neutral-900 dark:text-neutral-100">{{ ticket()!.assignedUserName || ticket()!.assignedTeam }}</dd>
                </div>
                <div>
                  <dt class="text-sm text-neutral-500">{{ 'support.ticketDetail.created' | translate }}</dt>
                  <dd class="font-medium text-neutral-900 dark:text-neutral-100">{{ formatDate(ticket()!.createdAt) }}</dd>
                </div>
                <div>
                  <dt class="text-sm text-neutral-500">{{ 'support.ticketDetail.lastUpdated' | translate }}</dt>
                  <dd class="font-medium text-neutral-900 dark:text-neutral-100">{{ formatDate(ticket()!.updatedAt) }}</dd>
                </div>
                @if (ticket()!.resolvedAt) {
                  <div>
                    <dt class="text-sm text-neutral-500">{{ 'support.ticketDetail.resolved' | translate }}</dt>
                    <dd class="font-medium text-neutral-900 dark:text-neutral-100">{{ formatDate(ticket()!.resolvedAt!) }}</dd>
                  </div>
                }
              </dl>
            </div>

            <!-- Actions -->
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{{ 'support.ticketDetail.actions' | translate }}</h2>
              <div class="space-y-3">
                @if (ticket()!.status === 'RESOLVED') {
                  <button
                    type="button"
                    class="sw-btn sw-btn-secondary sw-btn-md w-full"
                    [disabled]="performingAction()"
                    (click)="reopenTicket()"
                    [attr.aria-label]="'support.ticketDetail.reopenThisTicket' | translate"
                  >
                    @if (performingAction()) {
                      <span class="material-icons animate-spin text-base">refresh</span>
                      <span>{{ 'support.ticketDetail.reopening' | translate }}</span>
                    } @else {
                      <span class="material-icons text-base">replay</span>
                      <span>{{ 'support.ticketDetail.reopenTicket' | translate }}</span>
                    }
                  </button>
                }
                @if (!['RESOLVED', 'CLOSED'].includes(ticket()!.status)) {
                  <!-- Close Ticket Confirmation -->
                  @if (showCloseConfirmation()) {
                    <div class="p-4 bg-error-50 dark:bg-error-900/20 rounded-lg border border-error-200 dark:border-error-800">
                      <p class="text-sm text-error-700 dark:text-error-300 mb-3">{{ 'support.ticketDetail.closeTicketConfirmation' | translate }}</p>
                      <div class="flex gap-2">
                        <button
                          type="button"
                          class="sw-btn sw-btn-danger sw-btn-sm flex-1"
                          [disabled]="performingAction()"
                          (click)="confirmCloseTicket()"
                          [attr.aria-label]="'support.ticketDetail.confirmCloseTicket' | translate"
                        >
                          @if (performingAction()) {
                            <span class="material-icons animate-spin text-sm">refresh</span>
                            <span>{{ 'support.ticketDetail.closing' | translate }}</span>
                          } @else {
                            <span class="material-icons text-sm">check</span>
                            <span>{{ 'support.ticketDetail.yesClose' | translate }}</span>
                          }
                        </button>
                        <button
                          type="button"
                          class="sw-btn sw-btn-secondary sw-btn-sm flex-1"
                          [disabled]="performingAction()"
                          (click)="cancelCloseTicket()"
                          [attr.aria-label]="'support.ticketDetail.cancelCloseTicket' | translate"
                        >
                          <span class="material-icons text-sm">close</span>
                          <span>{{ 'support.ticketDetail.cancel' | translate }}</span>
                        </button>
                      </div>
                    </div>
                  } @else {
                    <button
                      type="button"
                      class="sw-btn sw-btn-outline sw-btn-md w-full group hover:border-error-300 hover:bg-error-50 dark:hover:border-error-700 dark:hover:bg-error-900/20"
                      [disabled]="performingAction()"
                      (click)="closeTicket()"
                      [attr.aria-label]="'support.ticketDetail.closeThisTicket' | translate"
                    >
                      <span class="material-icons text-base text-error-500 group-hover:text-error-600 dark:text-error-400 dark:group-hover:text-error-300">close</span>
                      <span class="text-error-600 group-hover:text-error-700 dark:text-error-400 dark:group-hover:text-error-300">{{ 'support.ticketDetail.closeTicket' | translate }}</span>
                    </button>
                  }
                }
              </div>
            </div>

            <!-- Resolution Notes -->
            @if (ticket()!.resolutionNotes) {
              <div class="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-6">
                <h2 class="text-lg font-semibold text-green-700 dark:text-green-300 mb-2">{{ 'support.ticketDetail.resolution' | translate }}</h2>
                <p class="text-green-600 dark:text-green-400">{{ ticket()!.resolutionNotes }}</p>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly supportService = inject(SupportService);

  loading = signal(true);
  error = signal<string | null>(null);
  ticket = signal<SupportTicket | null>(null);
  newComment = '';
  submittingComment = signal(false);
  performingAction = signal(false);
  showCloseConfirmation = signal(false);

  ngOnInit(): void {
    const ticketId = this.route.snapshot.paramMap.get('id');
    if (ticketId) {
      this.loadTicket(ticketId);
    } else {
      this.error.set('Invalid ticket ID');
      this.loading.set(false);
    }
  }

  loadTicket(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    // Try admin endpoint first (for admins viewing any ticket), then fall back to user endpoint
    // This is more efficient for admin users who typically view tickets from all users
    this.supportService.getTicketAdmin(id).pipe(
      catchError((adminErr) => {
        console.log('Admin endpoint failed with status:', adminErr.status, '- trying user endpoint');
        // If admin endpoint fails (403 means not admin), try user endpoint
        return this.supportService.getTicket(id).pipe(
          catchError((userErr) => {
            console.error('Both endpoints failed. Admin error:', adminErr.status, 'User error:', userErr.status);
            return of(null);
          })
        );
      })
    ).subscribe({
      next: (ticket) => {
        if (ticket) {
          this.ticket.set(ticket);
        } else {
          this.error.set('Ticket not found');
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Unexpected error loading ticket:', err);
        this.error.set('Failed to load ticket');
        this.loading.set(false);
      }
    });
  }

  addComment(): void {
    const content = this.newComment.trim();
    if (!content || !this.ticket()) return;

    this.submittingComment.set(true);

    this.supportService.addComment(this.ticket()!.id, { content }).subscribe({
      next: (comment) => {
        // Add the new comment to the ticket
        const currentTicket = this.ticket()!;
        this.ticket.set({
          ...currentTicket,
          comments: [...currentTicket.comments, comment]
        });
        this.newComment = '';
        this.submittingComment.set(false);
      },
      error: (err) => {
        console.error('Error adding comment:', err);
        this.submittingComment.set(false);
      }
    });
  }

  closeTicket(): void {
    if (!this.ticket()) return;
    this.showCloseConfirmation.set(true);
  }

  cancelCloseTicket(): void {
    this.showCloseConfirmation.set(false);
  }

  confirmCloseTicket(): void {
    if (!this.ticket()) return;

    this.performingAction.set(true);

    this.supportService.closeTicket(this.ticket()!.id).subscribe({
      next: (ticket) => {
        this.ticket.set(ticket);
        this.performingAction.set(false);
        this.showCloseConfirmation.set(false);
      },
      error: (err) => {
        console.error('Error closing ticket:', err);
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
