import { NgModule } from '@angular/core';

import { ClientesRoutingModule } from './clientes-routing.module';
import { SharedModule } from '../shared/shared.module';
import { AuthService } from '../services/auth.service';
import { InformesComponent } from './informes/informes.component';
import { ClientesComponent } from './clientes.component';
import { NavbarComponent } from './navbar/navbar.component';
import { PlantaEditComponent } from './planta-edit/planta-edit.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AgmCoreModule } from '@agm/core';
import { AutoLocComponent } from './auto-loc/auto-loc.component';
import { PlantaAddComponent } from './planta-add/planta-add.component';
import { InformeAddComponent } from './informe-add/informe-add.component';
import { InformeListTableComponent } from './informe-list-table/informe-list-table.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
@NgModule({
  declarations: [
    PlantaAddComponent,
    PlantaEditComponent,
    InformeAddComponent,
    AutoLocComponent,
    InformesComponent,
    ClientesComponent,
    NavbarComponent,
    PlantaEditComponent,
    InformeListTableComponent,
  ],
  imports: [
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyAD8uljEDpNHrLWi2e7HYzAE207Q4uyHIM',
      libraries: ['drawing'],
    }),
    ClientesRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  providers: [AuthService, MatDatepickerModule],
})
export class ClientesModule {}