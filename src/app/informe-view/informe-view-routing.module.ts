import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { InformeOverviewComponent } from './overview/informe-overview.component';
import { InformeViewComponent } from './informe-view.component';
import { PcListComponent } from './list/pc-list/pc-list.component';
import { ExportComponent } from '../informe-export/export/export.component';

const routes: Routes = [
  {
    path: ':id',
    component: InformeViewComponent,

    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'informe-overview',
      },
      {
        path: 'informe-overview',
        component: InformeOverviewComponent,
        data: {
          shouldReuse: true,
        },
      },
      {
        path: 'informe-map',
        loadChildren: () => import('../informe-map/informe-map.module').then((m) => m.InformeMapModule),
        data: {
          shouldReuse: true,
        },
      },
      {
        path: 'informe-export',
        component: ExportComponent,
        data: {
          shouldReuse: true,
        },
      },
      {
        path: 'informe-list',
        component: PcListComponent,
        data: {
          shouldReuse: true,
        },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InformeViewRoutingModule {}
