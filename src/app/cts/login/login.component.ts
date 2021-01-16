import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  public form: FormGroup;
  // public user$ = this.authService.user$;
  public userLogged: boolean;
  username: string;
  password: string;

  constructor(private formBuilder: FormBuilder, private authService: AuthService, private router: Router) {
    // this.form = this.formBuilder.group({
    //   email: ['', Validators.required],
    //   password: ['', Validators.required],
    // });
    
    
    // this.authService.isAuthenticated().subscribe((success) => (this.userLogged = success));
  }

  ngOnInit() {
    /* if (this.authService.isAuthenticated) {
      this.router.navigate(['clientes']);
    } */
  }

  /* login() {
    this.authService.login(this.username, this.password).subscribe(
      (success) => this.router.navigate(['clientes']),
      (error) => console.log(error)
    );
  }
  logout() {
    this.authService.logout();
  } */
}
