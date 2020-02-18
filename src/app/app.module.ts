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
import { HttpClientModule } from "@angular/common/http";
import { AppRoutingModule } from "./app-routing.module";
import {
  MatButtonModule,
  MatNativeDateModule,
  MatIconModule,
  MatFormFieldModule,
  MatInputModule,
  MatCardModule,
  MatOptionModule,
  MatSelectModule,
  MatRadioModule,
  MatDatepickerModule,
  MatCheckboxModule,
  MatSortModule,
  MatTableModule
} from "@angular/material";
import { CdkTableModule } from "@angular/cdk/table";
import { CdkTreeModule } from "@angular/cdk/tree";
import { LoginComponent } from "./cts/login/login.component";
import { AuthService } from "./services/auth.service";
import { IndexComponent } from "./cts/index/index.component";
import { PubliclayoutComponent } from "./layout/publiclayout/publiclayout.component";
import { ClienteslayoutComponent } from "./layout/clienteslayout/clienteslayout.component";
import { VideoComponent } from "./cts/video/video.component";
import { AutoLocComponent } from "./cts/auto-loc/auto-loc.component";
import { PlantaListComponent } from "./cts/planta-list/planta-list.component";
import { PlantaAddComponent } from "./cts/planta-add/planta-add.component";
import { InformeAddComponent } from "./cts/informe-add/informe-add.component";
import { PlantaEditComponent } from "./cts/planta-edit/planta-edit.component";
import { AgmCoreModule } from "@agm/core";
import { InformeViewModule } from "./informe-view/informe-view.module";
import { NavbarModule } from "./layout/navbar/navbar.module";
@NgModule({
  declarations: [
    AppComponent,
    InformesComponent,
    InformeEditComponent,
    LoginComponent,
    IndexComponent,
    PubliclayoutComponent,
    ClienteslayoutComponent,
    VideoComponent,
    PlantaListComponent,
    AutoLocComponent,
    PlantaAddComponent,
    InformeAddComponent,
    PlantaEditComponent
  ],

  imports: [
    BrowserModule,
    MatCardModule,
    MatTableModule,
    MatSortModule,
    MatCheckboxModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatFormFieldModule,
    MatOptionModule,
    MatSelectModule,
    MatRadioModule,
    MatNativeDateModule,
    MatDatepickerModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFirestoreModule,
    AngularFireAuthModule,
    AngularFireStorageModule,
    CdkTableModule,
    CdkTreeModule,
    InformeViewModule,
    NavbarModule,
    AgmCoreModule.forRoot({
      apiKey: "AIzaSyAD8uljEDpNHrLWi2e7HYzAE207Q4uyHIM",
      libraries: ["drawing"]
    })
  ],
  providers: [{ provide: FirestoreSettingsToken, useValue: {} }, AuthService],
  bootstrap: [AppComponent]
})
export class AppModule {}
