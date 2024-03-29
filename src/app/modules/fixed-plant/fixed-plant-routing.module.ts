import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthGuard } from '@core/guards/auth.guard';

import { FixedPlantComponent } from './components/fixed-plant.component';
import { MapViewComponent } from './components/map-view/map-view.component';

const routes: Routes = [
  {
    path: ':id',
    component: FixedPlantComponent,
    children: [
      { path: '', redirectTo: 'map', pathMatch: 'full' },
      {
        path: 'analysis',
        loadChildren: () => import('@modules/loss-report/loss-report.module').then((m) => m.LossReportModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'map',
        // loadChildren: () =>
        //   import('@modules/map-list-report/map-list-report.module').then((m) => m.MapListReportModule),
        component: MapViewComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'charts',
        loadChildren: () => import('@modules/stats-plant/stats-plant.module').then((m) => m.StatsPlantModule),
        canActivate: [AuthGuard],
      },
      {
        path: 'prediction',
        loadChildren: () =>
          import('@modules/prediction-report/prediction-report.module').then((m) => m.PredictionReportModule),
        canActivate: [AuthGuard],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PlantaFijaRoutingModule {}
