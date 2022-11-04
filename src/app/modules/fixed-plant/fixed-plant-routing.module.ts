import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MapViewContainerComponent } from './containers/map-view-container/map-view-container.component';

const routes: Routes = [
  {
    path: ':id',
    component: MapViewContainerComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PlantaFijaRoutingModule {}
