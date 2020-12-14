import { Component, OnInit } from '@angular/core';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  userLogged: boolean;
  constructor(public authService: AuthService) {
    // this.form = this.formBuilder.group({
    //   email: ['', Validators.required],
    //   password: ['', Validators.required],
    // });
    // this.authService.isAuthenticated().subscribe((success) => (this.userLogged = success));

    this.authService.isAuthenticated().subscribe((isAuth) => (this.userLogged = isAuth));

    // this.userLogged = this.authService.isLoggedIn;
  }

  ngOnInit() {}

  singOut() {
    this.authService.signOut();
  }
}
