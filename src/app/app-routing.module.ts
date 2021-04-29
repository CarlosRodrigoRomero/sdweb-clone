import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { NgModule } from '@angular/core';
import { AvisoLegalComponent } from './cts/aviso-legal/aviso-legal.component';
import { AuthGuard } from './core/services/auth.guard';

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
    path: 'shared',
    loadChildren: () => import('./shared-report/shared-report.module').then((m) => m.SharedReportModule),
  },
  {
    path: 'filterable-shared',
    loadChildren: () => import('./shared-report/shared-report.module').then((m) => m.SharedReportModule),
  },
  {
    path: 'clusters',
    loadChildren: () => import('./clusters/clusters.module').then((m) => m.ClustersModule),
  },
  {
    path: 'structures',
    loadChildren: () => import('./structures/structures.module').then((m) => m.StructuresModule),
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  providers: [],
  imports: [
    RouterModule.forRoot(routes, {
      preloadingStrategy: PreloadAllModules,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
