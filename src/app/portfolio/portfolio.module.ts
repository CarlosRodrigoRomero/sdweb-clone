import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PortfolioRoutingModule } from './portfolio-routing.module';
import { SharedModule } from '@shared/shared.module';

import { DashboardComponent } from './components/dashboard/dashboard.component';
import { EstadoComponent } from './components/estado/estado.component';
import { ViewHeaderComponent } from './components/view-header/view-header.component';
import { ViewsComponent } from './components/views/views.component';
import { PlantsListComponent } from './components/plants-list/plants-list.component';
import { PlantsMapComponent } from './components/plants-map/plants-map.component';
import { MaeChartsComponent } from './components/mae-charts/mae-charts.component';
import { PortfolioResumenComponent } from './components/portfolio-resumen/portfolio-resumen.component';
import { PerdidasChartsComponent } from './components/perdidas-charts/perdidas-charts.component';
import { PrediccionMaesComponent } from './components/prediccion-maes/prediccion-maes.component';

@NgModule({
  declarations: [
    DashboardComponent,
    EstadoComponent,
    ViewHeaderComponent,
    ViewsComponent,
    PlantsListComponent,
    PlantsMapComponent,
    MaeChartsComponent,
    PortfolioResumenComponent,
    PerdidasChartsComponent,
    PrediccionMaesComponent,
  ],
  imports: [CommonModule, PortfolioRoutingModule, SharedModule],
  exports: [DashboardComponent],
})
export class PortfolioModule {}
