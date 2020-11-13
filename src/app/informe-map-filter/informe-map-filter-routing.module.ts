import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { InformeMapFilterComponent } from './components/informe-map-filter/informe-map-filter.component';

const routes: Routes = [
  {
    path: '',
    component: InformeMapFilterComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InformeMapFilterRoutingModule {}
