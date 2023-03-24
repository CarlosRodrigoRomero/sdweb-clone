import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MapViewComponent } from './components/map-view/map-view.component';
import { ReportContentComponent } from './components/report-content/report-content.component';
import { LostDashboardComponent } from './components/lost-dashboard/lost-dashboard.component';
import { MapTestComponent } from './components/map-test/map-test.component';

const routes: Routes = [
  {
    path: ':id',
    component: ReportContentComponent,
    children: [
      { path: '', redirectTo: 'map', pathMatch: 'full' },
      { path: 'map', component: MapTestComponent },
      { path: 'dashboard', component: LostDashboardComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PlantaFijaRoutingModule {}
