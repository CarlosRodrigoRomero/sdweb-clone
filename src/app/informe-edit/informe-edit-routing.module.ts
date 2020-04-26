import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { InformeEditComponent } from './informe-edit.component';

const routes: Routes = [
  {
    path: ':id',
    component: InformeEditComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InformeEditRoutingModule {}
