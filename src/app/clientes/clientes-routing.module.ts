import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { InformesComponent } from './informes/informes.component';
import { ClientesComponent } from './clientes.component';
import { PlantaEditComponent } from './planta-edit/planta-edit.component';
import { AutoLocComponent } from './auto-loc/auto-loc.component';
import { PlantaAddComponent } from './planta-add/planta-add.component';
import { InformeAddComponent } from './informe-add/informe-add.component';

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
