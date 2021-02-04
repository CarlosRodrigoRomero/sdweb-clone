import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { InformeOverviewComponent } from './components/overview/informe-overview.component';
import { InformeViewComponent } from './components/informe-view/informe-view.component';
import { PcListComponent } from './components/pc-list/pc-list.component';
import { ExportComponent } from '../informe-export/components/export/export.component';

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
        path: 'informe-map-filter',
        loadChildren: () =>
          import('../informe-map-filter/informe-map-filter.module').then((m) => m.InformeMapFilterModule),
        data: {
          shouldReuse: true,
        },
      },
      {
        path: 'informe-seguidor',
        loadChildren: () => import('../informe-seguidor/informe-seguidor.module').then((m) => m.InformeSeguidorModule),
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
