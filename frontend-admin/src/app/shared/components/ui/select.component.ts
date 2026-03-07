import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }
  ],
  template: `
    <div class="w-full">
      @if (label) {
        <label [for]="id" class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ label }}
          @if (required) {
            <span class="text-error-500">*</span>
          }
        </label>
      }
      <div class="relative">
        <select
          [id]="id"
          [disabled]="disabled"
          [class]="selectClasses"
          [(ngModel)]="value"
          (ngModelChange)="onValueChange($event)"
          (blur)="onTouched()"
        >
          @if (placeholder) {
            <option value="" disabled>{{ placeholder }}</option>
          }
          @for (option of options; track option.value) {
            <option [value]="option.value" [disabled]="option.disabled">
              {{ option.label }}
            </option>
          }
        </select>
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
          <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </div>
      @if (error) {
        <p class="mt-1.5 text-sm text-error-500 dark:text-error-400">{{ error }}</p>
      }
    </div>
  `
})
export class SelectComponent implements ControlValueAccessor {
  @Input() id = `select-${Math.random().toString(36).substr(2, 9)}`;
  @Input() label?: string;
  @Input() placeholder?: string;
  @Input() options: SelectOption[] = [];
  @Input() error?: string;
  @Input() required = false;
  @Input() disabled = false;

  value: string | number = '';
  onChange: (value: string | number) => void = () => {};
  onTouched: () => void = () => {};

  get selectClasses(): string {
    // TailAdmin: rounded-xl with brand focus states
    const baseClasses = 'w-full rounded-xl border bg-white px-4 py-2.5 pr-10 text-sm text-gray-800 shadow-theme-xs transition-all duration-200 focus:outline-none dark:bg-white/[0.03] dark:text-gray-200 appearance-none cursor-pointer';
    const borderClasses = this.error
      ? 'border-error-500 focus:border-error-500 focus:ring-2 focus:ring-error-500/10'
      : 'border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-400';
    const disabledClasses = this.disabled ? 'bg-gray-50 cursor-not-allowed dark:bg-gray-800' : '';

    return `${baseClasses} ${borderClasses} ${disabledClasses}`;
  }

  onValueChange(value: string | number): void {
    this.value = value;
    this.onChange(value);
  }

  writeValue(value: string | number): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string | number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
