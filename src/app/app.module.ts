import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, NgModule, PLATFORM_ID } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { LayoutModule } from '@angular/cdk/layout';

import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreModule, SETTINGS } from '@angular/fire/firestore';
import { AngularFireStorageModule } from '@angular/fire/storage';

import { HotkeyModule } from 'angular2-hotkeys';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { WINDOW_PROVIDERS } from './window.providers';

import { AppRoutingModule } from './app-routing.module';
import { SharedModule } from '@shared/shared.module';
import { CoreModule } from '@core/core.module';
import { AuthService } from '@data/services/auth.service';
import { RightMenuModule } from '@modules/right-menu/right-menu.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { SharePlantModule } from '@modules/share-plant/share-plant.module';
import { FiltersModule } from '@modules/filters/filters.module';
import { PortfolioModule } from '@modules/portfolio/portfolio.module';
import { SharedPlantsModule } from '@modules/shared-plants/shared-plants.module';

import { environment } from '../environments/environment';

import { SkeletonComponent } from '@layout/components/skeleton/skeleton.component';
import { NavbarContainerComponent } from '@layout/containers/navbar-container/navbar-container.component';
import { NavbarComponent } from '@layout/components/navbar/navbar.component';
import { AppComponent } from './app.component';
import { NavComponent } from './layout/components/nav/nav.component';
import { ReportContentComponent } from './modules/fixed-plant/components/report-content/report-content.component';
import { SimpleBackgroundComponent } from './layout/components/simple-background/simple-background.component';
import { PredictionDialogComponent } from './modules/prediction-report/components/prediction-dialog/prediction-dialog.component';

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
    RightMenuModule,
    SharePlantModule,
    NotificationsModule,
    FiltersModule,
    PortfolioModule,
    SharedPlantsModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient],
      },
    }),
  ],
  providers: [
    { provide: SETTINGS, useValue: {} },
    AuthService,
    WINDOW_PROVIDERS,
    // PERSISTENCIA DE DATOS NO FUNCIONA BIEN. SE QUEDA LA VERSIÓN DE CACHE FIJA Y NO VUELVE A ACTUALIZARSE AUNQUE HAYA CAMBIOS
    // {
    //   provide: APP_INITIALIZER,
    //   useFactory: (platformId: Object, db: AngularFirestore) => {
    //     return () => {
    //       if (isPlatformBrowser(platformId)) {
    //         // Aplicamos solo a mobile
    //         if (window.innerWidth < 600) {
    //           return db.firestore.enablePersistence({ synchronizeTabs: true }).catch((err) => {
    //             if (err.code === 'failed-precondition') {
    //               console.log('Multipe tabs open, persistence can only be enabled in one tab at a a time.');
    //             } else if (err.code === 'unimplemented') {
    //               console.log(
    //                 'The current browser does not support all of the features required to enable persistence'
    //               );
    //             }
    //           });
    //         }
    //       }
    //       // Si no estamos en un navegador o si la pantalla es más grande,
    //       // simplemente resolvemos la promesa inmediatamente.
    //       return Promise.resolve();
    //     };
    //   },
    //   deps: [PLATFORM_ID, AngularFirestore],
    //   multi: true,
    // },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
