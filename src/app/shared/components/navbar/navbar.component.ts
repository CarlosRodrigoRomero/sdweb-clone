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
  public showPlantSummary = false;

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

    this.reportControlService.initialized$.subscribe((init) => (this.showPlantSummary = init));

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
