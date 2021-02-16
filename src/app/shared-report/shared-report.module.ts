import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ShareRoutingModule } from './shared-report-routing.module';

import { MapSharedComponent } from './components/map-shared/map-shared.component';
import { PlantaReportModule } from '../planta-report/planta-report.module';
import { SharedReportComponent } from './components/shared-report/shared-report.component';

@NgModule({
  declarations: [MapSharedComponent, SharedReportComponent],
  imports: [CommonModule, ShareRoutingModule, PlantaReportModule],
})
export class SharedReportModule {}
