import { Component, OnInit, inject, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TicketService } from '@core/services/ticket.service';
import { Ticket, TicketResponse, CannedResponse, TicketStatus, TicketPriority } from '@core/models/ticket.model';
import { BadgeComponent, BadgeColor } from '@core/components/ui/badge.component';
import { ButtonComponent } from '@core/components/ui/button.component';
import { CardComponent } from '@core/components/ui/card.component';
import { ModalComponent } from '@core/components/ui/modal.component';
import { InputComponent } from '@core/components/ui/input.component';
import { SelectComponent, SelectOption } from '@core/components/ui/select.component';
import { ErrorStateComponent } from '@core/components/ui/error-state.component';
import { RelativeTimePipe } from '@core/pipes/relative-time.pipe';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    BadgeComponent,
    ButtonComponent,
    CardComponent,
    ModalComponent,
    InputComponent,
    SelectComponent,
    ErrorStateComponent,
    RelativeTimePipe
  ],
  template: `
    <div class="ticket-detail-page">
      <!-- Breadcrumb -->
      <nav class="breadcrumb">
        <a routerLink="/support" class="breadcrumb-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Support Tickets
        </a>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-current">{{ ticket()?.subject }}</span>
      </nav>

      @if (ticket(); as t) {
        <div class="ticket-layout">
          <!-- Main Content -->
          <div class="ticket-main">
            <!-- Ticket Header Card -->
            <div class="ticket-header-card">
              <div class="ticket-header-top">
                <div class="ticket-title-block">
                  <h1 class="ticket-title">{{ t.subject }}</h1>
                  <p class="ticket-meta">
                    Created by <span class="meta-highlight">{{ t.createdByName }}</span> · {{ t.createdAt | relativeTime }}
                  </p>
                </div>
                <div class="ticket-badges">
                  <app-badge [color]="getStatusColor(t.status)" size="lg">{{ formatStatus(t.status) }}</app-badge>
                  <app-badge [color]="getPriorityColor(t.priority)" size="lg">{{ t.priority }}</app-badge>
                </div>
              </div>
              <div class="ticket-description">
                <p>{{ t.description }}</p>
              </div>
            </div>

            <!-- Conversation Card -->
            <div class="conversation-card">
              <div class="conversation-header">
                <h2 class="conversation-title">Conversation</h2>
                <span class="conversation-count">{{ t.responses?.length || 0 }} {{ (t.responses?.length || 0) === 1 ? 'message' : 'messages' }}</span>
              </div>

              <div class="conversation-thread">
                @for (response of t.responses; track response.id; let isLast = $last) {
                  <div class="message" [class.message-internal]="response.isInternal">
                    <div class="message-avatar">
                      <span>{{ response.createdByName.charAt(0) }}</span>
                    </div>
                    <div class="message-content">
                      <div class="message-header">
                        <div class="message-author">
                          <span class="author-name">{{ response.createdByName }}</span>
                          @if (response.isInternal) {
                            <span class="internal-badge">Internal</span>
                          }
                        </div>
                        <span class="message-time">{{ response.createdAt | relativeTime }}</span>
                      </div>
                      <div class="message-body">
                        <p>{{ response.content }}</p>
                      </div>
                    </div>
                  </div>
                  @if (!isLast) {
                    <div class="thread-line"></div>
                  }
                } @empty {
                  <div class="empty-conversation">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <p>No responses yet</p>
                  </div>
                }
              </div>

              <!-- Reply Form -->
              <div class="reply-section">
                <div class="reply-header">
                  <span class="reply-label">Reply</span>
                  <app-select
                    placeholder="Insert canned response"
                    [options]="cannedResponseOptions"
                    (ngModelChange)="insertCannedResponse($any($event))"
                  />
                </div>
                <div class="reply-input-wrapper">
                  <textarea
                    [(ngModel)]="replyContent"
                    rows="4"
                    class="reply-textarea"
                    placeholder="Type your response..."
                  ></textarea>
                </div>
                <div class="reply-footer">
                  <label class="internal-checkbox">
                    <input type="checkbox" [(ngModel)]="isInternalNote" />
                    <span class="checkbox-label">Internal note (not visible to customer)</span>
                  </label>
                  <app-button (onClick)="sendReply()" [loading]="sending()">
                    Send Reply
                  </app-button>
                </div>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <aside class="ticket-sidebar">
            <!-- Ticket Details Card -->
            <div class="sidebar-card">
              <h3 class="sidebar-card-title">Ticket Details</h3>
              <div class="details-list">
                <div class="detail-item">
                  <span class="detail-label">Tenant</span>
                  <a [routerLink]="['/tenants', t.tenantId]" class="detail-value detail-link">
                    {{ t.tenantName }}
                  </a>
                </div>

                <div class="detail-item">
                  <span class="detail-label">Status</span>
                  <app-select
                    [options]="statusOptions"
                    [(ngModel)]="selectedStatus"
                    (ngModelChange)="updateStatus($event)"
                  />
                </div>

                <div class="detail-item">
                  <span class="detail-label">Priority</span>
                  <app-select
                    [options]="priorityOptions"
                    [(ngModel)]="selectedPriority"
                    (ngModelChange)="updatePriority($event)"
                  />
                </div>

                <div class="detail-item">
                  <span class="detail-label">Assigned To</span>
                  <app-select
                    [options]="assigneeOptions"
                    [(ngModel)]="selectedAssignee"
                    (ngModelChange)="updateAssignee($event)"
                  />
                </div>

                @if (t.slaDueAt) {
                  <div class="detail-item">
                    <span class="detail-label">SLA Due</span>
                    <span class="detail-value" [class.sla-warning]="isSlaBreached()">
                      {{ t.slaDueAt | relativeTime }}
                    </span>
                  </div>
                }
              </div>
            </div>

            <!-- Actions Card -->
            <div class="sidebar-card">
              <h3 class="sidebar-card-title">Actions</h3>
              <div class="actions-list">
                <button class="action-btn" (click)="escalate()">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 19V5M5 12l7-7 7 7"/>
                  </svg>
                  Escalate Ticket
                </button>
                <button class="action-btn" (click)="merge()">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/>
                    <path d="M6 21V9a9 9 0 0 0 9 9"/>
                  </svg>
                  Merge with Another
                </button>
                @if (t.status !== 'CLOSED') {
                  <button class="action-btn action-btn-danger" (click)="closeTicket()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
                    </svg>
                    Close Ticket
                  </button>
                }
              </div>
            </div>
          </aside>
        </div>
      }
    </div>

    <!-- Merge Ticket Modal -->
    <app-modal
      [isOpen]="showMergeModal"
      title="Merge Ticket"
      (close)="closeMergeModal()"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Search for a ticket to merge this one into. All responses will be transferred to the target ticket.
        </p>
        <app-input
          label="Search Tickets"
          placeholder="Search by subject or ID..."
          [(ngModel)]="mergeSearchTerm"
          (ngModelChange)="searchTicketsForMerge($event)"
        />
        @if (mergeSearchResults().length > 0) {
          <div class="rounded-md border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
            @for (t of mergeSearchResults(); track t.id) {
              @if (t.id !== id) {
                <button
                  type="button"
                  (click)="selectMergeTarget(t)"
                  class="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                  [class.bg-gray-100]="selectedMergeTicket?.id === t.id"
                  [class.dark:bg-gray-700]="selectedMergeTicket?.id === t.id"
                >
                  <div class="font-medium">{{ t.subject }}</div>
                  <div class="text-xs text-gray-500">{{ t.tenantName }} - {{ t.status }}</div>
                </button>
              }
            }
          </div>
        }
        @if (selectedMergeTicket) {
          <div class="p-3 rounded-md bg-gray-50 dark:bg-gray-800 text-sm">
            <div class="font-medium text-gray-900 dark:text-white">Merge into:</div>
            <div class="text-gray-600 dark:text-gray-400">{{ selectedMergeTicket.subject }}</div>
          </div>
        }
      </div>
      <div modal-footer class="flex justify-end gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-700">
        <app-button variant="outline" (onClick)="closeMergeModal()">Cancel</app-button>
        <app-button
          [loading]="merging()"
          [disabled]="!selectedMergeTicket"
          (onClick)="confirmMerge()"
        >
          Merge Tickets
        </app-button>
      </div>
    </app-modal>
  `,
  styles: [`
    .ticket-detail-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Breadcrumb */
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .breadcrumb-link {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      color: var(--text-secondary);
      text-decoration: none;
      transition: color 0.15s;
    }

    .breadcrumb-link:hover {
      color: var(--text-primary);
    }

    .breadcrumb-separator {
      color: var(--text-muted);
    }

    .breadcrumb-current {
      color: var(--text-primary);
      font-weight: 500;
    }

    /* Layout */
    .ticket-layout {
      display: grid;
      gap: 1.5rem;
      grid-template-columns: 1fr;
    }

    @media (min-width: 1024px) {
      .ticket-layout {
        grid-template-columns: 1fr 320px;
        gap: 2rem;
      }
    }

    .ticket-main {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      min-width: 0;
    }

    /* Ticket Header Card */
    .ticket-header-card {
      background: var(--surface-primary);
      border: 1px solid var(--border-color);
      border-radius: 1rem;
      padding: 1.75rem 2rem;
    }

    .ticket-header-top {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    @media (min-width: 640px) {
      .ticket-header-top {
        flex-direction: row;
        justify-content: space-between;
        align-items: flex-start;
      }
    }

    .ticket-title-block {
      flex: 1;
      min-width: 0;
    }

    .ticket-title {
      font-size: 1.375rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
      line-height: 1.3;
    }

    .ticket-meta {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .meta-highlight {
      color: var(--text-primary);
      font-weight: 500;
    }

    .ticket-badges {
      display: flex;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .ticket-description {
      color: var(--text-secondary);
      font-size: 0.9375rem;
      line-height: 1.7;
    }

    .ticket-description p {
      margin: 0;
      white-space: pre-wrap;
    }

    /* Conversation Card */
    .conversation-card {
      background: var(--surface-primary);
      border: 1px solid var(--border-color);
      border-radius: 1rem;
      overflow: hidden;
    }

    .conversation-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 2rem;
      border-bottom: 1px solid var(--border-color);
    }

    .conversation-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .conversation-count {
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    .conversation-thread {
      padding: 1.5rem 2rem;
    }

    /* Message */
    .message {
      display: flex;
      gap: 1rem;
      position: relative;
    }

    .message-internal {
      background: rgba(251, 191, 36, 0.08);
      margin: -1rem -2rem;
      padding: 1rem 2rem;
      border-left: 3px solid rgb(251, 191, 36);
    }

    :host-context(.dark) .message-internal {
      background: rgba(251, 191, 36, 0.06);
    }

    .message-avatar {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 0.625rem;
      background: var(--surface-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .message-content {
      flex: 1;
      min-width: 0;
    }

    .message-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .message-author {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }

    .author-name {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.9375rem;
    }

    .internal-badge {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      padding: 0.1875rem 0.5rem;
      border-radius: 0.3125rem;
      background: rgb(251, 191, 36);
      color: rgb(120, 53, 15);
    }

    .message-time {
      font-size: 0.8125rem;
      color: var(--text-muted);
      flex-shrink: 0;
    }

    .message-body {
      color: var(--text-secondary);
      font-size: 0.9375rem;
      line-height: 1.65;
    }

    .message-body p {
      margin: 0;
      white-space: pre-wrap;
    }

    .thread-line {
      width: 2px;
      height: 1.5rem;
      background: var(--border-color);
      margin: 0.75rem 0 0.75rem calc(1.25rem - 1px);
    }

    .empty-conversation {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1rem;
      color: var(--text-muted);
      gap: 0.75rem;
    }

    .empty-conversation svg {
      opacity: 0.4;
    }

    .empty-conversation p {
      margin: 0;
      font-size: 0.9375rem;
    }

    /* Reply Section */
    .reply-section {
      border-top: 1px solid var(--border-color);
      padding: 1.5rem 2rem;
      background: var(--surface-secondary);
    }

    .reply-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .reply-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .reply-input-wrapper {
      margin-bottom: 1rem;
    }

    .reply-textarea {
      width: 100%;
      min-height: 120px;
      padding: 1rem 1.25rem;
      border: 1px solid var(--border-color);
      border-radius: 0.75rem;
      background: var(--surface-primary);
      color: var(--text-primary);
      font-size: 0.9375rem;
      line-height: 1.6;
      resize: vertical;
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    .reply-textarea::placeholder {
      color: var(--text-muted);
    }

    .reply-textarea:focus {
      outline: none;
      border-color: var(--accent-color);
      box-shadow: 0 0 0 3px var(--accent-glow);
    }

    .reply-footer {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    @media (min-width: 640px) {
      .reply-footer {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }

    .internal-checkbox {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      cursor: pointer;
    }

    .internal-checkbox input {
      width: 1rem;
      height: 1rem;
      border-radius: 0.25rem;
      accent-color: var(--accent-color);
    }

    .checkbox-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    /* Sidebar */
    .ticket-sidebar {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .sidebar-card {
      background: var(--surface-primary);
      border: 1px solid var(--border-color);
      border-radius: 1rem;
      padding: 1.5rem;
    }

    .sidebar-card-title {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 1.25rem 0;
    }

    /* Details List */
    .details-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .detail-label {
      font-size: 0.8125rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    .detail-value {
      font-size: 0.9375rem;
      color: var(--text-primary);
      font-weight: 500;
    }

    .detail-link {
      text-decoration: none;
      transition: color 0.15s;
    }

    .detail-link:hover {
      color: var(--accent-color);
    }

    .sla-warning {
      color: rgb(239, 68, 68);
      font-weight: 600;
    }

    :host-context(.dark) .sla-warning {
      color: rgb(248, 113, 113);
    }

    /* Actions */
    .actions-list {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: 0.625rem;
      background: var(--surface-primary);
      color: var(--text-secondary);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
    }

    .action-btn:hover {
      background: var(--surface-secondary);
      color: var(--text-primary);
      border-color: var(--text-muted);
    }

    .action-btn svg {
      flex-shrink: 0;
      opacity: 0.7;
    }

    .action-btn-danger {
      border-color: rgba(239, 68, 68, 0.3);
      color: rgb(239, 68, 68);
    }

    .action-btn-danger:hover {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgb(239, 68, 68);
      color: rgb(239, 68, 68);
    }

    :host-context(.dark) .action-btn-danger {
      border-color: rgba(248, 113, 113, 0.3);
      color: rgb(248, 113, 113);
    }

    :host-context(.dark) .action-btn-danger:hover {
      background: rgba(248, 113, 113, 0.1);
      border-color: rgb(248, 113, 113);
    }
  `]
})
export class TicketDetailComponent implements OnInit {
  private ticketService = inject(TicketService);
  private router = inject(Router);
  private mergeSearchSubject = new Subject<string>();

