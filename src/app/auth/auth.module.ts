import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MaterialModule } from '@material/material.module';

import { AuthenticationRoutingModule } from './auth-routing.module';
import { SignInComponent } from './components/sign-in/sign-in.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { VerifyEmailComponent } from './components/verify-email/verify-email.component';

@NgModule({
  declarations: [SignInComponent, SignUpComponent, ForgotPasswordComponent, VerifyEmailComponent],
  imports: [CommonModule, AuthenticationRoutingModule, RouterModule, MaterialModule],
})
export class AuthenticationModule {}
