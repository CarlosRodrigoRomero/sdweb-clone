import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NgApexchartsModule } from 'ng-apexcharts';

import { PredictionReportRoutingModule } from './prediction-report-routing.module';
import { SharedModule } from '@shared/shared.module';

import { PredictionReportComponent } from './components/prediction-report.component';
import { ChartSankeyReportComponent } from './components/chart-sankey-report/chart-sankey-report.component';
import { ChartMaeReportComponent } from './components/chart-mae-report/chart-mae-report.component';
import { RecommendedActionsPredictionComponent } from './components/recommended-actions-prediction/recommended-actions-prediction.component';
import { RecommendedActionsPredictionContainerComponent } from './containers/recommended-actions-prediction-container/recommended-actions-prediction-container.component';
import { ChartTypesLossesReportComponent } from './components/chart-types-losses-report/chart-types-losses-report.component';
import { ChartPredictionMaeReportComponent } from './components/chart-prediction-mae-report/chart-prediction-mae-report.component';

@NgModule({
  declarations: [PredictionReportComponent, ChartSankeyReportComponent, ChartMaeReportComponent, RecommendedActionsPredictionComponent, RecommendedActionsPredictionContainerComponent, ChartTypesLossesReportComponent, ChartPredictionMaeReportComponent],
  imports: [CommonModule, PredictionReportRoutingModule, SharedModule, NgApexchartsModule],
})
export class PredictionReportModule {}
