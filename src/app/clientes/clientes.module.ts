import { NgModule } from '@angular/core';

import { ClientesRoutingModule } from './clientes-routing.module';
import { SharedModule } from '@shared/shared.module';
import { AuthService } from '@core/services/auth.service';
import { InformesComponent } from './components/informes/informes.component';
import { ClientesComponent } from './components/clientes/clientes.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { PlantaEditComponent } from './components/planta-edit/planta-edit.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AgmCoreModule } from '@agm/core';
import { AutoLocComponent } from './components/auto-loc/auto-loc.component';
import { PlantaAddComponent } from './components/planta-add/planta-add.component';
import { InformeAddComponent } from './components/informe-add/informe-add.component';
import { InformeListTableComponent } from './components/informe-list-table/informe-list-table.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ModuloAddComponent } from './components/modulo-add/modulo-add.component';

import { PortfolioBenchmarkComponent } from './components/portfolio-benchmark/portfolio-benchmark.component';
import { ChartModule } from 'primeng/chart';
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
    ModuloAddComponent,
    PortfolioBenchmarkComponent,
  ],
  imports: [
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyAD8uljEDpNHrLWi2e7HYzAE207Q4uyHIM',
      libraries: ['drawing'],
    }),
    ClientesRoutingModule,
    SharedModule,
    ChartModule,
    FormsModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  providers: [AuthService, MatDatepickerModule],
})
export class ClientesModule {}
