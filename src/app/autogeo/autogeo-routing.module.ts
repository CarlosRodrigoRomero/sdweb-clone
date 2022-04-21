import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AutogeoComponent } from './components/autogeo.component';

const routes: Routes = [
  {
    path: ':id',
    component: AutogeoComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AutogeoRoutingModule {}
