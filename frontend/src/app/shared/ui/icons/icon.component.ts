import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'sw-icon',
  standalone: true,
  imports: [LucideAngularModule, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lucide-icon
      [name]="name"
      [size]="sizes[size]"
      [strokeWidth]="strokeWidth"
      [ngClass]="className"
      [attr.aria-hidden]="ariaHidden"
      [attr.aria-label]="ariaLabel || null"
    />
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class IconComponent {
  @Input({ required: true }) name!: string;
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() strokeWidth = 2;
  @Input() className = '';
  @Input() ariaLabel = '';
  @Input() ariaHidden = true;

  readonly sizes = {
    xs: 14,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32
  };
}
