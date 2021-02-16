import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MapSharedComponent } from './components/map-shared/map-shared.component';
import { SharedReportComponent } from './components/shared-report/shared-report.component';

const routes: Routes = [
  {
    path: '',
    component: SharedReportComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ShareRoutingModule {}
