import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { NgModule } from '@angular/core';

import { AuthGuard } from '@core/services/auth.guard';

import { AvisoLegalComponent } from '@shared/components/aviso-legal/aviso-legal.component';

export const routes: Routes = [
  { path: '', redirectTo: 'clients', pathMatch: 'full' },
  { path: 'aviso-legal', component: AvisoLegalComponent },
  { path: 'auth', loadChildren: () => import('./auth/auth.module').then((m) => m.AuthenticationModule) },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then((m) => m.AdminModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'clients',
    loadChildren: () => import('./clients/clients.module').then((m) => m.ClientsModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'clientes',
    loadChildren: () => import('./clientes/clientes.module').then((m) => m.ClientesModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'fixed-shared',
    loadChildren: () => import('./planta-fija/planta-fija.module').then((m) => m.PlantaFijaModule),
  },
  {
    path: 'fixed-filterable-shared',
    loadChildren: () => import('./planta-fija/planta-fija.module').then((m) => m.PlantaFijaModule),
  },
  {
    path: 'tracker-shared',
    loadChildren: () => import('./planta-seguidores/planta-seguidores.module').then((m) => m.PlantaSeguidoresModule),
  },
  {
    path: 'tracker-filterable-shared',
    loadChildren: () => import('./planta-seguidores/planta-seguidores.module').then((m) => m.PlantaSeguidoresModule),
  },
  {
    path: 'clusters',
    loadChildren: () => import('./clusters/clusters.module').then((m) => m.ClustersModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'structures',
    loadChildren: () => import('./structures/structures.module').then((m) => m.StructuresModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'classification',
    loadChildren: () => import('./classification/classification.module').then((m) => m.ClassificationModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'autogeo',
    loadChildren: () => import('./autogeo/autogeo.module').then((m) => m.AutogeoModule),
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
