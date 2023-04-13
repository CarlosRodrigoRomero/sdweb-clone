import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PredictionReportRoutingModule } from './prediction-report-routing.module';
import { SharedModule } from '@shared/shared.module';

@NgModule({
  declarations: [],
  imports: [CommonModule, PredictionReportRoutingModule, SharedModule],
})
export class PredictionReportModule {}
