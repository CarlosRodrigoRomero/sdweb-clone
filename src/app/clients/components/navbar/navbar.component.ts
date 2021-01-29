import { Component, OnInit } from '@angular/core';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  userLogged: boolean;
  isAdmin: boolean;
  constructor(public authService: AuthService) {
    this.authService.isAuthenticated().subscribe((isAuth) => (this.userLogged = isAuth));
    this.authService.user$.subscribe((user) => {
      this.isAdmin = this.authService.userIsAdmin(user);
    });
  }

  ngOnInit() {}

  signOut() {
    this.authService.signOut();
  }
}
