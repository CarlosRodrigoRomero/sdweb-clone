import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthGuard } from '@core/guards/auth.guard';

import { MapListContentComponent } from './components/map-list-content.component';

const routes: Routes = [
  {
    path: '',
    component: MapListContentComponent,
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MapListReportRoutingModule {}
