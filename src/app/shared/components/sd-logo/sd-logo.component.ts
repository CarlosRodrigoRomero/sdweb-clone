import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';

import { Subscription } from 'rxjs';

import { ThemeService } from '@data/services/theme.service';

import { UserInterface } from '@core/models/user';
import { AuthService } from '@data/services/auth.service';

@Component({
  selector: 'app-sd-logo',
  templateUrl: './sd-logo.component.html',
  styleUrls: ['./sd-logo.component.css'],
})
export class SdLogoComponent implements OnInit {
  darkMode = true;
  private user: UserInterface;
  isAdmin: boolean;

  @ViewChild('logo', { static: true }) logo: ElementRef;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private themeService: ThemeService,
    private authService: AuthService,
    private router: Router,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
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

    this.subscriptions.add(
      this.authService.user$.subscribe((user) => {
        this.user = user;
        this.isAdmin = this.authService.userIsAdmin(user);
      })
    );
  }

  navigateHome() {
    if (this.user.role === 0 || this.user.role === 1 || this.user.role === 2 || this.user.role === 6) {
      this.router.navigate(['/clients']);
    }
  }

  loadIcons(): void {
    this.matIconRegistry.addSvgIcon(
      'sd_dark',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/sd_dark.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'sd_light',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icons/sd_light.svg')
    );
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
