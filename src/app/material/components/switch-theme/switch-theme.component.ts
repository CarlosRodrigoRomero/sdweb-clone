import { Component } from '@angular/core';

import { ThemeService } from '@core/services/theme.service';

@Component({
  selector: 'app-switch-theme',
  templateUrl: './switch-theme.component.html',
  styleUrls: ['./switch-theme.component.css'],
})
export class SwitchThemeComponent {
  public darkMode = false;

  constructor(private themeService: ThemeService) {}

  public onSetTheme(theme: string) {
    this.darkMode = !this.darkMode;
    this.themeService.themeSelected = theme;
  }
}
