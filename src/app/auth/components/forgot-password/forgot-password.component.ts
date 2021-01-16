import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
})
export class ForgotPasswordComponent implements OnInit {
  form: FormGroup;
  warningHide = true;
  successHide = true;

  constructor(public authService: AuthService, private formBuilder: FormBuilder) {
    this.buildForm();
  }

  ngOnInit(): void {}

  private buildForm() {
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  forgotPassword(passwordResetEmail: string) {
    this.authService
      .forgotPassword(passwordResetEmail)
      .then(() => {
        this.warningHide = true;
        this.successHide = false;
      })
      .catch((error) => {
        this.successHide = true;
        this.warningHide = false;
        console.log(error);
      });
  }
}
