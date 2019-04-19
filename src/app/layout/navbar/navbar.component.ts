import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  userLogged: boolean;
  constructor(
    private authService: AuthService,
  ) {
    // this.form = this.formBuilder.group({
    //   email: ['', Validators.required],
    //   password: ['', Validators.required],
    // });
    this.authService.isAuthenticated().subscribe( success => this.userLogged = success);
  }

  ngOnInit() {
  }
  logout() {
    this.authService.logout();
  }


}