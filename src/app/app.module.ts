import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';


import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirestoreModule, SETTINGS } from '@angular/fire/firestore';
import { AngularFireStorageModule } from '@angular/fire/storage';

import { HotkeyModule } from 'angular2-hotkeys';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppRoutingModule } from './app-routing.module';
import { SharedModule } from '@shared/shared.module';
import { CoreModule } from '@core/core.module';

import { AuthService } from '@data/services/auth.service';
import { RightMenuModule } from '@modules/right-menu/right-menu.module';

import { environment } from '../environments/environment';

import { AppComponent } from './app.component';
import { SkeletonComponent } from '@layout/components/skeleton/skeleton.component';
import { NavbarContainerComponent } from '@layout/containers/navbar-container/navbar-container.component';
import { NavbarComponent } from '@layout/components/navbar/navbar.component';

import { WINDOW_PROVIDERS } from './window.providers';
import { NavComponent } from './layout/components/nav/nav.component';
import { LayoutModule } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ReportContentComponent } from './modules/fixed-plant/components/report-content/report-content.component';
import { SimpleBackgroundComponent } from './layout/components/simple-background/simple-background.component';
import { PredictionDialogComponent } from './modules/prediction-report/components/prediction-dialog/prediction-dialog.component';
import { SharePlantModule } from '@modules/share-plant/share-plant.module';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}
@NgModule({
  declarations: [
    AppComponent,
    SkeletonComponent,
    NavbarContainerComponent,
    NavbarComponent,
    NavComponent,
    ReportContentComponent,
    SimpleBackgroundComponent,
    PredictionDialogComponent,
  ],
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
    LayoutModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    RightMenuModule,
    SharePlantModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient],
      },
    }),
  ],
  providers: [{ provide: SETTINGS, useValue: {} }, AuthService, WINDOW_PROVIDERS],
  bootstrap: [AppComponent],
})
export class AppModule { }
