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

@NgModule({
  declarations: [DashboardComponent, EstadoComponent, ViewHeaderComponent, ViewsComponent, PlantsListComponent, PlantsMapComponent],
  imports: [CommonModule, PortfolioRoutingModule, SharedModule],
})
export class PortfolioModule {}
