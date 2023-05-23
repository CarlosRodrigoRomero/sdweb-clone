import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CreateMapComponent } from './components/create-map.component';

const routes: Routes = [
  {
    path: ':id',
    component: CreateMapComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CreateMapRoutingModule {}
