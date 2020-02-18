import { Routes, RouterModule, PreloadAllModules } from "@angular/router";
import { InformeEditComponent } from "./cts/informe-edit/informe-edit.component";
import { InformesComponent } from "./cts/informes/informes.component";
import { NgModule } from "@angular/core";
import { LoginComponent } from "./cts/login/login.component";
import { AuthGuard } from "./services/auth.guard";
import { IndexComponent } from "./cts/index/index.component";
import { ClienteslayoutComponent } from "./layout/clienteslayout/clienteslayout.component";
// import { PubliclayoutComponent } from "./layout/publiclayout/publiclayout.component";
// import { VideoComponent } from "./cts/video/video.component";
import { AutoLocComponent } from "./cts/auto-loc/auto-loc.component";
import { PlantaAddComponent } from "./cts/planta-add/planta-add.component";
import { InformeAddComponent } from "./cts/informe-add/informe-add.component";
import { PlantaEditComponent } from "./cts/planta-edit/planta-edit.component";

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
  // { path: "**", component: IndexComponent, pathMatch: "full" },
  { path: "", component: IndexComponent },

  {
    path: "clientes",
    component: ClienteslayoutComponent,
    children: [
      { path: "", component: LoginComponent },
      {
        path: "informes",
        component: InformesComponent,
        canActivate: [AuthGuard]
      },
      // {
      //   path: "informe-view/:id",
      //   component: InformeViewComponent
      //   // loadChildren: () =>
      //   //   import("src/app/informe-view/informe-view.module").then(
      //   //     m => m.InformeViewModule
      //   //   )
      // },
      {
        path: "informe-edit/:id",
        canActivate: [AuthGuard],
        component: InformeEditComponent
      },
      {
        path: "auto-loc/:id",
        canActivate: [AuthGuard],
        component: AutoLocComponent
      },

      {
        path: "planta-add",
        canActivate: [AuthGuard],
        component: PlantaAddComponent
      },
      {
        path: "planta-edit/:plantaId",
        canActivate: [AuthGuard],
        component: PlantaEditComponent
      },
      {
        path: "informe-add/:plantaId",
        canActivate: [AuthGuard],
        component: InformeAddComponent
      }
    ]
  }
  // { path: "**", redirectTo: "" }
];

@NgModule({
  providers: [PreloadAllModules],
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
