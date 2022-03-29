import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '@core/services/auth.service';
import { ReportControlService } from '@core/services/report-control.service';
import { ThemeService } from '@core/services/theme.service';

import { UserInterface } from '@core/models/user';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  public isShared = false;
  public userLogged: boolean;
  private user: UserInterface;
  public isAdmin: boolean;
  loadSummary = false;
  hasNotifications = false;

  public themeSelected = 'light-theme';

  constructor(
    public authService: AuthService,
    private router: Router,
    private themeService: ThemeService,
    private reportControlService: ReportControlService
  ) {}

  ngOnInit() {
    // si el enlace es compartido no requerimos estar loggeado
    if (this.router.url.includes('shared')) {
      this.isShared = true;
    } else {
      this.authService.isAuthenticated().subscribe((isAuth) => (this.userLogged = isAuth));
      this.authService.user$.subscribe((user) => {
        this.user = user;
        this.isAdmin = this.authService.userIsAdmin(user);
      });
    }

    this.reportControlService.mapLoaded$.subscribe((value) => {
      this.loadSummary = value;

      if (value) {
        setTimeout(() => (document.getElementById('plant-summary').style.visibility = 'unset'), 1000);
      }
    });

    if (
      this.reportControlService.plantaId === '3JXI01XmcE3G1d4WNMMd' ||
      this.reportControlService.plantaId === 'buzSMRcLEEeLfhnqfbbG'
    ) {
      this.hasNotifications = true;
    }

    // this.themeService.themeSelected$.subscribe((theme) => (this.themeSelected = theme));
  }

  navigateHome() {
    if (this.user.role === 0 || this.user.role === 1 || this.user.role === 2) {
      this.router.navigate(['/clients']);
    }
  }

  signOut() {
    this.authService.signOut();
  }
}
