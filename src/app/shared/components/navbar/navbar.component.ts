import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '@core/services/auth.service';

import { ThemeService } from '@core/services/theme.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  public isShared = false;
  public userLogged: boolean;
  public isAdmin: boolean;

  public themeSelected = 'light-theme';

  constructor(public authService: AuthService, private router: Router, private themeService: ThemeService) {}

  ngOnInit() {
    // si el enlace es compartido no requerimos estar loggeado
    if (this.router.url.includes('shared')) {
      this.isShared = true;
    } else {
      this.authService.isAuthenticated().subscribe((isAuth) => (this.userLogged = isAuth));
      this.authService.user$.subscribe((user) => {
        this.isAdmin = this.authService.userIsAdmin(user);
      });
    }

    // this.themeService.themeSelected$.subscribe((theme) => (this.themeSelected = theme));
  }

  signOut() {
    this.authService.signOut();
  }
}
