import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CareersService, OfferDetails } from '../careers.service';

type ViewState = 'loading' | 'offer' | 'decline-confirm' | 'success' | 'error' | 'already-responded' | 'expired';

@Component({
  selector: 'app-offer-response',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div class="w-full max-w-lg">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-gray-900">SureWork</h1>
          <p class="text-sm text-gray-500 mt-1">Job Offer</p>
        </div>

        <!-- Loading -->
        @if (viewState() === 'loading') {
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div class="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
            <p class="text-gray-500">Loading offer details...</p>
          </div>
        }

        <!-- Offer Details -->
        @if (viewState() === 'offer' && offer()) {
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div class="bg-gray-900 text-white p-6 text-center">
              <h2 class="text-xl font-semibold">Job Offer</h2>
              <p class="text-gray-300 text-sm mt-1">for {{ offer()!.candidateName }}</p>
            </div>

            <div class="p-6 space-y-4">
              <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                <div class="flex justify-between items-start">
                  <span class="text-sm text-gray-500">Position</span>
                  <span class="font-semibold text-gray-900 text-right">{{ offer()!.jobTitle }}</span>
                </div>
                @if (offer()!.department) {
                  <div class="flex justify-between items-start border-t border-gray-200 pt-3">
                    <span class="text-sm text-gray-500">Department</span>
                    <span class="text-gray-900 text-right">{{ offer()!.department }}</span>
                  </div>
                }
                @if (offer()!.location) {
                  <div class="flex justify-between items-start border-t border-gray-200 pt-3">
                    <span class="text-sm text-gray-500">Location</span>
                    <span class="text-gray-900 text-right">{{ offer()!.location }}</span>
                  </div>
                }
                <div class="flex justify-between items-start border-t border-gray-200 pt-3">
                  <span class="text-sm text-gray-500">Salary</span>
                  <span class="font-semibold text-emerald-600 text-right">{{ formatSalary(offer()!.offerSalary, offer()!.salaryCurrency) }}</span>
                </div>
                @if (offer()!.startDate) {
                  <div class="flex justify-between items-start border-t border-gray-200 pt-3">
                    <span class="text-sm text-gray-500">Start Date</span>
                    <span class="text-gray-900 text-right">{{ formatDate(offer()!.startDate) }}</span>
                  </div>
                }
                @if (offer()!.expiryDate) {
                  <div class="flex justify-between items-start border-t border-gray-200 pt-3">
                    <span class="text-sm text-gray-500">Valid Until</span>
                    <span class="font-medium text-red-600 text-right">{{ formatDate(offer()!.expiryDate) }}</span>
                  </div>
                }
              </div>

              <div class="flex gap-3 pt-2">
                <button
                  (click)="acceptOffer()"
                  [disabled]="submitting()"
                  class="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                  {{ submitting() ? 'Processing...' : 'Accept Offer' }}
                </button>
                <button
                  (click)="showDeclineConfirm()"
                  [disabled]="submitting()"
                  class="flex-1 bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-700 font-medium py-3 px-4 rounded-lg border border-gray-300 transition-colors">
                  Decline
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Decline Confirmation -->
        @if (viewState() === 'decline-confirm') {
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Decline Offer</h3>
            <p class="text-gray-600 text-sm mb-4">
              Are you sure you want to decline this offer? This action cannot be undone.
            </p>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Reason (optional)
            </label>
            <textarea
              [(ngModel)]="declineReason"
              rows="3"
              placeholder="Please share your reason for declining..."
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none">
            </textarea>
            <div class="flex gap-3 mt-4">
              <button
                (click)="declineOffer()"
                [disabled]="submitting()"
                class="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition-colors">
                {{ submitting() ? 'Processing...' : 'Confirm Decline' }}
              </button>
              <button
                (click)="viewState.set('offer')"
                [disabled]="submitting()"
                class="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-lg border border-gray-300 transition-colors">
                Go Back
              </button>
            </div>
          </div>
        }

        <!-- Success -->
        @if (viewState() === 'success') {
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            @if (accepted()) {
              <div class="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
                <svg class="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">Offer Accepted!</h3>
              <p class="text-gray-600">
                Congratulations! Your acceptance has been recorded. The recruitment team will be in touch with next steps.
              </p>
            } @else {
              <div class="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <svg class="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">Response Recorded</h3>
              <p class="text-gray-600">
                Thank you for your consideration. We wish you all the best in your future endeavours.
              </p>
            }
          </div>
        }

        <!-- Already Responded -->
        @if (viewState() === 'already-responded') {
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
              <svg class="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Already Responded</h3>
            <p class="text-gray-600">
              This offer has already been responded to. Current status: <strong>{{ offer()?.status?.replace('_', ' ') }}</strong>
            </p>
          </div>
        }

        <!-- Expired -->
        @if (viewState() === 'expired') {
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Offer Expired</h3>
            <p class="text-gray-600">
              This offer has expired and is no longer available. Please contact the recruitment team if you have any questions.
            </p>
          </div>
        }

        <!-- Error -->
        @if (viewState() === 'error') {
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Something Went Wrong</h3>
            <p class="text-gray-600">{{ errorMessage() }}</p>
          </div>
        }
      </div>
    </div>
  `
})
export class OfferResponseComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private careersService = inject(CareersService);

  viewState = signal<ViewState>('loading');
  offer = signal<OfferDetails | null>(null);
  submitting = signal(false);
  accepted = signal(false);
  errorMessage = signal('Unable to load offer details. The link may be invalid.');
  declineReason = '';

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.viewState.set('error');
      this.errorMessage.set('Invalid offer link.');
      return;
    }

    this.careersService.getOfferDetails(token).subscribe({
      next: (offer) => {
        this.offer.set(offer);

        if (offer.status !== 'OFFER_MADE') {
          if (offer.status === 'OFFER_DECLINED') {
            // Check if expired
            if (offer.expiryDate && new Date(offer.expiryDate) < new Date()) {
              this.viewState.set('expired');
            } else {
              this.viewState.set('already-responded');
            }
          } else {
            this.viewState.set('already-responded');
          }
        } else if (offer.expiryDate && new Date(offer.expiryDate) < new Date()) {
          this.viewState.set('expired');
        } else {
          this.viewState.set('offer');
        }
      },
      error: () => {
        this.viewState.set('error');
      }
    });
  }

  acceptOffer(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) return;

    this.submitting.set(true);
    this.careersService.acceptOffer(token).subscribe({
      next: () => {
        this.accepted.set(true);
        this.viewState.set('success');
        this.submitting.set(false);
      },
      error: (err) => {
        this.submitting.set(false);
        if (err.error?.status === 'EXPIRED') {
          this.viewState.set('expired');
        } else if (err.error?.error) {
          this.errorMessage.set(err.error.error);
          this.viewState.set('already-responded');
        } else {
          this.errorMessage.set('Failed to accept offer. Please try again.');
          this.viewState.set('error');
        }
      }
    });
  }

  showDeclineConfirm(): void {
    this.viewState.set('decline-confirm');
  }

  declineOffer(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) return;

    this.submitting.set(true);
    this.careersService.declineOffer(token, this.declineReason).subscribe({
      next: () => {
        this.accepted.set(false);
        this.viewState.set('success');
        this.submitting.set(false);
      },
      error: (err) => {
        this.submitting.set(false);
        if (err.error?.error) {
          this.errorMessage.set(err.error.error);
          this.viewState.set('already-responded');
        } else {
          this.errorMessage.set('Failed to decline offer. Please try again.');
          this.viewState.set('error');
        }
      }
    });
  }

  formatSalary(amount: number, currency: string): string {
    if (!amount) return 'To be discussed';
    const prefix = currency === 'ZAR' ? 'R' : currency + ' ';
    return `${prefix}${amount.toLocaleString('en-ZA')}/mo`;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'TBD';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}
