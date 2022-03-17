import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgApexchartsModule } from 'ng-apexcharts';

import { ClientsRoutingModule } from './clients-routing.module';
import { SharedModule } from '@shared/shared.module';

import { ClientsComponent } from './components/clients/clients.component';
import { ReportsComponent } from './components/reports/reports.component';
import { PlantListComponent } from './components/plant-list/plant-list.component';
import { MapAllPlantsComponent } from './components/map-all-plants/map-all-plants.component';
import { BarChartComponent } from './components/bar-chart/bar-chart.component';
import { DownloadExcelPortfolioComponent } from './components/download-excel-portfolio/download-excel-portfolio.component';
import { PortfolioSummaryComponent } from './components/portfolio-summary/portfolio-summary.component';
import { NewPlantListComponent } from './components/new-plant-list/new-plant-list.component';

@NgModule({
  declarations: [
    ClientsComponent,
    ReportsComponent,
    PlantListComponent,
    MapAllPlantsComponent,
    BarChartComponent,
    DownloadExcelPortfolioComponent,
    PortfolioSummaryComponent,
    NewPlantListComponent,
  ],
  imports: [CommonModule, ClientsRoutingModule, SharedModule, FormsModule, ReactiveFormsModule, NgApexchartsModule],
})
export class ClientsModule {}
