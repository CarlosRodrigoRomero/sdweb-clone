import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ShareRoutingModule } from './shared-report-routing.module';
import { PlantaFijaModule } from '../planta-fija/planta-fija.module';
import { SharedModule } from '@shared/shared.module';

import { SharedReportComponent } from './components/shared-report/shared-report.component';

@NgModule({
  declarations: [SharedReportComponent],
  imports: [CommonModule, ShareRoutingModule, PlantaFijaModule, SharedModule],
})
export class SharedReportModule {}
