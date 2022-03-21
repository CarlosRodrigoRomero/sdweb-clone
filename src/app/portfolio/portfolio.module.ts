import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PortfolioRoutingModule } from './portfolio-routing.module';
import { SharedModule } from '@shared/shared.module';

import { DashboardComponent } from './components/dashboard/dashboard.component';
import { EstadoComponent } from './components/estado/estado.component';

@NgModule({
  declarations: [DashboardComponent, EstadoComponent],
  imports: [CommonModule, PortfolioRoutingModule, SharedModule],
})
export class PortfolioModule {}
