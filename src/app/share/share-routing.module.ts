import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MapSharedComponent } from './components/map-shared/map-shared.component';

const routes: Routes = [
  {
    path: ':id',
    component: MapSharedComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ShareRoutingModule {}
