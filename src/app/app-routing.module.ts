import { Routes, RouterModule } from '@angular/router';
import { InformeViewComponent } from './cts/informe-view/informe-view.component';
import { InformeEditComponent } from './cts/informe-edit/informe-edit.component';
import { InformesComponent } from './cts/informes/informes.component';
import { NgModule } from '@angular/core';
import { OrtophotoComponent } from './cts/ortophoto/ortophoto.component';
import { LoginComponent } from './cts/login/login.component';
import { AuthGuard } from './services/auth.guard';
import { IndexComponent } from './cts/index/index.component';
import { ClienteslayoutComponent } from './layout/clienteslayout/clienteslayout.component';
import { PubliclayoutComponent } from './layout/publiclayout/publiclayout.component';
import { VideoComponent } from './cts/video/video.component';
import { PruebasComponent } from './cts/pruebas/pruebas.component';

const routes: Routes = [
  {
    path: '',
    component: PubliclayoutComponent,
    children: [
      { path: '', component: IndexComponent, pathMatch: 'full'},
      { path: 'pdf123', component: PruebasComponent},
      { path: 'juangil', component: VideoComponent, data: { nombre: 'Juan Gil', codigo: 'nfs0lkgmy4'} },
      { path: 'joseignacio', component: VideoComponent, data: { nombre: 'Jose Ignacio', codigo: 'dcxxa99ktf'} },
      { path: 'emilio', component: VideoComponent, data: { nombre: 'Emilio', codigo: '7uwh1qgbhw'} },
      { path: 'mauro', component: VideoComponent, data: { nombre: 'Mauro', codigo: 'dwkvnromp5'} },
      { path: 'xabier', component: VideoComponent, data: { nombre: 'Xabier Real', codigo: 'h5khtjk8oq'} }
    ]
  },
  {
    path: '',
    component: ClienteslayoutComponent
    ,
    children: [
      {path: 'informe-view/:id', component: InformeViewComponent, canActivate: [AuthGuard]},
      // {path: 'informe-edit/:id', component: InformeEditComponent, canActivate: [AuthGuard]},
      { path: 'informes', component: InformesComponent, canActivate: [AuthGuard] },
      { path: 'clientes', component: LoginComponent },
    ]
  },
  { path: '**', component: IndexComponent, pathMatch: 'full' }
  // {path: 'orto', component: OrtophotoComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
