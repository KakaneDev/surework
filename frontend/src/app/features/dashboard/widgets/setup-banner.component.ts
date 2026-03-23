import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { selectCurrentUser } from '../../../core/store/auth/auth.selectors';

@Component({
  selector: 'app-setup-banner',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (showBanner()) {
      <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800
                  rounded-xl p-4 mb-6">
        <div class="flex items-start gap-3">
          <span class="text-2xl">🚀</span>
          <div class="flex-1">
            <h3 class="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Complete your setup to unlock all features
            </h3>
            <p class="text-sm text-blue-700 dark:text-blue-300 mb-3">
              {{ remainingCount() === 2 ? 'Two steps' : 'One step' }} remaining to unlock all SureWork features.
            </p>
            <div class="flex flex-wrap gap-3">
              @if (!status().companyDetailsComplete) {
                <a routerLink="/settings/company"
                   class="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800
                          border border-blue-200 dark:border-blue-700 rounded-lg text-sm
                          font-medium text-blue-700 dark:text-blue-300
                          hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">
                  🏢 Complete company details
                </a>
              }
              @if (!status().complianceDetailsComplete) {
                <a routerLink="/settings/compliance"
                   class="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800
                          border border-blue-200 dark:border-blue-700 rounded-lg text-sm
                          font-medium text-blue-700 dark:text-blue-300
                          hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">
                  📋 Complete SARS compliance
                </a>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class SetupBannerComponent {
  private authService = inject(AuthService);
  private store = inject(Store);
  private user = toSignal(this.store.select(selectCurrentUser));

  status = this.authService.tenantSetupStatus;
  private isTenantAdmin = computed(() => {
    const u = this.user();
    return u?.roles?.includes('TENANT_ADMIN') || u?.permissions?.includes('TENANT_ALL');
  });
  showBanner = computed(() => this.isTenantAdmin() && !this.authService.isSetupComplete());
  remainingCount = computed(() => {
    const s = this.status();
    return (s.companyDetailsComplete ? 0 : 1) + (s.complianceDetailsComplete ? 0 : 1);
  });
}
