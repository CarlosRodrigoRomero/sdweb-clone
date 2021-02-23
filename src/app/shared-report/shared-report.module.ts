import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ShareRoutingModule } from './shared-report-routing.module';
import { PlantaReportModule } from '../planta-report/planta-report.module';
import { ClientsModule } from '../clients/clients.module';

import { SharedReportComponent } from './components/shared-report/shared-report.component';

@NgModule({
  declarations: [SharedReportComponent],
  imports: [CommonModule, ShareRoutingModule, PlantaReportModule, ClientsModule],
})
export class SharedReportModule {}
