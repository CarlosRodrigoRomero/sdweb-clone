import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ExportComponent } from "./export/export.component";
import { SpinnerModule } from "../spinner/spinner.module";
import { FormsModule } from "@angular/forms";
import { ExportRoutingModule } from "./export-routing.module";
import {
  MatTableModule,
  MatCardModule,
  MatCheckboxModule,
  MatButtonToggleModule,
  MatButtonModule
} from "@angular/material";

@NgModule({
  declarations: [ExportComponent],
  imports: [
    CommonModule,
    SpinnerModule,
    MatCheckboxModule,
    MatButtonToggleModule,
    MatCardModule,
    MatTableModule,
    FormsModule,
    ExportRoutingModule,
    MatButtonModule
  ]
})
export class InformeExportModule {}
