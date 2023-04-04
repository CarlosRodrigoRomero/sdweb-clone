import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LossReportRoutingModule } from './loss-report-routing.module';
import { SharedModule } from '@shared/shared.module';

import { LossReportComponent } from './components/loss-report.component';
import { RecommendedActionsComponent } from './components/recommended-actions/recommended-actions.component';
import { RecommendedActionComponent } from './components/recommended-action/recommended-action.component';
import { RecommendedActionsContainerComponent } from './containers/recommended-actions-container/recommended-actions-container.component';

@NgModule({
  declarations: [LossReportComponent, RecommendedActionsComponent, RecommendedActionComponent, RecommendedActionsContainerComponent],
  imports: [CommonModule, LossReportRoutingModule, SharedModule],
})
export class LossReportModule {}
