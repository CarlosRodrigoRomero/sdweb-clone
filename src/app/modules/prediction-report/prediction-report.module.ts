import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NgApexchartsModule } from 'ng-apexcharts';

import { PredictionReportRoutingModule } from './prediction-report-routing.module';
import { SharedModule } from '@shared/shared.module';

import { PredictionReportComponent } from './components/prediction-report.component';
import { ChartSankeyReportComponent } from './components/chart-sankey-report/chart-sankey-report.component';
import { ChartLossesReportComponent } from './components/chart-losses-report/chart-losses-report.component';
import { RecommendedActionsPredictionComponent } from './components/recommended-actions-prediction/recommended-actions-prediction.component';
import { RecommendedActionsPredictionContainerComponent } from './containers/recommended-actions-prediction-container/recommended-actions-prediction-container.component';

@NgModule({
  declarations: [PredictionReportComponent, ChartSankeyReportComponent, ChartLossesReportComponent, RecommendedActionsPredictionComponent, RecommendedActionsPredictionContainerComponent],
  imports: [CommonModule, PredictionReportRoutingModule, SharedModule, NgApexchartsModule],
})
export class PredictionReportModule {}
