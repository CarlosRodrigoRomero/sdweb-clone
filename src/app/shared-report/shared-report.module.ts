import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ShareRoutingModule } from './shared-report-routing.module';
import { PlantaFijaModule } from '../planta-fija/planta-fija.module';
import { ClientsModule } from '../clients/clients.module';

import { SharedReportComponent } from './components/shared-report/shared-report.component';

@NgModule({
  declarations: [SharedReportComponent],
  imports: [CommonModule, ShareRoutingModule, PlantaFijaModule, ClientsModule],
})
export class SharedReportModule {}
