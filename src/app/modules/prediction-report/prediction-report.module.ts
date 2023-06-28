import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NgApexchartsModule } from 'ng-apexcharts';

import { PredictionReportRoutingModule } from './prediction-report-routing.module';
import { SharedModule } from '@shared/shared.module';

import { PredictionReportComponent } from './components/prediction-report.component';
import { ChartSankeyReportComponent } from './components/chart-sankey-report/chart-sankey-report.component';
import { ChartPredictionNumAnomsReportComponent } from './components/chart-prediction-num-anoms-report/chart-prediction-num-anoms-report.component';
import { RecommendedActionsPredictionComponent } from './components/recommended-actions-prediction/recommended-actions-prediction.component';
import { RecommendedActionsPredictionContainerComponent } from './containers/recommended-actions-prediction-container/recommended-actions-prediction-container.component';
import { ChartTypesLossesReportComponent } from './components/chart-types-losses-report/chart-types-losses-report.component';
import { ChartPredictionMaeReportComponent } from './components/chart-prediction-mae-report/chart-prediction-mae-report.component';
import { ChartSankeyPowerReportComponent } from './components/chart-sankey-power-report/chart-sankey-power-report.component';
import { ChartSankeyPredictionComponent } from './components/chart-sankey-prediction/chart-sankey-prediction.component';
import { ChartSankeyPredictionV2Component } from './components/chart-sankey-prediction-v2/chart-sankey-prediction-v2.component';

@NgModule({
  declarations: [PredictionReportComponent, ChartSankeyReportComponent, ChartPredictionNumAnomsReportComponent, RecommendedActionsPredictionComponent, RecommendedActionsPredictionContainerComponent, ChartTypesLossesReportComponent, ChartPredictionMaeReportComponent, ChartSankeyPowerReportComponent, ChartSankeyPredictionComponent, ChartSankeyPredictionV2Component],
  imports: [CommonModule, PredictionReportRoutingModule, SharedModule, NgApexchartsModule],
})
export class PredictionReportModule {}
