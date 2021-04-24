import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MapViewComponent } from './components/map-view/map-view.component';

const routes: Routes = [
  {
    path: ':id',
    component: MapViewComponent,
    // children: [
    //   {
    //     path: '',
    //     pathMatch: 'full',
    //     redirectTo: 'informe-overview',
    //   },
    // ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PlantaFijaRoutingModule {}
