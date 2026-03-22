import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketService } from '@core/services/ticket.service';
import { CannedResponse } from '@core/models/ticket.model';
import { ButtonComponent } from '@core/components/ui/button.component';
import { CardComponent } from '@core/components/ui/card.component';
import { InputComponent } from '@core/components/ui/input.component';
import { ModalComponent } from '@core/components/ui/modal.component';
import { ErrorStateComponent } from '@core/components/ui/error-state.component';
import { RelativeTimePipe } from '@core/pipes/relative-time.pipe';

@Component({
  selector: 'app-canned-responses',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, CardComponent, InputComponent, ModalComponent, ErrorStateComponent, RelativeTimePipe],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 dark:text-white">Canned Responses</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Pre-written responses for common support scenarios</p>
        </div>
        <app-button (onClick)="openCreateModal()">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Add Response
        </app-button>
      </div>

      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        @for (response of responses(); track response.id) {
          <app-card [hover]="true">
            <div class="flex items-start justify-between mb-2">
              <h3 class="font-medium text-gray-800 dark:text-white">{{ response.title }}</h3>
              <span class="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded dark:bg-gray-700">{{ response.category }}</span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">{{ response.content }}</p>
            <div class="flex items-center justify-between text-xs text-gray-500">
              <span>{{ response.createdAt | relativeTime }}</span>
              <div class="flex gap-2">
                <button class="text-primary-600 hover:text-primary-700" (click)="edit(response)">Edit</button>
                <button class="text-error-600 hover:text-error-700" (click)="delete(response.id)">Delete</button>
              </div>
            </div>
          </app-card>
        } @empty {
          <div class="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
            No canned responses yet. Create one to get started.
          </div>
        }
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <app-modal
      [isOpen]="showModal"
      [title]="editingResponse ? 'Edit Response' : 'New Canned Response'"
      (close)="closeModal()"
    >
      <div class="space-y-4">
        <app-input
          label="Title"
          [(ngModel)]="formData.title"
          placeholder="e.g., Greeting"
        />
        <app-input
          label="Category"
          [(ngModel)]="formData.category"
          placeholder="e.g., General, Payroll, Leave"
        />
        <div>
          <label class="form-label">Content</label>
          <textarea
            [(ngModel)]="formData.content"
            rows="5"
            class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-700 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            placeholder="Type your response template..."
          ></textarea>
        </div>
      </div>
      <div modal-footer class="flex justify-end gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-700">
        <app-button variant="outline" (onClick)="closeModal()">Cancel</app-button>
        <app-button (onClick)="save()" [loading]="saving()">Save</app-button>
      </div>
    </app-modal>
  `
})
export class CannedResponsesComponent implements OnInit {
  private ticketService = inject(TicketService);

  responses = signal<CannedResponse[]>([]);
  showModal = false;
  editingResponse: CannedResponse | null = null;
  saving = signal(false);
  hasError = signal(false);
  errorMessage = signal('');

  formData = {
    title: '',
    category: '',
    content: ''
  };

  ngOnInit(): void {
    this.loadResponses();
  }

  loadResponses(): void {
    this.hasError.set(false);
    this.ticketService.getCannedResponses().subscribe({
      next: (responses) => this.responses.set(responses),
      error: () => {
        this.hasError.set(true);
        this.errorMessage.set('Failed to load canned responses. Please try again.');
      }
    });
  }

  retryLoad(): void {
    this.loadResponses();
  }

  openCreateModal(): void {
    this.editingResponse = null;
    this.formData = { title: '', category: '', content: '' };
    this.showModal = true;
  }

  edit(response: CannedResponse): void {
    this.editingResponse = response;
    this.formData = {
      title: response.title,
      category: response.category,
      content: response.content
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingResponse = null;
  }

  save(): void {
    if (!this.formData.title || !this.formData.content) return;

    this.saving.set(true);

    if (this.editingResponse) {
      // Update existing response
      this.ticketService.updateCannedResponse(this.editingResponse.id, this.formData).subscribe({
        next: (updated) => {
          this.responses.update(list =>
            list.map(r => r.id === updated.id ? updated : r)
          );
          this.closeModal();
          this.saving.set(false);
        },
        error: () => this.saving.set(false)
      });
    } else {
      // Create new response
      this.ticketService.createCannedResponse(this.formData).subscribe({
        next: (created) => {
          this.responses.update(list => [...list, created]);
          this.closeModal();
          this.saving.set(false);
        },
        error: () => this.saving.set(false)
      });
    }
  }

  delete(id: string): void {
    if (confirm('Are you sure you want to delete this response?')) {
      this.ticketService.deleteCannedResponse(id).subscribe({
        next: () => this.responses.update(list => list.filter(r => r.id !== id))
      });
    }
  }
}
