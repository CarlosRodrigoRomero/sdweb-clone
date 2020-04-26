import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { LoginComponent } from './cts/login/login.component';
import { AuthGuard } from './services/auth.guard';
import { IndexComponent } from './cts/index/index.component';
// import { PubliclayoutComponent } from "./layout/publiclayout/publiclayout.component";
// import { VideoComponent } from "./cts/video/video.component";
import { AvisoLegalComponent } from './cts/aviso-legal/aviso-legal.component';

const routes: Routes = [
  // {
  //   path: "",
  //   component: PubliclayoutComponent,
  //   children: [
  //     { path: "", component: IndexComponent }
  // {
  //   path: "manuelprodiel",
  //   component: VideoComponent,
  //   data: { nombre: "Manuel Antonio Romero", codigo: "5lkuxrnj7w" }
  // },
  // {
  //   path: "juanforestalia",
  //   component: VideoComponent,
  //   data: { nombre: "Juan J. De Lama", codigo: "wwmnaco1f3" }
  // },
  // {
  //   path: "juanjosevalsolar",
  //   component: VideoComponent,
  //   data: { nombre: "Juan José Montesinos", codigo: "p4g1rk4ew5" }
  // },
  // {
  //   path: "miguelangelsolaria",
  //   component: VideoComponent,
  //   data: { nombre: "Miguel A. Martí", codigo: "smiu0y3lql" }
  // },
  // {
  //   path: "miguelacciona",
  //   component: VideoComponent,
  //   data: { nombre: "Miguel de Antonio Unanua", codigo: "smiu0y3lql" }
  // },
  // {
  //   path: "juanantonioenel",
  //   component: VideoComponent,
  //   data: { nombre: "Juan Antonio Tesón", codigo: "od2t4ok22h" }
  // },
  // {
  //   path: "ivangpg",
  //   component: VideoComponent,
  //   data: { nombre: "Iván Villamarzo", codigo: "rzuivumzbk" }
  // },
  // {
  //   path: "robertoxelio",
  //   component: VideoComponent,
  //   data: { nombre: "Roberto R.", codigo: "idaenwgz0x" }
  // },
  // {
  //   path: "paulaopde",
  //   component: VideoComponent,
  //   data: { nombre: "Paula Renedo", codigo: "surb5xh9q1" }
  // }
  // ]
  // },
  { path: '', component: IndexComponent },
  { path: 'aviso-legal', component: AvisoLegalComponent },
  { path: 'login', component: LoginComponent },
  {
    path: 'clientes',
    loadChildren: () => import('./clientes/clientes.module').then((m) => m.ClientesModule),
    canActivate: [AuthGuard],
  },

  // // { path: "**", redirectTo: "" }
];

@NgModule({
  providers: [],
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
