import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '@core/services/auth.guard';

import { ClientsComponent } from './components/clients/clients.component';
import { MapReportComponent } from './components/map-report/map-report.component';
import { ReportsComponent } from './components/reports/reports.component';

const routes: Routes = [
  {
    path: '',
    component: ClientsComponent,
    children: [
      { path: 'plants', component: ReportsComponent },
      {
        path: 'planta-report',
        loadChildren: () => import('../planta-report/planta-report.module').then((m) => m.PlantaReportModule),
        canActivate: [AuthGuard],
      },
      { path: '', redirectTo: 'plants', pathMatch: 'full' },

      {
        path: 'plants/:id',
        loadChildren: () => import('../planta-report/planta-report.module').then((m) => m.PlantaReportModule),
        canActivate: [AuthGuard],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClientsRoutingModule {}
