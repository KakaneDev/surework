import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `<mat-card><p>Forgot Password - Coming Soon</p></mat-card>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPasswordComponent {}
