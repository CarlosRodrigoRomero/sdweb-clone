import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ExportComponent } from '../informe-export/components/export/export.component';
import { InformeViewComponent } from './components/informe-view/informe-view.component';
import { InformeOverviewComponent } from './components/overview/informe-overview.component';
import { PcListComponent } from './components/pc-list/pc-list.component';

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
