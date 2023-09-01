import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NgApexchartsModule } from 'ng-apexcharts';

import { LossReportRoutingModule } from './loss-report-routing.module';
import { SharedModule } from '@shared/shared.module';
import { StatsPlantModule } from '@modules/stats-plant/stats-plant.module';

import { LossReportComponent } from './components/loss-report.component';
import { LossesRecommendedActionsComponent } from './components/losses-recommended-actions/losses-recommended-actions.component';
import { RecommendedActionsContainerComponent } from './containers/recommended-actions-container/recommended-actions-container.component';
import { TotalLossComponent } from './components/total-loss/total-loss.component';
import { TotalLossContainerComponent } from './containers/total-loss-container/total-loss-container.component';
import { ChartLossesByZoneComponent } from './components/chart-losses-by-zone/chart-losses-by-zone.component';
import { ChartLossesByModulesComponent } from './components/chart-losses-by-modules/chart-losses-by-modules.component';
import { PlantLevelSummaryComponent } from './components/plant-level-summary/plant-level-summary.component';

@NgModule({
  declarations: [
    LossReportComponent,
    LossesRecommendedActionsComponent,
    RecommendedActionsContainerComponent,
    TotalLossComponent,
    TotalLossContainerComponent,
    ChartLossesByZoneComponent,
    ChartLossesByModulesComponent,
    PlantLevelSummaryComponent,
  ],
  imports: [CommonModule, LossReportRoutingModule, SharedModule, NgApexchartsModule, StatsPlantModule],
})
export class LossReportModule {}
