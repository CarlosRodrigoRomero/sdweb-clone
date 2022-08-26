import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '@core/guards/auth.guard';

import { MapViewComponent } from './components/map-view/map-view.component';

const routes: Routes = [
  {
    path: ':id',
    component: MapViewComponent,
    loadChildren: () => import('@modules/stats-plant/stats-plant.module').then((m) => m.StatsPlantModule),
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PlantaFijaRoutingModule {}
