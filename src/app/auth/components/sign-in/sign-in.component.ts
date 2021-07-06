import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '@core/services/auth.service';

import { UserInterface } from '@core/models/user';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css'],
})
export class SignInComponent implements OnInit {
  form: FormGroup;
  hide = true;
  warningHide = true;
  private user: UserInterface;

  constructor(public authService: AuthService, private formBuilder: FormBuilder, private router: Router) {
    this.buildForm();
  }

  ngOnInit(): void {
    this.authService.user$.subscribe((user) => (this.user = user));
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  signIn(event: Event) {
    if (this.form.valid) {
      const value = this.form.value;
      this.authService
        .signIn(value.email, value.password)
        .then(() => {
          if (this.user.role === 0 || this.user.role === 1 || this.user.role === 2) {
            this.router.navigate(['clients']);
          } else {
            this.router.navigate(['clientes']);
          }
        })
        .catch((error) => {
          console.log(error);
          this.warningHide = false;
        });
    }
  }
}
