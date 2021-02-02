import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AgmCoreModule } from '@agm/core';
import { ChartsModule } from 'ng2-charts';

import { ClientsRoutingModule } from './clients-routing.module';
import { SharedModule } from '@shared/shared.module';
import { InformeFiltersModule } from '../informe-filters/informe-filters.module';
import { InformeMapFilterModule } from '../informe-map-filter/informe-map-filter.module';

import { ClientsComponent } from './components/clients/clients.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ReportsComponent } from './components/reports/reports.component';
import { ListTableReportComponent } from './components/list-table-report/list-table-report.component';
import { MapReportComponent } from './components/map-report/map-report.component';
import { PlantListComponent } from './components/plant-list/plant-list.component';
import { MapAllPlantsComponent } from './components/map-all-plants/map-all-plants.component';
import { BarChartComponent } from './components/bar-chart/bar-chart.component';
import { AssetSummaryComponent } from './components/asset-summary/asset-summary.component';

@NgModule({
  declarations: [
    ClientsComponent,
    NavbarComponent,
    ReportsComponent,
    ListTableReportComponent,
    MapReportComponent,
    PlantListComponent,
    MapAllPlantsComponent,
    BarChartComponent,
    AssetSummaryComponent,
  ],
  imports: [
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyAD8uljEDpNHrLWi2e7HYzAE207Q4uyHIM',
      libraries: ['drawing'],
    }),
    CommonModule,
    ClientsRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    InformeFiltersModule,
    InformeMapFilterModule,
    ChartsModule,
  ],
})
export class ClientsModule {}
