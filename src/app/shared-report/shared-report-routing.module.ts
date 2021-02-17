import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MapSharedComponent } from './components/map-shared/map-shared.component';
import { SharedReportComponent } from './components/shared-report/shared-report.component';
import { MapViewComponent } from '../planta-report/components/map-view/map-view.component';
import { MapComponent } from '../planta-report/components/map/map.component';

const routes: Routes = [
  {
    path: '',
    component: MapViewComponent,
  },
  {
    path: ':id',
    component: MapViewComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ShareRoutingModule {}
