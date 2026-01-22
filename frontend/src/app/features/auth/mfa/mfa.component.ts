import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store } from '@ngrx/store';
import * as AuthActions from '@core/store/auth/auth.actions';
import * as AuthSelectors from '@core/store/auth/auth.selectors';

@Component({
  selector: 'app-mfa',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="mfa-container">
      <mat-card class="mfa-card">
        <mat-card-header>
          <mat-card-title>
            <h1>Two-Factor Authentication</h1>
          </mat-card-title>
          <mat-card-subtitle>Enter the 6-digit code from your authenticator app</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="mfaForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Authentication Code</mat-label>
              <input matInput type="text" formControlName="code" maxlength="6"
                     placeholder="000000" autocomplete="one-time-code">
              @if (mfaForm.get('code')?.hasError('required') && mfaForm.get('code')?.touched) {
                <mat-error>Code is required</mat-error>
              }
              @if (mfaForm.get('code')?.hasError('minlength') && mfaForm.get('code')?.touched) {
                <mat-error>Code must be 6 digits</mat-error>
              }
            </mat-form-field>

            @if (error$ | async; as error) {
              <div class="error-message">{{ error }}</div>
            }

            <button mat-raised-button color="primary" type="submit" class="full-width verify-button"
                    [disabled]="mfaForm.invalid || (loading$ | async)">
              @if (loading$ | async) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                Verify
              }
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .mfa-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%);
      padding: 16px;
    }

    .mfa-card {
      width: 100%;
      max-width: 400px;
      padding: 24px;
    }

    mat-card-header {
      display: block;
      text-align: center;
      margin-bottom: 24px;
    }

    h1 {
      margin: 0;
      font-size: 20px;
      color: #1a73e8;
    }

    .full-width {
      width: 100%;
    }

    .verify-button {
      margin-top: 16px;
      height: 48px;
      font-size: 16px;
    }

    .error-message {
      background: #ffebee;
      color: #c62828;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 16px;
      text-align: center;
    }

    input {
      text-align: center;
      font-size: 24px;
      letter-spacing: 8px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MfaComponent {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly router = inject(Router);

  loading$ = this.store.select(AuthSelectors.selectAuthLoading);
  error$ = this.store.select(AuthSelectors.selectAuthError);
  challengeToken$ = this.store.select(AuthSelectors.selectMfaChallengeToken);

  mfaForm = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  constructor() {
    // Redirect if no challenge token
    this.challengeToken$.subscribe(token => {
      if (!token) {
        this.router.navigate(['/auth/login']);
      }
    });
  }

  onSubmit(): void {
    if (this.mfaForm.valid) {
      this.challengeToken$.subscribe(token => {
        if (token) {
          this.store.dispatch(AuthActions.verifyMfa({
            request: {
              challengeToken: token,
              mfaCode: this.mfaForm.value.code!
            }
          }));
        }
      }).unsubscribe();
    }
  }
}
