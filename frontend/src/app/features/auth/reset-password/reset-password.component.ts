import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `<mat-card><p>Reset Password - Coming Soon</p></mat-card>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetPasswordComponent {}
