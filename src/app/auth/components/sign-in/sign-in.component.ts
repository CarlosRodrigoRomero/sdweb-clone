import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { Subscription } from 'rxjs';

import { AuthService } from '@core/services/auth.service';

import { UserInterface } from '@core/models/user';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css'],
})
export class SignInComponent implements OnInit, OnDestroy {
  form: FormGroup;
  hide = true;
  warningHide = true;
  private user: UserInterface;

  private subscriptions: Subscription = new Subscription();

  constructor(public authService: AuthService, private formBuilder: FormBuilder, private router: Router) {
    this.buildForm();
  }

  ngOnInit(): void {
    this.subscriptions.add(this.authService.user$.subscribe((user) => (this.user = user)));
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  signIn(event: Event) {
    if (this.form.valid) {
      this.authService
        .signIn(this.form.value.email, this.form.value.password)
        .then(() => {
          if (this.user !== undefined && this.user !== null) {
            if (this.user.role === 0 || this.user.role === 1 || this.user.role === 2) {
              this.router.navigate(['clients']);
            } else {
              this.router.navigate(['clientes']);
            }
          }
        })
        .catch((error) => {
          console.log(error);
          this.warningHide = false;
        });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
