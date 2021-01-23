import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { InformesComponent } from './components/informes/informes.component';
import { ClientesComponent } from './components/clientes/clientes.component';
import { PlantaEditComponent } from './components/planta-edit/planta-edit.component';
import { AutoLocComponent } from './components/auto-loc/auto-loc.component';
import { PlantaAddComponent } from './components/planta-add/planta-add.component';
import { InformeAddComponent } from './components/informe-add/informe-add.component';
import { ModuloAddComponent } from './components/modulo-add/modulo-add.component';

const routes: Routes = [
  {
    path: '',
    component: ClientesComponent,
    children: [
      { path: '', redirectTo: 'informes', pathMatch: 'full' },
      { path: 'informes', component: InformesComponent },
      {
        path: 'planta-edit/:plantaId',
        component: PlantaEditComponent,
      },
      {
        path: 'auto-loc/:id',
        component: AutoLocComponent,
      },
      {
        path: 'planta-add',
        component: PlantaAddComponent,
      },
      {
        path: 'modulo-add',
        component: ModuloAddComponent,
      },
      {
        path: 'planta-edit/:plantaId',
        component: PlantaEditComponent,
      },
      {
        path: 'informe-add/:plantaId',
        component: InformeAddComponent,
      },
      {
        path: 'informe-view',
        loadChildren: () => import('../informe-view/informe-view.module').then((m) => m.InformeViewModule),
      },
      {
        path: 'planta-report',
        loadChildren: () => import('../planta-report/planta-report.module').then((m) => m.PlantaReportModule),
      },
      {
        path: 'informe-edit',
        loadChildren: () => import('../informe-edit/informe-edit.module').then((m) => m.InformeEditModule),
      },
    ],
  },
];

//   ],
// },

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClientesRoutingModule {}
