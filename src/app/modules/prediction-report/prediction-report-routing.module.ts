import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthGuard } from '@core/guards/auth.guard';

import { PredictionReportComponent } from './components/prediction-report.component';

const routes: Routes = [
  {
    path: '',
    component: PredictionReportComponent,
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PredictionReportRoutingModule {}
