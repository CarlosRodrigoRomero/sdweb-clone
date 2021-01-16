import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { NgModule } from '@angular/core';
import { AuthGuard } from '@core/services/auth.guard';
// import { PubliclayoutComponent } from "./layout/publiclayout/publiclayout.component";
// import { VideoComponent } from "./cts/video/video.component";
import { AvisoLegalComponent } from './cts/aviso-legal/aviso-legal.component';
import { VideoComponent } from './cts/video/video.component';
import { PubliclayoutComponent } from './publiclayout/publiclayout.component';

export const routes: Routes = [
  { path: '', loadChildren: () => import('./auth/auth.module').then((m) => m.AuthenticationModule) },
  { path: 'aviso-legal', component: AvisoLegalComponent },
  // { path: 'login', component: LoginComponent },
  { path: 'auth', loadChildren: () => import('./auth/auth.module').then((m) => m.AuthenticationModule) },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then((m) => m.AdminModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'clientes',
    loadChildren: () => import('./clientes/clientes.module').then((m) => m.ClientesModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'v',
    component: PubliclayoutComponent,
    children: [
      {
        path: 'davidignis',
        component: VideoComponent,
        data: { nombre: 'David Parra', codigo: 'd0ekj87q0d' },
      },
    ],
  },

  // // { path: "**", redirectTo: "" }
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
