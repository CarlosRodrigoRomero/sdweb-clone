import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NgApexchartsModule } from 'ng-apexcharts';

import { PredictionReportRoutingModule } from './prediction-report-routing.module';
import { SharedModule } from '@shared/shared.module';

import { PredictionReportComponent } from './components/prediction-report.component';
import { ChartSankeyReportComponent } from './components/chart-sankey-report/chart-sankey-report.component';
import { ChartLossesReportComponent } from './components/chart-losses-report/chart-losses-report.component';

@NgModule({
  declarations: [PredictionReportComponent, ChartSankeyReportComponent, ChartLossesReportComponent],
  imports: [CommonModule, PredictionReportRoutingModule, SharedModule, NgApexchartsModule],
})
export class PredictionReportModule {}
