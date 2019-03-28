import { Routes, RouterModule } from '@angular/router';
import { InformeViewComponent } from './cts/informe-view/informe-view.component';
import { InformeEditComponent } from './cts/informe-edit/informe-edit.component';
import { InformesComponent } from './cts/informes/informes.component';
import { NgModule } from '@angular/core';
import { OrtophotoComponent } from './cts/ortophoto/ortophoto.component';

const routes: Routes = [
  {path: '', component: InformesComponent},
  {path: 'informe-view/:id', component: InformeViewComponent},
  {path: 'informe-edit/:id', component: InformeEditComponent},
  {path: 'orto', component: OrtophotoComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
