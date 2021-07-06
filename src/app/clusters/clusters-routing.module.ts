import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ClustersComponent } from './components/clusters.component';

const routes: Routes = [
  {
    path: ':id',
    component: ClustersComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClustersRoutingModule {}
