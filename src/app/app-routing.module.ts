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

const routes: Routes = [
  {
    path: '',
    component: PubliclayoutComponent,
    children: [
      { path: '', component: IndexComponent, pathMatch: 'full'},
    ]
  },
  {
    path: '',
    component: ClienteslayoutComponent,
    children: [
      {path: 'informe-view/:id', component: InformeViewComponent, canActivate: [AuthGuard]},
      // {path: 'informe-edit/:id', component: InformeEditComponent, canActivate: [AuthGuard]},
      {path: 'informes', component: InformesComponent, canActivate: [AuthGuard]},
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
