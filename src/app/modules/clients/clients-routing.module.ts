import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '@core/guards/auth.guard';

import { ClientsComponent } from './components/clients/clients.component';
import { ReportsComponent } from './components/reports/reports.component';

const routes: Routes = [
  {
    path: '',
    component: ClientsComponent,
    children: [
      { path: 'plants', component: ReportsComponent },
      {
        path: 'portfolio',
        loadChildren: () => import('../portfolio/portfolio.module').then((m) => m.PortfolioModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'reports',
        loadChildren: () => import('@modules/reports/reports.module').then((m) => m.ReportsModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'fixed',
        loadChildren: () => import('../fixed-plant/fixed-plant.module').then((m) => m.FixedPlantModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'tracker',
        loadChildren: () => import('../tracker-plant/tracker-plant.module').then((m) => m.TrackerPlantModule),
        canActivate: [AuthGuard],
      },
      { path: '', redirectTo: 'plants', pathMatch: 'full' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClientsRoutingModule {}
