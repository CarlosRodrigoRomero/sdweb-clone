import { Component } from '@angular/core';

import { ThemeService } from '@data/services/theme.service';

@Component({
  selector: 'app-switch-theme',
  templateUrl: './switch-theme.component.html',
  styleUrls: ['./switch-theme.component.css'],
})
export class SwitchThemeComponent {
  public darkMode = false;

  constructor(private themeService: ThemeService) {
    this.themeService.themeSelected$.subscribe((theme) => {
      if (theme === 'dark-theme') {
        this.darkMode = true;
      }
    });
  }

  public onSetTheme(theme: string) {
    this.darkMode = !this.darkMode;
    this.themeService.themeSelected = theme;
  }
}
