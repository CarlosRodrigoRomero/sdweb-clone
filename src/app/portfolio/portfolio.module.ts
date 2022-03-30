import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NgApexchartsModule } from 'ng-apexcharts';

import { PortfolioRoutingModule } from './portfolio-routing.module';
import { SharedModule } from '@shared/shared.module';

import { DashboardComponent } from './components/dashboard/dashboard.component';
import { EstadoComponent } from './components/estado/estado.component';
import { ViewHeaderComponent } from './components/view-header/view-header.component';
import { ViewsComponent } from './components/views/views.component';
import { PlantsListComponent } from './components/plants-list/plants-list.component';
import { PlantsMapComponent } from './components/plants-map/plants-map.component';
import { MaeChartsComponent } from './components/mae-charts/mae-charts.component';
import { PerdidasChartsComponent } from './components/perdidas-charts/perdidas-charts.component';
import { PrediccionMaesComponent } from './components/prediccion-maes/prediccion-maes.component';
import { SummaryComponent } from './components/summary/summary.component';
import { DistribucionPerdidasChartComponent } from './components/distribucion-perdidas-chart/distribucion-perdidas-chart.component';
import { AltaDegradacionChartComponent } from './components/alta-degradacion-chart/alta-degradacion-chart.component';
import { PeorEstadoChartComponent } from './components/peor-estado-chart/peor-estado-chart.component';
import { AnomaliasGravesChartComponent } from './components/anomalias-graves-chart/anomalias-graves-chart.component';

@NgModule({
  declarations: [
    DashboardComponent,
    EstadoComponent,
    ViewHeaderComponent,
    ViewsComponent,
    PlantsListComponent,
    PlantsMapComponent,
    MaeChartsComponent,
    PerdidasChartsComponent,
    PrediccionMaesComponent,
    SummaryComponent,
    DistribucionPerdidasChartComponent,
    AltaDegradacionChartComponent,
    PeorEstadoChartComponent,
    AnomaliasGravesChartComponent,
  ],
  imports: [CommonModule, PortfolioRoutingModule, SharedModule, NgApexchartsModule],
  exports: [DashboardComponent],
})
export class PortfolioModule {}