  @Input() id!: string;

  ticket = signal<Ticket | null>(null);
  cannedResponses = signal<CannedResponse[]>([]);
  hasError = signal(false);
  errorMessage = signal('');

  replyContent = '';
  isInternalNote = false;
  sending = signal(false);

  selectedStatus: TicketStatus = 'OPEN';
  selectedPriority: TicketPriority = 'MEDIUM';
  selectedAssignee = '';

  // Merge modal state
  showMergeModal = false;
  mergeSearchTerm = '';
  mergeSearchResults = signal<Ticket[]>([]);
  selectedMergeTicket: Ticket | null = null;
  merging = signal(false);

  statusOptions: SelectOption[] = [
    { label: 'Open', value: 'OPEN' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Waiting on Customer', value: 'WAITING_ON_CUSTOMER' },
    { label: 'Resolved', value: 'RESOLVED' },
    { label: 'Closed', value: 'CLOSED' }
  ];

  priorityOptions: SelectOption[] = [
    { label: 'Low', value: 'LOW' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'High', value: 'HIGH' },
    { label: 'Urgent', value: 'URGENT' }
  ];

  assigneeOptions: SelectOption[] = [
    { label: 'Unassigned', value: '' },
    { label: 'John Support', value: 'agent1' },
    { label: 'Jane Helper', value: 'agent2' }
  ];

  get cannedResponseOptions(): SelectOption[] {
    return [
      { label: 'Select...', value: '' },
      ...this.cannedResponses().map(r => ({ label: r.title, value: r.id }))
    ];
  }

  ngOnInit(): void {
    this.loadTicket();
    this.loadCannedResponses();

    this.mergeSearchSubject.pipe(debounceTime(300)).subscribe(term => {
      if (term.length >= 2) {
        this.ticketService.searchTickets(term, 10).subscribe({
          next: (tickets) => this.mergeSearchResults.set(tickets.filter(t => t.id !== this.id)),
          error: () => this.mergeSearchResults.set([])
        });
      } else {
        this.mergeSearchResults.set([]);
      }
    });
  }

  loadTicket(): void {
    this.hasError.set(false);
    this.ticketService.getTicketById(this.id).subscribe({
      next: (ticket) => {
        this.ticket.set(ticket);
        this.selectedStatus = ticket.status;
        this.selectedPriority = ticket.priority;
        this.selectedAssignee = ticket.assignedTo || '';
      },
      error: () => {
        this.hasError.set(true);
        this.errorMessage.set('Failed to load ticket details. Please try again.');
      }
    });
  }

  loadCannedResponses(): void {
    this.ticketService.getCannedResponses().subscribe({
      next: (responses) => this.cannedResponses.set(responses),
      error: () => this.cannedResponses.set([
        { id: '1', title: 'Greeting', content: 'Hello! Thank you for contacting SureWork support.', category: 'General', createdBy: 'admin', createdAt: '' },
        { id: '2', title: 'Payroll Help', content: 'For payroll issues, please ensure all employee data is up to date and try running the calculation again.', category: 'Payroll', createdBy: 'admin', createdAt: '' }
      ])
    });
  }

  sendReply(): void {
    if (!this.replyContent.trim()) return;

    this.sending.set(true);
    this.ticketService.addResponse(this.id, this.replyContent, this.isInternalNote).subscribe({
      next: (updatedTicket) => {
        this.ticket.set(updatedTicket);
        this.replyContent = '';
        this.isInternalNote = false;
        this.sending.set(false);
      },
      error: () => this.sending.set(false)
    });
  }

  insertCannedResponse(responseId: string): void {
    const response = this.cannedResponses().find(r => r.id === responseId);
    if (response) {
      this.replyContent = response.content;
    }
  }

  updateStatus(status: TicketStatus): void {
    this.ticketService.updateTicketStatus(this.id, status).subscribe({
      next: (updated) => this.ticket.set(updated)
    });
  }

  updatePriority(priority: TicketPriority): void {
    this.ticketService.updateTicketPriority(this.id, priority).subscribe({
      next: (updated) => this.ticket.set(updated)
    });
  }

  updateAssignee(assignee: string): void {
    this.ticketService.assignTicket(this.id, assignee).subscribe({
      next: (updated) => this.ticket.set(updated)
    });
  }

  escalate(): void {
    this.ticketService.escalateTicket(this.id, 'Manual escalation').subscribe();
  }

  merge(): void {
    this.showMergeModal = true;
  }

  searchTicketsForMerge(term: string): void {
    this.mergeSearchSubject.next(term);
  }

  selectMergeTarget(ticket: Ticket): void {
    this.selectedMergeTicket = ticket;
  }

  closeMergeModal(): void {
    this.showMergeModal = false;
    this.mergeSearchTerm = '';
    this.mergeSearchResults.set([]);
    this.selectedMergeTicket = null;
  }

  confirmMerge(): void {
    if (!this.selectedMergeTicket) return;

    this.merging.set(true);
    this.ticketService.mergeTickets(this.selectedMergeTicket.id, this.id).subscribe({
      next: () => {
        this.closeMergeModal();
        this.merging.set(false);
        // Navigate to the merged ticket
        this.router.navigate(['/support', this.selectedMergeTicket!.id]);
      },
      error: () => this.merging.set(false)
    });
  }

  retryLoad(): void {
    this.loadTicket();
    this.loadCannedResponses();
  }

  closeTicket(): void {
    this.updateStatus('CLOSED');
  }

  isSlaBreached(): boolean {
    const t = this.ticket();
    if (!t?.slaDueAt) return false;
    return new Date(t.slaDueAt) < new Date();
  }

  getStatusColor(status: TicketStatus): BadgeColor {
    const colors: Record<TicketStatus, BadgeColor> = {
      OPEN: 'warning',
      IN_PROGRESS: 'outline',
      WAITING_ON_CUSTOMER: 'gray',
      RESOLVED: 'success',
      CLOSED: 'gray'
    };
    return colors[status] || 'gray';
  }

  getPriorityColor(priority: TicketPriority): BadgeColor {
    const colors: Record<TicketPriority, BadgeColor> = {
      LOW: 'gray',
      MEDIUM: 'outline',
      HIGH: 'warning',
      URGENT: 'error'
    };
    return colors[priority] || 'gray';
  }

  formatStatus(status: TicketStatus): string {
    const labels: Record<TicketStatus, string> = {
      OPEN: 'Open',
      IN_PROGRESS: 'In Progress',
      WAITING_ON_CUSTOMER: 'Waiting',
      RESOLVED: 'Resolved',
      CLOSED: 'Closed'
    };
    return labels[status] || status;
  }
}
