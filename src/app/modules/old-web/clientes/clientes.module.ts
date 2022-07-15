import { NgModule } from '@angular/core';

import { AgmCoreModule } from '@agm/core';

import { ChartModule } from 'primeng/chart';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { ClientesRoutingModule } from './clientes-routing.module';
import { SharedModule } from '@shared/shared.module';
import { LocationModule } from '@modules/location/location.module';

import { AuthService } from '@data/services/auth.service';

import { InformesComponent } from './components/informes/informes.component';
import { ClientesComponent } from './components/clientes/clientes.component';
import { PlantaEditComponent } from './components/planta-edit/planta-edit.component';
import { AutoLocComponent } from './components/auto-loc/auto-loc.component';
import { PlantaAddComponent } from './components/planta-add/planta-add.component';
import { InformeAddComponent } from './components/informe-add/informe-add.component';
import { InformeListTableComponent } from './components/informe-list-table/informe-list-table.component';
import { PortfolioBenchmarkComponent } from './components/portfolio-benchmark/portfolio-benchmark.component';
import { ModuloAddComponent } from './components/modulo-add/modulo-add.component';

@NgModule({
  declarations: [
    PlantaAddComponent,
    PlantaEditComponent,
    InformeAddComponent,
    AutoLocComponent,
    InformesComponent,
    ClientesComponent,
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
    MatDatepickerModule,
    MatNativeDateModule,
    LocationModule,
  ],
  providers: [AuthService, MatDatepickerModule],
})
export class ClientesModule {}
