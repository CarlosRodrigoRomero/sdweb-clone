import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { StructuresComponent } from './components/structures.component';

const routes: Routes = [
  {
    path: ':id',
    component: StructuresComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StructuresRoutingModule {}
