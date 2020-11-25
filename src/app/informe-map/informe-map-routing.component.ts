import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InformeMapComponent } from './components/informe-map/informe-map.component';

const routes: Routes = [
  {
    path: '',
    component: InformeMapComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InformeMapRoutingModule {}
