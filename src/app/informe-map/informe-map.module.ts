import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MapComponent } from "./map/map.component";
import { AgmCoreModule } from "@agm/core";
import { PcDetailsDialogComponent } from "src/app/cts/pc-details-dialog/pc-details-dialog.component";
import { FormsModule } from "@angular/forms";
import { MatDialogModule, MatSliderModule } from "@angular/material";
import { MapRoutingModule } from "./map-routing.module";
import { SpinnerModule } from "../spinner/spinner.module";

@NgModule({
  declarations: [MapComponent, PcDetailsDialogComponent],
  entryComponents: [PcDetailsDialogComponent],
  imports: [
    SpinnerModule,
    MatDialogModule,
    FormsModule,
    MatSliderModule,
    MapRoutingModule,
    AgmCoreModule.forRoot({
      apiKey: "AIzaSyAD8uljEDpNHrLWi2e7HYzAE207Q4uyHIM",
      libraries: ["drawing"]
    }),
    CommonModule
  ]
})
export class InformeMapModule {}
