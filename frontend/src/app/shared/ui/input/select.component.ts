import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, forwardRef } from '@angular/core';
import { NgClass, NgFor } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'sw-select',
  standalone: true,
  imports: [NgClass, NgFor, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }
  ],
  template: `
    <div class="relative">
      <select
        [disabled]="disabled"
        [ngClass]="selectClasses"
        [attr.id]="id"
        [attr.name]="name"
        [attr.aria-invalid]="error ? 'true' : null"
        [attr.aria-describedby]="ariaDescribedBy"
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
      <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-500 dark:text-neutral-400">
        <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    select {
      appearance: none;
      padding-right: 2.5rem;
    }
  `]
})
export class SelectComponent implements ControlValueAccessor {
  @Input() options: SelectOption[] = [];
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() error = false;
  @Input() id = '';
  @Input() name = '';
  @Input() ariaDescribedBy = '';

  @Output() valueChange = new EventEmitter<string | number>();

  value: string | number = '';
  private onChange: (value: string | number) => void = () => {};
  onTouched: () => void = () => {};

  get selectClasses(): string {
    // TailAdmin style with teal focus and subtle ring
    const base = 'w-full px-3 py-2 rounded-lg border text-neutral-900 bg-white transition-colors duration-200 focus:outline-none focus:ring-2 cursor-pointer';
    const normal = 'border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20 dark:bg-dark-surface dark:border-dark-border dark:text-neutral-100';
    const errorStyles = 'border-error-500 focus:border-error-500 focus:ring-error-500/20';
    const disabledStyles = 'disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed dark:disabled:bg-dark-elevated';

    return `${base} ${this.error ? errorStyles : normal} ${disabledStyles}`;
  }

  onValueChange(value: string | number): void {
    this.value = value;
    this.onChange(value);
    this.valueChange.emit(value);
  }

  writeValue(value: string | number): void {
    this.value = value ?? '';
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
