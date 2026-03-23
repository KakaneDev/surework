import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-landing',
  standalone: true,
  template: `<iframe [src]="landingUrl" class="landing-frame"></iframe>`,
  styles: [`
    :host { display: block; width: 100%; height: 100vh; overflow: hidden; }
    .landing-frame { width: 100%; height: 100%; border: none; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingComponent {
  landingUrl: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
    this.landingUrl = this.sanitizer.bypassSecurityTrustResourceUrl('/landing/index.html');
  }
}
