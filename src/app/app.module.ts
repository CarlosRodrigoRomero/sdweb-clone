import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { NavbarComponent } from './cts/navbar/navbar.component';
import { InformesComponent } from './cts/informes/informes.component';
import { InformeEditComponent } from './cts/informe-edit/informe-edit.component';
import { InformeViewComponent } from './cts/informe-view/informe-view.component';
import { environment } from '../environments/environment';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireStorageModule, StorageBucket } from '@angular/fire/storage';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AgmCoreModule } from '@agm/core';
import {ChartModule} from 'primeng/chart';
import {HttpClientModule} from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { PcListComponent } from './cts/pc-list/pc-list.component';
import { PcFilterComponent } from './cts/pc-filter/pc-filter.component';
import {MatButtonModule, MatCheckboxModule,
   MatNativeDateModule, MatTableModule, MatSortModule, MatPaginatorModule,
   MatIconModule, MatFormFieldModule, MatInputModule, MatButtonToggleModule,
   MatCardModule, MatAutocompleteModule, MatBadgeModule, MatBottomSheetModule,
   MatChipsModule, MatStepperModule, MatDatepickerModule, MatDialogModule,
   MatDividerModule, MatExpansionModule, MatGridListModule, MatListModule,
   MatMenuModule, MatProgressBarModule, MatProgressSpinnerModule, MatRadioModule,
   MatRippleModule, MatSelectModule, MatSidenavModule, MatSliderModule, MatSlideToggleModule,
   MatSnackBarModule, MatTabsModule, MatToolbarModule, MatTooltipModule, MatTreeModule} from '@angular/material';
import { CdkTableModule } from '@angular/cdk/table';
import { CdkTreeModule } from '@angular/cdk/tree';
import { PcDetailsComponent } from './cts/pc-details/pc-details.component';
import { PcMapComponent } from './cts/pc-map/pc-map.component';
import { PcDetailsDialogComponent } from './cts/pc-details-dialog/pc-details-dialog.component';
import { InformeExportComponent } from './cts/informe-export/informe-export.component';
import { OrtophotoComponent } from './cts/ortophoto/ortophoto.component';
import { MapService } from './services/orto.service';
import { LoginComponent } from './cts/login/login.component';
import { AuthService } from './services/auth.service';
import { NgxAuthFirebaseUIModule } from 'ngx-auth-firebaseui';
import { IndexComponent } from './cts/index/index.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    InformesComponent,
    InformeEditComponent,
    InformeViewComponent,
    PcListComponent,
    PcFilterComponent,
    PcDetailsComponent,
    PcMapComponent,
    PcDetailsDialogComponent,
    InformeExportComponent,
    OrtophotoComponent,
    LoginComponent,
    IndexComponent
  ],
  entryComponents: [
    PcDetailsDialogComponent
  ],
  imports: [
    BrowserModule,
    MatCardModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatInputModule,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatIconModule,
    MatFormFieldModule,
    MatPaginatorModule,
    FormsModule,
    HttpClientModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    FormsModule,
    ChartModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFirestoreModule,
    AngularFireAuthModule,
    AngularFireStorageModule,
    CdkTableModule,
    CdkTreeModule,
    MatAutocompleteModule,
    MatBadgeModule,
    MatBottomSheetModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatStepperModule,
    MatDatepickerModule,
    MatDialogModule,
    MatDividerModule,
    MatExpansionModule,
    MatGridListModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatRippleModule,
    MatSelectModule,
    MatSidenavModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    MatTreeModule,
    NgxAuthFirebaseUIModule.forRoot({
        apiKey: 'AIzaSyAT1o9xo0dBaLjBFL2HFiG-r_ipKO6_tqc',
        authDomain: 'sdweb-d33ce.firebaseapp.com',
        databaseURL: 'https://sdweb-d33ce.firebaseio.com',
        projectId: 'sdweb-d33ce',
        storageBucket: 'sdweb-d33ce.appspot.com',
        messagingSenderId: '229404593483',
    }),
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyAD8uljEDpNHrLWi2e7HYzAE207Q4uyHIM'
    })

  ],
  providers: [MapService, AuthService],
  bootstrap: [AppComponent]
})
export class AppModule { }
