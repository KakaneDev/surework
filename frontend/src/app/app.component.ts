import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LanguageService } from '@core/services/language.service';

/**
 * Root application component.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>',
})
export class AppComponent {
  private readonly languageService = inject(LanguageService);

  title = 'SureWork';

  constructor() {
    this.languageService.initialize();
  }
}
