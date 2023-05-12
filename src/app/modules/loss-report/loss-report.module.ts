import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NgApexchartsModule } from 'ng-apexcharts';

import { LossReportRoutingModule } from './loss-report-routing.module';
import { SharedModule } from '@shared/shared.module';

import { LossReportComponent } from './components/loss-report.component';
import { LossesRecommendedActionsComponent } from './components/losses-recommended-actions/losses-recommended-actions.component';
import { RecommendedActionsContainerComponent } from './containers/recommended-actions-container/recommended-actions-container.component';
import { TotalLossComponent } from './components/total-loss/total-loss.component';
import { TotalLossContainerComponent } from './containers/total-loss-container/total-loss-container.component';
import { ChartLossesByZoneComponent } from './components/chart-losses-by-zone/chart-losses-by-zone.component';
import { ChartLossesByModulesComponent } from './components/chart-losses-by-modules/chart-losses-by-modules.component';

@NgModule({
  declarations: [
    LossReportComponent,
    LossesRecommendedActionsComponent,
    RecommendedActionsContainerComponent,
    TotalLossComponent,
    TotalLossContainerComponent,
    ChartLossesByZoneComponent,
    ChartLossesByModulesComponent,
  ],
  imports: [CommonModule, LossReportRoutingModule, SharedModule, NgApexchartsModule],
})
export class LossReportModule {}
