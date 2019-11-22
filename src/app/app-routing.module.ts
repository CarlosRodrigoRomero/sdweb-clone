import { Routes, RouterModule, PreloadAllModules } from "@angular/router";
import { InformeViewComponent } from "./informe-view/informe-view.component";
import { InformeEditComponent } from "./cts/informe-edit/informe-edit.component";
import { InformesComponent } from "./cts/informes/informes.component";
import { NgModule } from "@angular/core";
import { LoginComponent } from "./cts/login/login.component";
import { AuthGuard } from "./services/auth.guard";
import { IndexComponent } from "./cts/index/index.component";
import { ClienteslayoutComponent } from "./layout/clienteslayout/clienteslayout.component";
import { PubliclayoutComponent } from "./layout/publiclayout/publiclayout.component";
// import { VideoComponent } from "./cts/video/video.component";
import { AutoLocComponent } from "./cts/auto-loc/auto-loc.component";
import { PlantaAddComponent } from "./cts/planta-add/planta-add.component";
import { InformeAddComponent } from "./cts/informe-add/informe-add.component";
import { PlantaEditComponent } from "./cts/planta-edit/planta-edit.component";
import { InformeOverviewComponent } from "./informe-view/overview/informe-overview.component";
import { InformeMapModule } from "./informe-map/informe-map.module";
import { InformeExportModule } from "./informe-export/informe-export.module";
import { InformeListModule } from "./informe-view/list/pc-list/informe-list.module";

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
      {
        path: "informe-view/:id",
        component: InformeViewComponent,
        canActivate: [AuthGuard],
        children: [
          {
            path: "",
            pathMatch: "full",
            redirectTo: "informe-overview",
            canActivate: [AuthGuard]
          },
          {
            path: "informe-overview",
            component: InformeOverviewComponent,
            canActivate: [AuthGuard]
          },
          {
            path: "informe-map",
            data: { preload: true },
            loadChildren: () => InformeMapModule,
            canActivate: [AuthGuard]
          },
          {
            path: "informe-export",
            data: { preload: false },
            loadChildren: () => InformeExportModule,
            canActivate: [AuthGuard]
          },
          {
            path: "informe-list",
            data: { preload: false },
            loadChildren: () => InformeListModule,
            canActivate: [AuthGuard]
          }
        ]
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
        path: "planta-add",
        component: PlantaAddComponent,
        canActivate: [AuthGuard]
      },
      {
        path: "planta-edit/:plantaId",
        component: PlantaEditComponent,
        canActivate: [AuthGuard]
      },
      {
        path: "informe-add/:plantaId",
        component: InformeAddComponent,
        canActivate: [AuthGuard]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
