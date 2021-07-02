import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MapFilterComponent } from './components/map-filter/map-filter.component';

const routes: Routes = [
  /* {
    path: '',
    component: MapFilterComponent,
  }, */
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InformeMapFilterRoutingModule {}
