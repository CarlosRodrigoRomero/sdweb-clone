import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';

import { ThemeService } from '@data/services/theme.service';

@Component({
  selector: 'app-sd-complete-logo',
  templateUrl: './sd-complete-logo.component.html',
  styleUrls: ['./sd-complete-logo.component.css'],
})
export class SdCompleteLogoComponent implements OnInit {
  darkMode = true;

  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private themeService: ThemeService
  ) {
    this.loadIcons();
  }

  ngOnInit(): void {
    this.themeService.themeSelected$.subscribe((theme) => {
      if (theme === 'dark-theme') {
        this.darkMode = true;
      } else {
        this.darkMode = false;
      }
    });
  }

  loadIcons(): void {
    this.matIconRegistry.addSvgIcon(
      'sd_complete_dark',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/sd_complete_dark.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'sd_complete_light',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/sd_complete_light.svg')
    );
  }
}
