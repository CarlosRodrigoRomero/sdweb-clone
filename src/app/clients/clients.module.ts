import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';

import { ClientsRoutingModule } from './clients-routing.module';
import { SharedModule } from '@shared/shared.module';
import { OlMapsModule } from '../ol-maps/ol-maps.module';

import { ClientsComponent } from './components/clients/clients.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ReportsComponent } from './components/reports/reports.component';
import { PlantListComponent } from './components/plant-list/plant-list.component';
import { MapAllPlantsComponent } from './components/map-all-plants/map-all-plants.component';
import { BarChartComponent } from './components/bar-chart/bar-chart.component';
import { AssetSummaryComponent } from './components/asset-summary/asset-summary.component';
import { DownloadExcelPortfolioComponent } from './components/download-excel-portfolio/download-excel-portfolio.component';

@NgModule({
  declarations: [
    ClientsComponent,
    NavbarComponent,
    ReportsComponent,
    PlantListComponent,
    MapAllPlantsComponent,
    BarChartComponent,
    AssetSummaryComponent,
    DownloadExcelPortfolioComponent,
  ],
  imports: [
    CommonModule,
    ClientsRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    NgApexchartsModule,
    OlMapsModule,
  ],
})
export class ClientsModule {}
