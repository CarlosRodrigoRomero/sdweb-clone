import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { InformesComponent } from './cts/informes/informes.component';
import { InformeEditComponent } from './cts/informe-edit/informe-edit.component';
import { environment } from '../environments/environment';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirestoreModule, FirestoreSettingsToken } from '@angular/fire/firestore';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { CdkTableModule } from '@angular/cdk/table';
import { CdkTreeModule } from '@angular/cdk/tree';
import { LoginComponent } from './cts/login/login.component';
import { AuthService } from './services/auth.service';
import { IndexComponent } from './cts/index/index.component';
import { PubliclayoutComponent } from './layout/publiclayout/publiclayout.component';
import { ClienteslayoutComponent } from './layout/clienteslayout/clienteslayout.component';
import { VideoComponent } from './cts/video/video.component';
import { AutoLocComponent } from './cts/auto-loc/auto-loc.component';
import { PlantaListComponent } from './cts/planta-list/planta-list.component';
import { PlantaAddComponent } from './cts/planta-add/planta-add.component';
import { InformeAddComponent } from './cts/informe-add/informe-add.component';
import { PlantaEditComponent } from './cts/planta-edit/planta-edit.component';
import { AgmCoreModule } from '@agm/core';
import { InformeViewModule } from './informe-view/informe-view.module';
import { NavbarModule } from './layout/navbar/navbar.module';
import { AvisoLegalComponent } from './cts/aviso-legal/aviso-legal.component';
import { CanvasComponent } from './cts/informe-edit/canvas.component';
import { EditMapComponent } from './cts/informe-edit/edit-map.component';
import { EditListComponent } from './cts/informe-edit/edit-list.component';
import { ValidateEstructuraPipe } from './pipes/validate-estructura.pipe';
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
    PlantaEditComponent,
    AvisoLegalComponent,
    CanvasComponent,
    EditMapComponent,
    EditListComponent,
    ValidateEstructuraPipe,
  ],

  imports: [
    BrowserModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
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
      apiKey: 'AIzaSyAD8uljEDpNHrLWi2e7HYzAE207Q4uyHIM',
      libraries: ['drawing'],
    }),
  ],
  providers: [ValidateEstructuraPipe, { provide: FirestoreSettingsToken, useValue: {} }, AuthService],
  bootstrap: [AppComponent],
})
export class AppModule {}
