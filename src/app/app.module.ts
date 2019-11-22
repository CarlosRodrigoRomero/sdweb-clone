import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { AppComponent } from "./app.component";
import { InformesComponent } from "./cts/informes/informes.component";
import { InformeEditComponent } from "./cts/informe-edit/informe-edit.component";
import { environment } from "../environments/environment";
import { AngularFireModule } from "@angular/fire";
import { AngularFireAuthModule } from "@angular/fire/auth";
import {
  AngularFirestoreModule,
  FirestoreSettingsToken
} from "@angular/fire/firestore";
import { AngularFireStorageModule } from "@angular/fire/storage";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ChartModule } from "primeng/chart";
import { HttpClientModule } from "@angular/common/http";
import { AppRoutingModule } from "./app-routing.module";
import {
  MatButtonModule,
  MatNativeDateModule,
  MatTableModule,
  MatSortModule,
  MatPaginatorModule,
  MatIconModule,
  MatFormFieldModule,
  MatInputModule,
  MatCardModule,
  MatDialogModule,
  MatOptionModule,
  MatSelectModule,
  MatRadioModule,
  MatDatepickerModule,
  MatCheckboxModule
} from "@angular/material";
import { CdkTableModule } from "@angular/cdk/table";
import { CdkTreeModule } from "@angular/cdk/tree";
import { LoginComponent } from "./cts/login/login.component";
import { AuthService } from "./services/auth.service";
import { IndexComponent } from "./cts/index/index.component";
import { NavbarComponent } from "./layout/navbar/navbar.component";
import { PubliclayoutComponent } from "./layout/publiclayout/publiclayout.component";
import { ClienteslayoutComponent } from "./layout/clienteslayout/clienteslayout.component";
import { VideoComponent } from "./cts/video/video.component";
import { PruebasComponent } from "./cts/pruebas/pruebas.component";
import { AutoLocComponent } from "./cts/auto-loc/auto-loc.component";
import { PlantaListComponent } from "./cts/planta-list/planta-list.component";
import { PlantaAddComponent } from "./cts/planta-add/planta-add.component";
import { InformeAddComponent } from "./cts/informe-add/informe-add.component";
import { PlantaEditComponent } from "./cts/planta-edit/planta-edit.component";
import { ExplicacionCoaComponent } from "./cts/explicacion-coa/explicacion-coa.component";
import { GetNumeroModulosPipe } from "./pipes/get-numero-modulos.pipe";
import { GetNombreSeguidorPipe } from "./pipes/get-nombre-seguidor.pipe";
import { InformeMapModule } from "./informe-map/informe-map.module";
import { AgmCoreModule } from "@agm/core";
import { InformeExportModule } from "./informe-export/informe-export.module";
import { SpinnerModule } from "./spinner/spinner.module";
import { InformeListModule } from "./informe-view/list/pc-list/informe-list.module";
import { InformeViewComponent } from "./informe-view/informe-view.component";
import { InformeOverviewComponent } from "./informe-view/overview/informe-overview.component";
import { PcFilterComponent } from "./cts/pc-filter/pc-filter.component";
import { MatSliderModule } from "@angular/material";

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    InformesComponent,
    InformeEditComponent,
    InformeViewComponent,
    LoginComponent,
    IndexComponent,
    PubliclayoutComponent,
    ClienteslayoutComponent,
    VideoComponent,
    PruebasComponent,
    InformeOverviewComponent,
    PlantaListComponent,
    AutoLocComponent,
    PlantaAddComponent,
    InformeAddComponent,
    PlantaEditComponent,
    ExplicacionCoaComponent,
    GetNumeroModulosPipe,
    GetNombreSeguidorPipe,
    PcFilterComponent
  ],
  entryComponents: [ExplicacionCoaComponent],
  imports: [
    BrowserModule,
    MatCardModule,
    MatCheckboxModule,
    MatButtonModule,
    MatInputModule,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatIconModule,
    MatFormFieldModule,
    MatOptionModule,
    MatSelectModule,
    MatRadioModule,
    MatDatepickerModule,
    MatPaginatorModule,
    FormsModule,
    HttpClientModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
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
    InformeMapModule,
    InformeExportModule,
    InformeListModule,
    SpinnerModule,
    MatSliderModule,
    AgmCoreModule.forRoot({
      apiKey: "AIzaSyAD8uljEDpNHrLWi2e7HYzAE207Q4uyHIM",
      libraries: ["drawing"]
    })
  ],
  providers: [{ provide: FirestoreSettingsToken, useValue: {} }, AuthService],
  bootstrap: [AppComponent]
})
export class AppModule {}
