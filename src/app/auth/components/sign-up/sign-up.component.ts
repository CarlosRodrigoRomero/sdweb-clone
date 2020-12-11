import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { CustomValidators } from '../../../utils/validators';

import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css'],
})
export class SignUpComponent implements OnInit {
  form: FormGroup;
  hide = true;

  constructor(public authService: AuthService, private formBuilder: FormBuilder) {
    this.buildForm();
  }

  ngOnInit(): void {}

  private buildForm() {
    this.form = this.formBuilder.group(
      {
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirm_password: ['', [Validators.required]],
      },
      {
        validators: this.checkIfMatchingPasswords('password', 'confirm_password'),
      }
    );
  }

  checkIfMatchingPasswords(password: string, confirmPassword: string) {
    return (group: FormGroup) => {
      const passwordInput = group.controls[password];
      const confirmPasswordInput = group.controls[confirmPassword];
      if (passwordInput.value !== confirmPasswordInput.value) {
        return confirmPasswordInput.setErrors({ notEquivalent: true });
      } else {
        return confirmPasswordInput.setErrors(null);
      }
    };
  }

  get emailField(): any {
    return this.form.get('email');
  }

  get passwordField(): any {
    return this.form.get('password');
  }

  get confirmPasswordField(): any {
    return this.form.get('confirm_password');
  }
}
