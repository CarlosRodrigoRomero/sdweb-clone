import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { InformeViewRoutingModule } from "./informe-view-routing.module";
import { InformeExportModule } from "../informe-export/informe-export.module";
import { InformeListModule } from "./list/pc-list/informe-list.module";
import { InformeOverviewComponent } from "./overview/informe-overview.component";
import { ExplicacionCoaComponent } from "./explicacion-coa/explicacion-coa.component";
import { GetNumeroModulosPipe } from "../pipes/get-numero-modulos.pipe";
import { GetNombreSeguidorPipe } from "../pipes/get-nombre-seguidor.pipe";
import { PcFilterComponent } from "./pc-filter/pc-filter.component";
import { ChartModule } from "primeng/chart";
import { AgmCoreModule } from "@agm/core";
import { FormsModule } from "@angular/forms";
import { InformeViewComponent } from "./informe-view.component";
import { SpinnerModule } from "../spinner/spinner.module";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDialogModule } from "@angular/material/dialog";
import { MatSliderModule } from "@angular/material/slider";
import { RouteReuseStrategy } from "@angular/router";
import { CustomReuseStrategy } from "./routeReuse";
import { PcDetailsDialogComponent } from "./pc-details-dialog/pc-details-dialog.component";
import { InformeMapModule } from "../informe-map/informe-map.module";
import { NavbarModule } from "../layout/navbar/navbar.module";

@NgModule({
  declarations: [
    InformeOverviewComponent,
    InformeViewComponent,
    PcFilterComponent,
    ExplicacionCoaComponent,
    PcDetailsDialogComponent,
    GetNumeroModulosPipe,
    GetNombreSeguidorPipe
  ],
  entryComponents: [ExplicacionCoaComponent, PcDetailsDialogComponent],
  providers: [{ provide: RouteReuseStrategy, useClass: CustomReuseStrategy }],
  imports: [
    CommonModule,
    InformeViewRoutingModule,
    InformeExportModule,
    InformeListModule,
    ChartModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    FormsModule,
    MatSliderModule,
    MatCheckboxModule,
    SpinnerModule,
    InformeMapModule,
    NavbarModule,
    AgmCoreModule.forRoot({
      apiKey: "AIzaSyAD8uljEDpNHrLWi2e7HYzAE207Q4uyHIM",
      libraries: ["drawing"]
    })
  ]
})
export class InformeViewModule {}
