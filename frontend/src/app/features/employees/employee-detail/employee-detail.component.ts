import { Component, inject, OnInit, signal, ChangeDetectionStrategy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpEventType } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EmployeeService, Employee } from '@core/services/employee.service';
import { LeaveService, LeaveBalance, LeaveRequest } from '@core/services/leave.service';
import { DocumentService, EmployeeDocument, DocumentCategory } from '@core/services/document.service';
import { SpinnerComponent, BadgeComponent, TabsComponent, TabPanelComponent, DropdownComponent, DropdownItemComponent } from '@shared/ui';
import { ToastService } from '@shared/ui';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    SpinnerComponent,
    BadgeComponent,
    TabsComponent,
    TabPanelComponent,
    DropdownComponent,
    DropdownItemComponent,
  ],
  template: `
    @if (loading()) {
      <div class="flex justify-center items-center py-12">
        <sw-spinner size="lg" />
      </div>
    } @else {
      @if (employee(); as emp) {
      <div class="space-y-6">
        <!-- Header -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <a routerLink="/employees" class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated transition-colors" [attr.aria-label]="'common.back' | translate">
                <span class="material-icons text-neutral-500" aria-hidden="true">arrow_back</span>
              </a>
              <div>
                <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">{{ emp.fullName }}</h1>
                <p class="text-neutral-500 dark:text-neutral-400">{{ emp.employeeNumber }} · {{ emp.jobTitle?.title || 'No Job Title' }}</p>
              </div>
              <sw-badge [variant]="getStatusVariant(emp.status)" [dot]="true" size="sm">{{ formatStatus(emp.status) }}</sw-badge>
            </div>
            <a [routerLink]="['edit']" class="sw-btn sw-btn-outline sw-btn-md">
              <span class="material-icons text-lg">edit</span>
              {{ 'common.edit' | translate }}
            </a>
          </div>
        </div>

        <!-- Tabs -->
        <sw-tabs [tabs]="[('employees.detail.tabs.overview' | translate), ('employees.detail.tabs.compensation' | translate), ('employees.detail.tabs.leave' | translate), ('employees.detail.tabs.documents' | translate)]" [(activeTab)]="activeTab">
          <!-- Overview Tab -->
          <sw-tab-panel [active]="activeTab === 0">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              <!-- Personal Information -->
              <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
                <h3 class="text-lg font-semibold text-neutral-900 dark:text-white mb-4">{{ 'employees.detail.sections.personalInfo' | translate }}</h3>
                <dl class="space-y-3">
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                    <dt class="text-neutral-500 dark:text-neutral-400">{{ 'employees.detail.labels.fullName' | translate }}</dt>
                    <dd class="text-neutral-900 dark:text-white font-medium">{{ emp.fullName }}</dd>
                  </div>
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                    <dt class="text-neutral-500 dark:text-neutral-400">{{ 'employees.detail.labels.email' | translate }}</dt>
                    <dd class="text-neutral-900 dark:text-white">{{ emp.email }}</dd>
                  </div>
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                    <dt class="text-neutral-500 dark:text-neutral-400">{{ 'employees.detail.labels.phone' | translate }}</dt>
                    <dd class="text-neutral-900 dark:text-white">{{ emp.phone }}</dd>
                  </div>
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                    <dt class="text-neutral-500 dark:text-neutral-400">{{ 'employees.detail.labels.idNumber' | translate }}</dt>
                    <dd class="text-neutral-900 dark:text-white font-mono">{{ emp.idNumber }}</dd>
                  </div>
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                    <dt class="text-neutral-500 dark:text-neutral-400">{{ 'employees.detail.labels.dateOfBirth' | translate }}</dt>
                    <dd class="text-neutral-900 dark:text-white">{{ emp.dateOfBirth | date:'mediumDate' }}</dd>
                  </div>
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                    <dt class="text-neutral-500 dark:text-neutral-400">{{ 'employees.detail.labels.gender' | translate }}</dt>
                    <dd class="text-neutral-900 dark:text-white">{{ emp.gender }}</dd>
                  </div>
                  <div class="flex justify-between py-2">
                    <dt class="text-neutral-500 dark:text-neutral-400">{{ 'employees.detail.labels.maritalStatus' | translate }}</dt>
                    <dd class="text-neutral-900 dark:text-white">{{ emp.maritalStatus }}</dd>
                  </div>
                </dl>
              </div>

              <!-- Employment Details -->
              <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
                <h3 class="text-lg font-semibold text-neutral-900 dark:text-white mb-4">{{ 'employees.detail.sections.employmentDetails' | translate }}</h3>
                <dl class="space-y-3">
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                    <dt class="text-neutral-500 dark:text-neutral-400">{{ 'employees.detail.labels.employeeNumber' | translate }}</dt>
                    <dd class="text-neutral-900 dark:text-white font-mono">{{ emp.employeeNumber }}</dd>
                  </div>
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                    <dt class="text-neutral-500 dark:text-neutral-400">{{ 'employees.detail.labels.department' | translate }}</dt>
                    <dd class="text-neutral-900 dark:text-white">{{ emp.department?.name || '-' }}</dd>
                  </div>
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                    <dt class="text-neutral-500 dark:text-neutral-400">{{ 'employees.detail.labels.jobTitle' | translate }}</dt>
                    <dd class="text-neutral-900 dark:text-white">{{ emp.jobTitle?.title || '-' }}</dd>
                  </div>
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                    <dt class="text-neutral-500 dark:text-neutral-400">{{ 'employees.detail.labels.manager' | translate }}</dt>
                    <dd class="text-neutral-900 dark:text-white">{{ emp.manager?.fullName || '-' }}</dd>
                  </div>
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                    <dt class="text-neutral-500 dark:text-neutral-400">{{ 'employees.detail.labels.employmentType' | translate }}</dt>
                    <dd class="text-neutral-900 dark:text-white">{{ emp.employmentType }}</dd>
                  </div>
                  <div class="flex justify-between py-2">
                    <dt class="text-neutral-500 dark:text-neutral-400">{{ 'employees.detail.labels.hireDate' | translate }}</dt>
                    <dd class="text-neutral-900 dark:text-white">{{ emp.hireDate | date:'mediumDate' }}</dd>
                  </div>
                  @if (emp.terminationDate) {
                    <div class="flex justify-between py-2 border-t border-neutral-100 dark:border-dark-border">
                      <dt class="text-neutral-500 dark:text-neutral-400">{{ 'employees.detail.labels.terminationDate' | translate }}</dt>
                      <dd class="text-error-500">{{ emp.terminationDate | date:'mediumDate' }}</dd>
                    </div>
                  }
                </dl>
              </div>

              <!-- Address -->
              <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
                <h3 class="text-lg font-semibold text-neutral-900 dark:text-white mb-4">{{ 'employees.detail.sections.address' | translate }}</h3>
                <dl class="space-y-3">
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                    <dt class="text-neutral-500 dark:text-neutral-400">{{ 'employees.detail.labels.streetAddress' | translate }}</dt>
                    <dd class="text-neutral-900 dark:text-white">{{ emp.address.streetAddress || '-' }}</dd>
                  </div>
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                    <dt class="text-neutral-500 dark:text-neutral-400">{{ 'employees.detail.labels.suburb' | translate }}</dt>
                    <dd class="text-neutral-900 dark:text-white">{{ emp.address.suburb || '-' }}</dd>
                  </div>
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                    <dt class="text-neutral-500 dark:text-neutral-400">{{ 'employees.detail.labels.city' | translate }}</dt>
                    <dd class="text-neutral-900 dark:text-white">{{ emp.address.city || '-' }}</dd>
                  </div>
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                    <dt class="text-neutral-500 dark:text-neutral-400">{{ 'employees.detail.labels.province' | translate }}</dt>
                    <dd class="text-neutral-900 dark:text-white">{{ emp.address.province || '-' }}</dd>
                  </div>
                  <div class="flex justify-between py-2">
                    <dt class="text-neutral-500 dark:text-neutral-400">{{ 'employees.detail.labels.postalCode' | translate }}</dt>
                    <dd class="text-neutral-900 dark:text-white font-mono">{{ emp.address.postalCode || '-' }}</dd>
                  </div>
                </dl>
              </div>

              <!-- Emergency Contact -->
              <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
                <h3 class="text-lg font-semibold text-neutral-900 dark:text-white mb-4">{{ 'employees.detail.sections.emergencyContact' | translate }}</h3>
                <dl class="space-y-3">
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                    <dt class="text-neutral-500 dark:text-neutral-400">{{ 'employees.detail.labels.contactName' | translate }}</dt>
                    <dd class="text-neutral-900 dark:text-white">{{ emp.emergencyContact.name || '-' }}</dd>
                  </div>
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                    <dt class="text-neutral-500 dark:text-neutral-400">{{ 'employees.detail.labels.contactPhone' | translate }}</dt>
                    <dd class="text-neutral-900 dark:text-white">{{ emp.emergencyContact.phone || '-' }}</dd>
                  </div>
                  <div class="flex justify-between py-2">
                    <dt class="text-neutral-500 dark:text-neutral-400">{{ 'employees.detail.labels.relationship' | translate }}</dt>
                    <dd class="text-neutral-900 dark:text-white">{{ emp.emergencyContact.relationship || '-' }}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </sw-tab-panel>

          <!-- Compensation Tab -->
          <sw-tab-panel [active]="activeTab === 1">
            <div class="space-y-6 pt-6">
              <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
                <h3 class="text-lg font-semibold text-neutral-900 dark:text-white mb-4">{{ 'employees.detail.sections.salaryInfo' | translate }}</h3>
                <dl class="space-y-3">
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                    <dt class="text-neutral-500 dark:text-neutral-400">{{ 'employees.detail.labels.basicSalary' | translate }}</dt>
                    <dd class="text-xl font-semibold text-primary-500">R {{ emp.basicSalary | number:'1.2-2' }}</dd>
                  </div>
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                    <dt class="text-neutral-500 dark:text-neutral-400">{{ 'employees.detail.labels.payFrequency' | translate }}</dt>
                    <dd class="text-neutral-900 dark:text-white">{{ emp.payFrequency }}</dd>
                  </div>
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                    <dt class="text-neutral-500 dark:text-neutral-400">{{ 'employees.detail.labels.taxNumber' | translate }}</dt>
                    <dd class="text-neutral-900 dark:text-white font-mono">{{ emp.taxNumber || '-' }}</dd>
                  </div>
                  <div class="flex justify-between py-2">
                    <dt class="text-neutral-500 dark:text-neutral-400">{{ 'employees.detail.labels.taxStatus' | translate }}</dt>
                    <dd class="text-neutral-900 dark:text-white">{{ emp.taxStatus }}</dd>
                  </div>
                </dl>
              </div>

              <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
                <h3 class="text-lg font-semibold text-neutral-900 dark:text-white mb-4">{{ 'employees.detail.sections.bankingDetails' | translate }}</h3>
                <dl class="space-y-3">
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                    <dt class="text-neutral-500 dark:text-neutral-400">{{ 'employees.detail.labels.bankName' | translate }}</dt>
                    <dd class="text-neutral-900 dark:text-white">{{ emp.banking.bankName || '-' }}</dd>
                  </div>
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                    <dt class="text-neutral-500 dark:text-neutral-400">{{ 'employees.detail.labels.accountNumber' | translate }}</dt>
                    <dd class="text-neutral-900 dark:text-white font-mono">{{ emp.banking.accountNumber || '-' }}</dd>
                  </div>
                  <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                    <dt class="text-neutral-500 dark:text-neutral-400">{{ 'employees.detail.labels.branchCode' | translate }}</dt>
                    <dd class="text-neutral-900 dark:text-white font-mono">{{ emp.banking.branchCode || '-' }}</dd>
                  </div>
                  <div class="flex justify-between py-2">
                    <dt class="text-neutral-500 dark:text-neutral-400">{{ 'employees.detail.labels.accountType' | translate }}</dt>
                    <dd class="text-neutral-900 dark:text-white">{{ emp.banking.accountType || '-' }}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </sw-tab-panel>

          <!-- Leave Tab -->
          <sw-tab-panel [active]="activeTab === 2">
            <div class="space-y-6 pt-6">
              <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">{{ 'employees.detail.leaveBalances' | translate }} ({{ currentYear }})</h3>
              @if (loadingLeave()) {
                <div class="flex items-center gap-3 text-neutral-500">
                  <sw-spinner size="sm" />
                  <span>{{ 'employees.detail.loadingLeave' | translate }}</span>
                </div>
              } @else if (leaveBalances().length === 0) {
                <div class="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200 dark:border-dark-border p-8 text-center">
                  <span class="material-icons text-4xl text-neutral-300 dark:text-neutral-600 mb-2">event_busy</span>
                  <p class="text-neutral-500 dark:text-neutral-400">{{ 'employees.detail.noLeaveBalances' | translate }}</p>
                </div>
              } @else {
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  @for (balance of leaveBalances(); track balance.id) {
                    <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
                      <h4 class="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-3">{{ getLeaveTypeLabel(balance.leaveType) | translate }}</h4>
                      <div class="flex justify-between mb-3">
                        <div class="text-center">
                          <span class="block text-2xl font-bold text-primary-500">{{ balance.available }}</span>
                          <span class="text-xs text-neutral-500">{{ 'leave.balances.available' | translate }}</span>
                        </div>
                        <div class="text-center">
                          <span class="block text-2xl font-bold text-neutral-700 dark:text-neutral-300">{{ balance.entitlement }}</span>
                          <span class="text-xs text-neutral-500">{{ 'leave.balances.entitlement' | translate }}</span>
                        </div>
                        <div class="text-center">
                          <span class="block text-2xl font-bold text-neutral-700 dark:text-neutral-300">{{ balance.used }}</span>
                          <span class="text-xs text-neutral-500">{{ 'leave.balances.used' | translate }}</span>
                        </div>
                        <div class="text-center">
                          <span class="block text-2xl font-bold text-warning-500">{{ balance.pending }}</span>
                          <span class="text-xs text-neutral-500">{{ 'leave.balances.pending' | translate }}</span>
                        </div>
                      </div>
                      <div class="h-2 bg-neutral-200 dark:bg-dark-border rounded-full overflow-hidden flex">
                        <div class="bg-primary-500" [style.width.%]="(balance.used / balance.entitlement) * 100"></div>
                        <div class="bg-warning-500" [style.width.%]="(balance.pending / balance.entitlement) * 100"></div>
                      </div>
                    </div>
                  }
                </div>
              }

              <h3 class="text-lg font-semibold text-neutral-900 dark:text-white mt-8">{{ 'employees.detail.leaveHistory' | translate }}</h3>
              @if (leaveRequests().length === 0 && !loadingLeave()) {
                <div class="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200 dark:border-dark-border p-8 text-center">
                  <span class="material-icons text-4xl text-neutral-300 dark:text-neutral-600 mb-2">history</span>
                  <p class="text-neutral-500 dark:text-neutral-400">{{ 'employees.detail.noLeaveRequests' | translate }}</p>
                </div>
              } @else if (leaveRequests().length > 0) {
                <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
                  <div class="overflow-x-auto">
                    <table class="sw-table">
                      <thead>
                        <tr>
                          <th>{{ 'leave.table.type' | translate }}</th>
                          <th>{{ 'leave.table.dates' | translate }}</th>
                          <th>{{ 'leave.table.days' | translate }}</th>
                          <th>{{ 'leave.table.status' | translate }}</th>
                          <th>{{ 'leave.reason' | translate }}</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (request of leaveRequests(); track request.id) {
                          <tr>
                            <td>{{ getLeaveTypeLabel(request.leaveType) | translate }}</td>
                            <td>{{ request.startDate | date:'mediumDate' }} - {{ request.endDate | date:'mediumDate' }}</td>
                            <td>{{ request.days }}</td>
                            <td>
                              <sw-badge [variant]="getLeaveStatusVariant(request.status)" size="sm">{{ request.status }}</sw-badge>
                            </td>
                            <td class="text-neutral-500 dark:text-neutral-400">
                              {{ request.reason ? (request.reason.length > 30 ? request.reason.substring(0, 30) + '...' : request.reason) : '-' }}
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              }
            </div>
          </sw-tab-panel>

          <!-- Documents Tab -->
          <sw-tab-panel [active]="activeTab === 3">
            <div class="space-y-6 pt-6 max-w-4xl">
              <!-- Header -->
              <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-5 flex flex-wrap items-center justify-between gap-4">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                    <span class="material-icons text-white text-2xl">folder</span>
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">{{ 'employees.detail.documents.title' | translate }}</h3>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'employees.detail.documents.subtitle' | translate }}</p>
                  </div>
                </div>
                <input type="file" #fileInput (change)="onFileSelected($event)" class="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx" />
                <button (click)="fileInput.click()" [disabled]="uploading()" class="sw-btn sw-btn-primary sw-btn-md">
                  <span class="material-icons text-lg">add</span>
                  {{ 'employees.detail.documents.upload' | translate }}
                </button>
              </div>

              <!-- Upload Progress -->
              @if (uploading()) {
                <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
                  <div class="flex items-center gap-4 mb-3">
                    <span class="material-icons text-blue-500 text-3xl animate-pulse">upload_file</span>
                    <div>
                      <p class="font-medium text-blue-700 dark:text-blue-300">{{ uploadingFileName() }}</p>
                      <p class="text-sm text-blue-600 dark:text-blue-400">{{ 'employees.detail.documents.uploading' | translate }} {{ uploadProgress() }}%</p>
                    </div>
                  </div>
                  <div class="h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                    <div class="h-full bg-blue-500 transition-all" [style.width.%]="uploadProgress()"></div>
                  </div>
                </div>
              }

              <!-- States -->
              @if (loadingDocuments()) {
                <div class="flex items-center gap-3 text-neutral-500 py-8">
                  <sw-spinner size="md" />
                  <span>{{ 'employees.detail.documents.loading' | translate }}</span>
                </div>
              } @else if (documentsError()) {
                <div class="bg-warning-50 dark:bg-warning-900/20 border-2 border-dashed border-warning-300 dark:border-warning-700 rounded-xl p-12 text-center">
                  <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-warning-500 to-warning-600 flex items-center justify-center mx-auto mb-6">
                    <span class="material-icons text-white text-4xl">cloud_off</span>
                  </div>
                  <h4 class="text-lg font-bold text-warning-800 dark:text-warning-200 mb-2">{{ 'employees.detail.documents.serviceUnavailable' | translate }}</h4>
                  <p class="text-warning-600 dark:text-warning-400 mb-6">{{ 'employees.detail.documents.serviceUnavailableDescription' | translate }}</p>
                  <button (click)="loadDocuments(employeeId)" class="sw-btn sw-btn-outline sw-btn-md border-warning-500 text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-900/30">
                    <span class="material-icons text-lg">refresh</span>
                    {{ 'employees.detail.documents.tryAgain' | translate }}
                  </button>
                </div>
              } @else if (documents().length === 0) {
                <div class="bg-neutral-50 dark:bg-dark-surface border-2 border-dashed border-neutral-300 dark:border-dark-border rounded-xl p-12 text-center">
                  <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <span class="material-icons text-white text-4xl">description</span>
                  </div>
                  <h4 class="text-lg font-bold text-neutral-800 dark:text-neutral-200 mb-2">{{ 'employees.detail.documents.noDocuments' | translate }}</h4>
                  <p class="text-neutral-500 dark:text-neutral-400 mb-6 max-w-md mx-auto">{{ 'employees.detail.documents.noDocumentsDescription' | translate }}</p>
                  <button (click)="fileInput.click()" class="sw-btn sw-btn-primary sw-btn-md mb-4">
                    <span class="material-icons text-lg">add</span>
                    {{ 'employees.detail.documents.uploadFirst' | translate }}
                  </button>
                  <p class="text-xs text-neutral-400">{{ 'employees.detail.documents.supportedFormats' | translate }}</p>
                </div>
              } @else {
                <!-- Stats -->
                <div class="flex flex-wrap gap-4">
                  <div class="flex items-center gap-3 px-4 py-3 bg-neutral-100 dark:bg-dark-elevated rounded-lg">
                    <span class="material-icons text-neutral-500">description</span>
                    <span class="font-bold text-neutral-800 dark:text-neutral-200">{{ documents().length }}</span>
                    <span class="text-sm text-neutral-500">{{ 'employees.detail.documents.totalDocuments' | translate }}</span>
                  </div>
                  <div class="flex items-center gap-3 px-4 py-3 bg-neutral-100 dark:bg-dark-elevated rounded-lg">
                    <span class="material-icons text-neutral-500">lock</span>
                    <span class="font-bold text-neutral-800 dark:text-neutral-200">{{ getConfidentialCount() }}</span>
                    <span class="text-sm text-neutral-500">{{ 'employees.detail.documents.confidential' | translate }}</span>
                  </div>
                </div>

                <!-- Documents List -->
                <div class="space-y-3">
                  @for (doc of documents(); track doc.id) {
                    <div class="bg-white dark:bg-dark-surface rounded-xl border border-neutral-200 dark:border-dark-border p-4 flex items-center gap-4 hover:border-primary-300 hover:shadow-md transition-all"
                         [class.border-l-4]="doc.confidential" [class.border-l-warning-500]="doc.confidential">
                      <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                           [ngClass]="getCategoryBgClass(doc.category)">
                        <span class="material-icons" [ngClass]="getCategoryIconClass(doc.category)">{{ getCategoryIcon(doc.category) }}</span>
                        @if (doc.confidential) {
                          <span class="absolute -bottom-1 -right-1 w-5 h-5 bg-warning-500 rounded-full flex items-center justify-center">
                            <span class="material-icons text-white text-xs">lock</span>
                          </span>
                        }
                      </div>
                      <div class="flex-1 min-w-0">
                        <h4 class="font-semibold text-neutral-800 dark:text-neutral-200 truncate">{{ doc.name }}</h4>
                        <div class="flex items-center gap-2 text-sm text-neutral-500 flex-wrap">
                          <span class="px-2 py-0.5 bg-neutral-100 dark:bg-dark-elevated rounded text-xs font-medium">{{ getCategoryLabel(doc.category) }}</span>
                          <span>·</span>
                          <span>{{ doc.formattedFileSize || formatFileSize(doc.fileSize) }}</span>
                          <span>·</span>
                          <span>{{ doc.uploadedAt | date:'mediumDate' }}</span>
                        </div>
                      </div>
                      <div class="flex items-center gap-2 flex-shrink-0">
                        <button (click)="downloadDocument(doc)" class="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors" [attr.aria-label]="'common.download' | translate">
                          <span class="material-icons text-lg">download</span>
                        </button>
                        <sw-dropdown align="right">
                          <button trigger class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated text-neutral-500 transition-colors" [attr.aria-label]="'common.moreOptions' | translate">
                            <span class="material-icons">more_vert</span>
                          </button>
                          <sw-dropdown-item (onClick)="downloadDocument(doc)">
                            <div class="flex items-center gap-2">
                              <span class="material-icons text-lg">download</span>
                              {{ 'employees.detail.documents.download' | translate }}
                            </div>
                          </sw-dropdown-item>
                          <sw-dropdown-item (onClick)="deleteDocument(doc)">
                            <div class="flex items-center gap-2 text-error-500">
                              <span class="material-icons text-lg">delete</span>
                              {{ 'employees.detail.documents.delete' | translate }}
                            </div>
                          </sw-dropdown-item>
                        </sw-dropdown>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </sw-tab-panel>
        </sw-tabs>
      </div>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly employeeService = inject(EmployeeService);
  private readonly leaveService = inject(LeaveService);
  private readonly documentService = inject(DocumentService);
  private readonly toast = inject(ToastService);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  activeTab = 0;

  employee = signal<Employee | null>(null);
  loading = signal(true);

  // Leave data
  leaveBalances = signal<LeaveBalance[]>([]);
  leaveRequests = signal<LeaveRequest[]>([]);
  loadingLeave = signal(false);
  currentYear = new Date().getFullYear();
  leaveColumns = ['leaveType', 'dates', 'days', 'status', 'reason'];

  // Document data
  documents = signal<EmployeeDocument[]>([]);
  loadingDocuments = signal(false);
  documentsError = signal(false);
  uploading = signal(false);
  uploadProgress = signal(0);
  uploadingFileName = signal('');

  employeeId = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.employeeId = id;
      this.loadEmployee(id);
      this.loadLeaveData(id);
      this.loadDocuments(id);
    }
  }

  loadEmployee(id: string): void {
    this.loading.set(true);
    this.employeeService.getEmployee(id).subscribe({
      next: (employee) => {
        this.employee.set(employee);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  loadLeaveData(employeeId: string): void {
    this.loadingLeave.set(true);

    // Load balances
    this.leaveService.getEmployeeBalances(employeeId, this.currentYear).subscribe({
      next: (balances) => {
        this.leaveBalances.set(balances);
        this.loadingLeave.set(false);
      },
      error: () => {
        this.loadingLeave.set(false);
      }
    });

    // Load leave requests
    this.leaveService.getEmployeeRequests(employeeId, 0, 20).subscribe({
      next: (response) => {
        this.leaveRequests.set(response.content);
      }
    });
  }

  getLeaveTypeLabel(type: string): string {
    return LeaveService.getLeaveTypeLabel(type as any);
  }

  getStatusVariant(status: string): 'success' | 'warning' | 'error' | 'neutral' {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
      ACTIVE: 'success',
      ON_LEAVE: 'warning',
      SUSPENDED: 'error',
      TERMINATED: 'neutral'
    };
    return variants[status] || 'neutral';
  }

  formatStatus(status: string): string {
    const labels: Record<string, string> = {
      ACTIVE: 'Active',
      ON_LEAVE: 'On Leave',
      SUSPENDED: 'Suspended',
      TERMINATED: 'Terminated'
    };
    return labels[status] || status;
  }

  getLeaveStatusVariant(status: string): 'success' | 'warning' | 'error' | 'neutral' {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
      PENDING: 'warning',
      APPROVED: 'success',
      REJECTED: 'error',
      CANCELLED: 'neutral'
    };
    return variants[status] || 'neutral';
  }

  getCategoryBgClass(category: string): string {
    const classes: Record<string, string> = {
      EMPLOYMENT_CONTRACT: 'bg-blue-100 dark:bg-blue-900/30',
      ID_DOCUMENT: 'bg-amber-100 dark:bg-amber-900/30',
      TAX_NUMBER: 'bg-green-100 dark:bg-green-900/30',
      BANK_CONFIRMATION: 'bg-purple-100 dark:bg-purple-900/30',
      CV: 'bg-pink-100 dark:bg-pink-900/30'
    };
    return classes[category] || 'bg-neutral-100 dark:bg-neutral-800';
  }

  getCategoryIconClass(category: string): string {
    const classes: Record<string, string> = {
      EMPLOYMENT_CONTRACT: 'text-blue-600',
      ID_DOCUMENT: 'text-amber-600',
      TAX_NUMBER: 'text-green-600',
      BANK_CONFIRMATION: 'text-purple-600',
      CV: 'text-pink-600'
    };
    return classes[category] || 'text-neutral-600';
  }

  // Document methods
  loadDocuments(employeeId: string): void {
    this.loadingDocuments.set(true);
    this.documentsError.set(false);
    this.documentService.getEmployeeDocuments(employeeId).subscribe({
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
    const employee = this.employee();

    const metadata = {
      name: file.name.replace(/\.[^/.]+$/, ''),
      category,
      ownerType: 'EMPLOYEE' as const,
      ownerId: this.employeeId,
      ownerName: employee?.fullName
    };

    // For now, we'll use a mock uploader ID
    const uploaderId = '00000000-0000-0000-0000-000000000100';

    this.documentService.uploadDocument(file, metadata, uploaderId).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress.set(Math.round(100 * event.loaded / event.total));
        } else if (event.type === HttpEventType.Response) {
          this.uploading.set(false);
          this.toast.success('Document uploaded successfully');
          this.loadDocuments(this.employeeId);
        }
      },
      error: (err) => {
        this.uploading.set(false);
        this.toast.error('Failed to upload document');
        console.error('Upload error:', err);
      }
    });

    // Reset file input
    input.value = '';
  }

  detectCategory(fileName: string): DocumentCategory {
    const lower = fileName.toLowerCase();
    if (lower.includes('contract') || lower.includes('agreement')) return 'EMPLOYMENT_CONTRACT';
    if (lower.includes('id') || lower.includes('identity')) return 'ID_DOCUMENT';
    if (lower.includes('passport')) return 'PASSPORT';
    if (lower.includes('tax') || lower.includes('it3') || lower.includes('irp5')) return 'TAX_NUMBER';
    if (lower.includes('bank') || lower.includes('account')) return 'BANK_CONFIRMATION';
    if (lower.includes('degree') || lower.includes('diploma') || lower.includes('qualification')) return 'QUALIFICATION';
    if (lower.includes('certificate') || lower.includes('cert')) return 'CERTIFICATION';
    if (lower.includes('medical') || lower.includes('doctor')) return 'MEDICAL_CERTIFICATE';
    if (lower.includes('payslip') || lower.includes('salary')) return 'PAYSLIP';
    if (lower.includes('cv') || lower.includes('resume')) return 'CV';
    if (lower.includes('performance') || lower.includes('review')) return 'PERFORMANCE_REVIEW';
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
        this.toast.error('Failed to download document');
      }
    });
  }

  deleteDocument(doc: EmployeeDocument): void {
    if (!confirm(`Are you sure you want to delete "${doc.name}"?`)) return;

    this.documentService.deleteDocument(doc.id).subscribe({
      next: () => {
        this.toast.success('Document deleted');
        this.loadDocuments(this.employeeId);
      },
      error: () => {
        this.toast.error('Failed to delete document');
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

  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
