import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { NgModule } from '@angular/core';

import { AuthGuard } from '@core/guards/auth.guard';

import { AvisoLegalComponent } from '@shared/components/aviso-legal/aviso-legal.component';

export const routes: Routes = [
  { path: '', redirectTo: 'clients', pathMatch: 'full' },
  { path: 'aviso-legal', component: AvisoLegalComponent },
  { path: 'auth', loadChildren: () => import('@modules/auth/auth.module').then((m) => m.AuthenticationModule) },
  {
    path: 'admin',
    loadChildren: () => import('@modules/admin/admin.module').then((m) => m.AdminModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'clients',
    loadChildren: () => import('@modules/clients/clients.module').then((m) => m.ClientsModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'clientes',
    loadChildren: () => import('@modules/old-web/clientes/clientes.module').then((m) => m.ClientesModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'fixed-shared',
    loadChildren: () => import('@modules/fixed-plant/fixed-plant.module').then((m) => m.FixedPlantModule),
  },
  {
    path: 'fixed-filterable-shared',
    loadChildren: () => import('@modules/fixed-plant/fixed-plant.module').then((m) => m.FixedPlantModule),
  },
  {
    path: 'tracker-shared',
    loadChildren: () => import('@modules/tracker-plant/tracker-plant.module').then((m) => m.TrackerPlantModule),
  },
  {
    path: 'tracker-filterable-shared',
    loadChildren: () => import('@modules/tracker-plant/tracker-plant.module').then((m) => m.TrackerPlantModule),
  },
  {
    path: 'clusters',
    loadChildren: () => import('@modules/clusters/clusters.module').then((m) => m.ClustersModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'structures',
    loadChildren: () => import('@modules/structures/structures.module').then((m) => m.StructuresModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'classification',
    loadChildren: () => import('@modules/classification/classification.module').then((m) => m.ClassificationModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'autogeo',
    loadChildren: () => import('@modules/autogeo/autogeo.module').then((m) => m.AutogeoModule),
    canActivate: [AuthGuard],
  },
  { path: '**', redirectTo: 'clients', pathMatch: 'full' },
];

@NgModule({
  providers: [],
  imports: [
    RouterModule.forRoot(routes, {
      preloadingStrategy: PreloadAllModules,
      relativeLinkResolution: 'legacy',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
