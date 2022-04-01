import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { Subscription } from 'rxjs';

import { AuthService } from '@core/services/auth.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css'],
})
export class SignInComponent implements OnInit, OnDestroy {
  form: FormGroup;
  hide = true;
  showWarning = false;

  private subscriptions: Subscription = new Subscription();

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

  async signIn() {
    if (this.form.valid) {
      const { email, password } = this.form.value;
      try {
        const user$ = await this.authService.signIn(email, password);

        user$.pipe(take(1)).subscribe((user) => {
          if (user) {
            // tslint:disable-next-line: triple-equals
            if (user.role == 0 || user.role == 1 || user.role == 2) {
              this.router.navigate(['clients']);
            } else {
              this.router.navigate(['clientes']);
            }
          }
        });
      } catch (error) {
        console.log(error);
        this.showWarning = true;
      }
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
