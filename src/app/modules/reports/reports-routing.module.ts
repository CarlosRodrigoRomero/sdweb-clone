import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '@core/guards/auth.guard';

import { ReportsContentComponent } from './components/reports-content.component';

const routes: Routes = [
  {
    path: ':id',
    component: ReportsContentComponent,
    children: [
      { path: '', redirectTo: 'map', pathMatch: 'full' },
      // { path: 'map', component: MapTestComponent },
      // { path: 'dashboard', component: LostDashboardComponent },
      {
        path: 'map',
        loadChildren: () =>
          import('@modules/map-list-report/map-list-report.module').then((m) => m.MapListReportModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'loss',
        loadChildren: () => import('@modules/loss-report/loss-report.module').then((m) => m.LossReportModule),
        canActivate: [AuthGuard],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReportsRoutingModule {}
