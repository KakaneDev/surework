import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'sw-form-field',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-4">
      @if (label) {
        <label
          [attr.for]="for"
          class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
        >
          {{ label }}
          @if (required) {
            <span class="text-error-500 ml-0.5">*</span>
          }
        </label>
      }

      <ng-content />

      @if (hint && !error) {
        <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1" [attr.id]="hintId">
          {{ hint }}
        </p>
      }

      @if (error) {
        <p class="text-sm text-error-500 mt-1" [attr.id]="errorId" role="alert">
          {{ error }}
        </p>
      }
    </div>
  `
})
export class FormFieldComponent {
  @Input() label = '';
  @Input() for = '';
  @Input() hint = '';
  @Input() error = '';
  @Input() required = false;

  get hintId(): string {
    return this.for ? `${this.for}-hint` : '';
  }

  get errorId(): string {
    return this.for ? `${this.for}-error` : '';
  }
}
