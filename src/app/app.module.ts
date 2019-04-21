import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";

import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { AppComponent } from "./app.component";
import { InformesComponent } from "./cts/informes/informes.component";
import { InformeEditComponent } from "./cts/informe-edit/informe-edit.component";
import { InformeViewComponent } from "./cts/informe-view/informe-view.component";
import { environment } from "../environments/environment";
import { AngularFireModule } from "@angular/fire";
import { AngularFireAuthModule } from "@angular/fire/auth";
import { AngularFirestoreModule } from "@angular/fire/firestore";
import { AngularFireStorageModule } from "@angular/fire/storage";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { AgmCoreModule } from "@agm/core";
import { ChartModule } from "primeng/chart";
import { HttpClientModule } from "@angular/common/http";
import { AppRoutingModule } from "./app-routing.module";
import { PcListComponent } from "./cts/pc-list/pc-list.component";
import { PcFilterComponent } from "./cts/pc-filter/pc-filter.component";
import {
  MatButtonModule,
  MatCheckboxModule,
  MatNativeDateModule,
  MatTableModule,
  MatSortModule,
  MatPaginatorModule,
  MatIconModule,
  MatFormFieldModule,
  MatInputModule,
  MatButtonToggleModule,
  MatCardModule,
  MatAutocompleteModule,
  MatBadgeModule,
  MatBottomSheetModule,
  MatChipsModule,
  MatDatepickerModule,
  MatDialogModule,
  MatDividerModule,
  MatExpansionModule,
  MatGridListModule,
  MatListModule,
  MatMenuModule,
  MatProgressBarModule,
  MatProgressSpinnerModule,
  MatRadioModule,
  MatSelectModule,
  MatSliderModule,
  MatSlideToggleModule,
  MatTabsModule,
  MatToolbarModule,
  MatTooltipModule,
  MatTreeModule
} from "@angular/material";
import { CdkTableModule } from "@angular/cdk/table";
import { CdkTreeModule } from "@angular/cdk/tree";
import { PcDetailsComponent } from "./cts/pc-details/pc-details.component";
import { PcMapComponent } from "./cts/pc-map/pc-map.component";
import { PcDetailsDialogComponent } from "./cts/pc-details-dialog/pc-details-dialog.component";
import { InformeExportComponent } from "./cts/informe-export/informe-export.component";
<<<<<<< HEAD
// import { OrtophotoComponent } from "./cts/ortophoto/ortophoto.component";
=======
>>>>>>> ad1afcd560d49f5a1a1d9ddae350ccb70593c35a
import { MapService } from "./services/orto.service";
import { LoginComponent } from "./cts/login/login.component";
import { AuthService } from "./services/auth.service";
import { IndexComponent } from "./cts/index/index.component";
import { NavbarComponent } from "./layout/navbar/navbar.component";
import { PubliclayoutComponent } from "./layout/publiclayout/publiclayout.component";
import { ClienteslayoutComponent } from "./layout/clienteslayout/clienteslayout.component";
import { VideoComponent } from "./cts/video/video.component";
import { SpinnerComponent } from "./cts/spinner/spinner.component";
import { PruebasComponent } from "./cts/pruebas/pruebas.component";

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
<<<<<<< HEAD
    // OrtophotoComponent,
=======
>>>>>>> ad1afcd560d49f5a1a1d9ddae350ccb70593c35a
    LoginComponent,
    IndexComponent,
    PubliclayoutComponent,
    ClienteslayoutComponent,
    VideoComponent,
    SpinnerComponent,
    PruebasComponent
  ],
  entryComponents: [PcDetailsDialogComponent],
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
    MatSelectModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatSortModule,
    MatTableModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    MatTreeModule,
    AgmCoreModule.forRoot({
      apiKey: "AIzaSyAD8uljEDpNHrLWi2e7HYzAE207Q4uyHIM"
    })
  ],
  providers: [MapService, AuthService],
  bootstrap: [AppComponent]
})
export class AppModule {}
