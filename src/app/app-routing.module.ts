import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';

import { AuthGuard } from '@core/guards/auth.guard';

import { SelectivePreloadingStrategyService } from '@data/services/selective-preloading-strategy.service';

import { AvisoLegalComponent } from '@shared/components/aviso-legal/aviso-legal.component';

import { NavComponent } from '@layout/components/nav/nav.component';
import { SimpleBackgroundComponent } from '@layout/components/simple-background/simple-background.component';

export const routes: Routes = [
  { path: '', redirectTo: 'clients', pathMatch: 'full' },
  { path: 'aviso-legal', component: AvisoLegalComponent },
  {
    path: 'auth',
    component: SimpleBackgroundComponent,
    loadChildren: () => import('@modules/auth/auth.module').then((m) => m.AuthenticationModule),
    data: { preload: true },
  },
  {
    path: 'admin',
    loadChildren: () => import('@modules/admin/admin.module').then((m) => m.AdminModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'clients',
    component: NavComponent,
    loadChildren: () => import('@modules/clients/clients.module').then((m) => m.ClientsModule),
    canActivate: [AuthGuard],
    data: { preload: true },
  },
  {
    path: 'clientes',
    component: NavComponent,
    loadChildren: () => import('@modules/old-web/clientes/clientes.module').then((m) => m.ClientesModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'fixed-shared',
    component: NavComponent,
    loadChildren: () => import('@modules/reports/reports.module').then((m) => m.ReportsModule),
  },
  {
    path: 'fixed-filterable-shared',
    component: NavComponent,
    loadChildren: () => import('@modules/reports/reports.module').then((m) => m.ReportsModule),
  },
  {
    path: 'tracker-shared',
    component: NavComponent,
    loadChildren: () => import('@modules/tracker-plant/tracker-plant.module').then((m) => m.TrackerPlantModule),
  },
  {
    path: 'tracker-filterable-shared',
    component: NavComponent,
    loadChildren: () => import('@modules/tracker-plant/tracker-plant.module').then((m) => m.TrackerPlantModule),
  },
  {
    path: 'comments-fixed-shared',
    component: NavComponent,
    loadChildren: () => import('@modules/comments/comments.module').then((m) => m.CommentsModule),
  },
  {
    path: 'comments-tracker-shared',
    component: NavComponent,
    loadChildren: () => import('@modules/comments/comments.module').then((m) => m.CommentsModule),
  },
  {
    path: 'clusters',
    component: NavComponent,
    loadChildren: () => import('@modules/clusters/clusters.module').then((m) => m.ClustersModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'structures',
    component: NavComponent,
    loadChildren: () => import('@modules/structures/structures.module').then((m) => m.StructuresModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'classification',
    component: NavComponent,
    loadChildren: () => import('@modules/classification/classification.module').then((m) => m.ClassificationModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'autogeo',
    component: NavComponent,
    loadChildren: () => import('@modules/autogeo/autogeo.module').then((m) => m.AutogeoModule),
    canActivate: [AuthGuard],
  },
  { path: '**', redirectTo: 'clients', pathMatch: 'full' },
];

@NgModule({
  providers: [],
  imports: [
    RouterModule.forRoot(routes, {
      relativeLinkResolution: 'legacy',
      preloadingStrategy: SelectivePreloadingStrategyService,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
