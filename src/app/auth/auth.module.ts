import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { SharedModule } from '@shared/shared.module';

import { AuthenticationRoutingModule } from './auth-routing.module';
import { SignInComponent } from './components/sign-in/sign-in.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';

@NgModule({
  declarations: [SignInComponent, ForgotPasswordComponent],
  imports: [CommonModule, AuthenticationRoutingModule, RouterModule, SharedModule],
})
export class AuthenticationModule {}
