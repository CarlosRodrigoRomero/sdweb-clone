import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ShareRoutingModule } from './share-routing.module';

import { MapSharedComponent } from './components/map-shared/map-shared.component';
import { PlantaReportModule } from '../planta-report/planta-report.module';

@NgModule({
  declarations: [MapSharedComponent],
  imports: [CommonModule, ShareRoutingModule, PlantaReportModule],
})
export class ShareModule {}
