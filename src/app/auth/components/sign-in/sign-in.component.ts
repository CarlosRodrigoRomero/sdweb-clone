import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css'],
})
export class SignInComponent implements OnInit {
  form: FormGroup;
  hide = true;
  warningHide = true;

  constructor(public authService: AuthService, private formBuilder: FormBuilder, private router: Router) {
    this.buildForm();
  }

  ngOnInit(): void {}

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
          this.router.navigate(['clients']);
        })
        .catch((error) => {
          console.log(error);
          this.warningHide = false;
        });
    }
  }
}
