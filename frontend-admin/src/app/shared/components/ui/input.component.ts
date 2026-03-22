import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
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
        @if (prefixIcon) {
          <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <ng-content select="[prefix]"></ng-content>
          </div>
        }
        <input
          [id]="id"
          [attr.name]="name"
          [type]="type"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [readonly]="readonly"
          [class]="inputClasses"
          [(ngModel)]="value"
          (ngModelChange)="onValueChange($event)"
          (blur)="onTouched()"
        />
        @if (suffixIcon) {
          <div class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <ng-content select="[suffix]"></ng-content>
          </div>
        }
      </div>
      @if (error) {
        <p class="mt-1.5 text-sm text-error-500 dark:text-error-400">{{ error }}</p>
      }
      @if (hint && !error) {
        <p class="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{{ hint }}</p>
      }
    </div>
  `
})
export class InputComponent implements ControlValueAccessor {
  @Input() id = `input-${Math.random().toString(36).substr(2, 9)}`;
  @Input() name?: string;
  @Input() type: 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url' | 'date' = 'text';
  @Input() label?: string;
  @Input() placeholder = '';
  @Input() hint?: string;
  @Input() error?: string;
  @Input() required = false;
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() prefixIcon = false;
  @Input() suffixIcon = false;

  value: string | number = '';
  onChange: (value: string | number) => void = () => {};
  onTouched: () => void = () => {};

  get inputClasses(): string {
    // TailAdmin: rounded-xl with brand focus states
    const baseClasses = 'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs transition-all duration-200 focus:outline-none dark:bg-white/[0.03] dark:text-gray-200';
    const borderClasses = this.error
      ? 'border-error-500 focus:border-error-500 focus:ring-2 focus:ring-error-500/10'
      : 'border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-400';
    const disabledClasses = this.disabled ? 'bg-gray-50 cursor-not-allowed dark:bg-gray-800' : '';
    const paddingClasses = `${this.prefixIcon ? 'pl-11' : ''} ${this.suffixIcon ? 'pr-11' : ''}`;

    return `${baseClasses} ${borderClasses} ${disabledClasses} ${paddingClasses}`;
  }

  onValueChange(value: string | number): void {
    // For number inputs, convert the string value to a number
    if (this.type === 'number' && value !== '' && value !== null) {
      const numValue = parseFloat(value as string);
      this.value = isNaN(numValue) ? '' : numValue;
      this.onChange(isNaN(numValue) ? '' : numValue);
    } else {
      this.value = value;
      this.onChange(value);
    }
  }

  writeValue(value: string | number | null | undefined): void {
    // Handle null, undefined, and actual values including 0
    if (value === null || value === undefined) {
      this.value = '';
    } else {
      this.value = value;
    }
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
