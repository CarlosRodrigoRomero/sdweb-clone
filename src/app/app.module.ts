import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { CommonModule } from '@angular/common';

import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirestoreModule, SETTINGS } from '@angular/fire/firestore';
import { AngularFireStorageModule } from '@angular/fire/storage';

import { HotkeyModule } from 'angular2-hotkeys';

import { AppRoutingModule } from './app-routing.module';
import { SharedModule } from '@shared/shared.module';
import { CoreModule } from '@core/core.module';

import { AuthService } from '@data/services/auth.service';

import { environment } from '../environments/environment';

import { AppComponent } from './app.component';
import { SkeletonComponent } from '@layout/skeleton/skeleton.component';
import { NavbarViewComponent } from '@layout/navbar-view/navbar-view.component';
import { NavbarComponent } from './layout/navbar/navbar.component';

import { WINDOW_PROVIDERS } from './window.providers';

@NgModule({
  declarations: [AppComponent, SkeletonComponent, NavbarViewComponent, NavbarComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFirestoreModule,
    AngularFireAuthModule,
    AngularFireStorageModule,
    SharedModule,
    CoreModule,
    CommonModule,
    HotkeyModule.forRoot(),
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
  ],
  providers: [{ provide: SETTINGS, useValue: {} }, AuthService, WINDOW_PROVIDERS],
  bootstrap: [AppComponent],
})
export class AppModule {}
