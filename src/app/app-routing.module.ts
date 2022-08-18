import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { NgModule } from '@angular/core';

import { AuthGuard } from '@core/guards/auth.guard';

import { AvisoLegalComponent } from '@shared/components/aviso-legal/aviso-legal.component';
import { SkeletonComponent } from '@layout/skeleton/skeleton.component';

export const routes: Routes = [
  { path: '', redirectTo: 'clients', pathMatch: 'full' },
  { path: 'aviso-legal', component: AvisoLegalComponent },
  {
    path: 'auth',
    loadChildren: () => import('@modules/auth/auth.module').then((m) => m.AuthenticationModule),
  },
  {
    path: 'admin',
    loadChildren: () => import('@modules/admin/admin.module').then((m) => m.AdminModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'clients',
    component: SkeletonComponent,
    loadChildren: () => import('@modules/clients/clients.module').then((m) => m.ClientsModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'clientes',
    component: SkeletonComponent,
    loadChildren: () => import('@modules/old-web/clientes/clientes.module').then((m) => m.ClientesModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'fixed-shared',
    component: SkeletonComponent,
    loadChildren: () => import('@modules/fixed-plant/fixed-plant.module').then((m) => m.FixedPlantModule),
  },
  {
    path: 'fixed-filterable-shared',
    component: SkeletonComponent,
    loadChildren: () => import('@modules/fixed-plant/fixed-plant.module').then((m) => m.FixedPlantModule),
  },
  {
    path: 'tracker-shared',
    component: SkeletonComponent,
    loadChildren: () => import('@modules/tracker-plant/tracker-plant.module').then((m) => m.TrackerPlantModule),
  },
  {
    path: 'tracker-filterable-shared',
    component: SkeletonComponent,
    loadChildren: () => import('@modules/tracker-plant/tracker-plant.module').then((m) => m.TrackerPlantModule),
  },
  {
    path: 'comments-fixed-shared',
    component: SkeletonComponent,
    loadChildren: () => import('@modules/comments/comments.module').then((m) => m.CommentsModule),
  },
  {
    path: 'comments-tracker-shared',
    component: SkeletonComponent,
    loadChildren: () => import('@modules/comments/comments.module').then((m) => m.CommentsModule),
  },
  {
    path: 'clusters',
    component: SkeletonComponent,
    loadChildren: () => import('@modules/clusters/clusters.module').then((m) => m.ClustersModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'structures',
    component: SkeletonComponent,
    loadChildren: () => import('@modules/structures/structures.module').then((m) => m.StructuresModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'classification',
    component: SkeletonComponent,
    loadChildren: () => import('@modules/classification/classification.module').then((m) => m.ClassificationModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'autogeo',
    component: SkeletonComponent,
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
