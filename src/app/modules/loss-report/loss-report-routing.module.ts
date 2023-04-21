import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthGuard } from '@core/guards/auth.guard';

import { LossReportComponent } from '@modules/loss-report/components/loss-report.component';

const routes: Routes = [
  {
    path: '',
    component: LossReportComponent,
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LossReportRoutingModule {}
