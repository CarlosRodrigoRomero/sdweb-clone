import { Routes, RouterModule } from '@angular/router';
import { InformeViewComponent } from './cts/informe-view/informe-view.component';
import { InformeEditComponent } from './cts/informe-edit/informe-edit.component';
import { InformesComponent } from './cts/informes/informes.component';
import { NgModule } from '@angular/core';
import { OrtophotoComponent } from './cts/ortophoto/ortophoto.component';
import { LoginComponent } from './cts/login/login.component';
import { AuthGuard } from './services/auth.guard';
import { IndexComponent } from './cts/index/index.component';

const routes: Routes = [
  {path: '', component: LoginComponent},
  {path: 'informe-view/:id', component: InformeViewComponent, canActivate: [AuthGuard]},
  {path: 'informe-edit/:id', component: InformeEditComponent},
  {path: 'informes', component: InformesComponent, canActivate: [AuthGuard]},
  // {path: 'orto', component: OrtophotoComponent },
  {path: 'login', component: LoginComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
