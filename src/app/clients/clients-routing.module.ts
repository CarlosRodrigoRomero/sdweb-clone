import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ClientsComponent } from './components/clients/clients.component';
import { MapReportComponent } from './components/map-report/map-report.component';
import { ReportsComponent } from './components/reports/reports.component';

const routes: Routes = [
  {
    path: '',
    component: ClientsComponent,
    children: [
      { path: '', redirectTo: 'reports', pathMatch: 'full' },
      { path: 'reports', component: ReportsComponent },
      {
        path: 'reports/:id',
        component: MapReportComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClientsRoutingModule {}
