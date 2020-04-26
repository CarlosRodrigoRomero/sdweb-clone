import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { InformesComponent } from './informes/informes.component';
import { ClientesComponent } from './clientes.component';
import { PlantaEditComponent } from './planta-edit/planta-edit.component';
import { AutoLocComponent } from './auto-loc/auto-loc.component';

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
        path: 'informe-view',
        loadChildren: () => import('../informe-view/informe-view.module').then((m) => m.InformeViewModule),
      },
    ],
  },
];
// {
//   path: 'clientes',
//   component: ClienteslayoutComponent,
//   children: [
//     { path: '', component: LoginComponent },
//     {
//       path: 'informes',
//       component: InformesComponent,
//       canActivate: [AuthGuard],
//     },
//     // {
//     //   path: "informe-view/:id",
//     //   component: InformeViewComponent
//     //   // loadChildren: () =>
//     //   //   import("src/app/informe-view/informe-view.module").then(
//     //   //     m => m.InformeViewModule
//     //   //   )
//     // },
//     {
//       path: 'informe-edit/:id',
//       canActivate: [AuthGuard],
//       component: InformeEditComponent,
//     },

//     {
//       path: 'planta-add',
//       canActivate: [AuthGuard],
//       component: PlantaAddComponent,
//     },
//     {
//       path: 'planta-edit/:plantaId',
//       canActivate: [AuthGuard],
//       component: PlantaEditComponent,
//     },
//     {
//       path: 'informe-add/:plantaId',
//       canActivate: [AuthGuard],
//       component: InformeAddComponent,
//     },
//   ],
// },

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClientesRoutingModule {}
