import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `<p>Settings - Implementation pending</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent {}
