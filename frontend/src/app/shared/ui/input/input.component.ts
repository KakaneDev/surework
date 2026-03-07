import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, forwardRef } from '@angular/core';
import { NgClass } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'sw-input',
  standalone: true,
  imports: [NgClass, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ],
  template: `
    <input
      [type]="type"
      [placeholder]="placeholder"
      [disabled]="disabled"
      [readonly]="readonly"
      [ngClass]="inputClasses"
      [attr.id]="id"
      [attr.name]="name"
      [attr.autocomplete]="autocomplete"
      [attr.aria-invalid]="error ? 'true' : null"
      [attr.aria-describedby]="ariaDescribedBy"
      [(ngModel)]="value"
      (ngModelChange)="onValueChange($event)"
      (blur)="onTouched()"
    />
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class InputComponent implements ControlValueAccessor {
  @Input() type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' = 'text';
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() error = false;
  @Input() id = '';
  @Input() name = '';
  @Input() autocomplete = '';
  @Input() ariaDescribedBy = '';

  @Output() valueChange = new EventEmitter<string>();

  value = '';
  private onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  get inputClasses(): string {
    // TailAdmin style with teal focus and subtle ring
    const base = 'w-full px-3 py-2 rounded-lg border text-neutral-900 placeholder-neutral-400 bg-white transition-colors duration-200 focus:outline-none focus:ring-2';
    const normal = 'border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20 dark:bg-dark-surface dark:border-dark-border dark:text-neutral-100 dark:placeholder-neutral-500';
    const errorStyles = 'border-error-500 focus:border-error-500 focus:ring-error-500/20';
    const disabledStyles = 'disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed dark:disabled:bg-dark-elevated';

    return `${base} ${this.error ? errorStyles : normal} ${disabledStyles}`;
  }

  onValueChange(value: string): void {
    this.value = value;
    this.onChange(value);
    this.valueChange.emit(value);
  }

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
