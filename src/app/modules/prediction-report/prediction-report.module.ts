import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PredictionReportRoutingModule } from './prediction-report-routing.module';
import { SharedModule } from '@shared/shared.module';

import { PredictionReportComponent } from './components/prediction-report.component';
import { ChartSankeyReportComponent } from './components/chart-sankey-report/chart-sankey-report.component';

@NgModule({
  declarations: [PredictionReportComponent, ChartSankeyReportComponent],
  imports: [CommonModule, PredictionReportRoutingModule, SharedModule],
})
export class PredictionReportModule {}
