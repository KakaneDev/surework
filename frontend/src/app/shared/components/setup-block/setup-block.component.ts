import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

/**
 * Shown when a setup guard blocks navigation.
 * Reads the `gate` query-param to display the correct message and CTA.
 *
 * Gates:
 *  - COMPANY_DETAILS → directs user to Settings > Company Profile
 *  - COMPLIANCE      → directs user to Settings > Compliance
 */
@Component({
  selector: 'app-setup-block',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-[60vh] flex items-center justify-center">
      <div class="text-center max-w-md px-8">
        <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
             [class]="gate() === 'COMPANY_DETAILS'
               ? 'bg-amber-100 dark:bg-amber-900/30'
               : 'bg-pink-100 dark:bg-pink-900/30'">
          <span class="text-3xl">{{ gate() === 'COMPANY_DETAILS' ? '🏢' : '📋' }}</span>
        </div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {{ gate() === 'COMPANY_DETAILS'
            ? 'Complete your company details'
            : 'SARS compliance details required' }}
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
          {{ gate() === 'COMPANY_DETAILS'
            ? 'This feature requires your company registration number, address, and contact information. This takes about 2 minutes.'
            : 'This feature requires your tax number, UIF reference, SDL number, and PAYE reference to generate compliant documents.' }}
        </p>
        <a [routerLink]="gate() === 'COMPANY_DETAILS' ? ['/settings/company'] : ['/settings/compliance']"
           class="inline-block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold
                  rounded-lg transition-colors text-center">
          {{ gate() === 'COMPANY_DETAILS' ? 'Go to Company Settings' : 'Go to Compliance Settings' }}
        </a>
        <p class="mt-3 text-xs text-gray-400">
          {{ gate() === 'COMPANY_DETAILS' ? 'Settings → Company Profile' : 'Settings → Compliance' }}
        </p>
      </div>
    </div>
  `
})
export class SetupBlockComponent implements OnInit {
  private route = inject(ActivatedRoute);
  gate = signal<'COMPANY_DETAILS' | 'COMPLIANCE'>('COMPANY_DETAILS');

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.gate.set(params['gate'] || 'COMPANY_DETAILS');
    });
  }
}
