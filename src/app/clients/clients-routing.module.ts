import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '@core/services/auth.guard';

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
        path: 'fixed',
        loadChildren: () => import('../planta-fija/planta-fija.module').then((m) => m.PlantaFijaModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'tracker',
        loadChildren: () =>
          import('../planta-seguidores/planta-seguidores.module').then((m) => m.PlantaSeguidoresModule),
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
