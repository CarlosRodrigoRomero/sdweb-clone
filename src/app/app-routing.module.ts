import { Routes, RouterModule } from "@angular/router";
import { InformeViewComponent } from "./cts/informe-view/informe-view.component";
import { InformeEditComponent } from "./cts/informe-edit/informe-edit.component";
import { InformesComponent } from "./cts/informes/informes.component";
import { NgModule } from "@angular/core";
import { LoginComponent } from "./cts/login/login.component";
import { AuthGuard } from "./services/auth.guard";
import { IndexComponent } from "./cts/index/index.component";
import { ClienteslayoutComponent } from "./layout/clienteslayout/clienteslayout.component";
import { PubliclayoutComponent } from "./layout/publiclayout/publiclayout.component";
import { VideoComponent } from "./cts/video/video.component";
import { PruebasComponent } from "./cts/pruebas/pruebas.component";
import { AutoLocComponent } from "./cts/auto-loc/auto-loc.component";

const routes: Routes = [
  {
    path: "",
    component: PubliclayoutComponent,
    children: [
      { path: "", component: IndexComponent, pathMatch: "full" },
      {
        path: "manuelprodiel",
        component: VideoComponent,
        data: { nombre: "Manuel Antonio Romero", codigo: "5lkuxrnj7w" }
      },
      {
        path: "juanforestalia",
        component: VideoComponent,
        data: { nombre: "Juan J. De Lama", codigo: "wwmnaco1f3" }
      },
      {
        path: "juanjosevalsolar",
        component: VideoComponent,
        data: { nombre: "Juan José Montesinos", codigo: "p4g1rk4ew5" }
      },
      {
        path: "miguelangelsolaria",
        component: VideoComponent,
        data: { nombre: "Miguel A. Martí", codigo: "smiu0y3lql" }
      },
      {
        path: "miguelacciona",
        component: VideoComponent,
        data: { nombre: "Miguel de Antonio Unanua", codigo: "smiu0y3lql" }
      },
      {
        path: "juanantonioenel",
        component: VideoComponent,
        data: { nombre: "Juan Antonio Tesón", codigo: "od2t4ok22h" }
      },
      {
        path: "ivangpg",
        component: VideoComponent,
        data: { nombre: "Iván Villamarzo", codigo: "rzuivumzbk" }
      },
      {
        path: "robertoxelio",
        component: VideoComponent,
        data: { nombre: "Roberto R.", codigo: "idaenwgz0x" }
      },
      {
        path: "paulaopde",
        component: VideoComponent,
        data: { nombre: "Paula Renedo", codigo: "surb5xh9q1" }
      }
    ]
  },
  {
    path: "",
    component: ClienteslayoutComponent,
    children: [
      {
        path: "informe-view/:id",
        component: InformeViewComponent,
        canActivate: [AuthGuard]
      },
      {
        path: "informe-edit/:id",
        component: InformeEditComponent,
        canActivate: [AuthGuard]
      },
      {
        path: "auto-loc/:id",
        component: AutoLocComponent,
        canActivate: [AuthGuard]
      },
      {
        path: "informes",
        component: InformesComponent,
        canActivate: [AuthGuard]
      },
      { path: "clientes", component: LoginComponent }
    ]
  },
  { path: "**", component: IndexComponent, pathMatch: "full" }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
