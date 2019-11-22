import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import {
  MatTableModule,
  MatIconModule,
  MatPaginatorModule,
  MatInputModule,
  MatButtonModule,
  MatCheckboxModule
} from "@angular/material";
import { PcListComponent } from "./pc-list.component";
import { PcDetailsComponent } from "../pc-details/pc-details.component";
import { ListRoutingModule } from "./list-routing.module";
import { FormsModule } from "@angular/forms";
import {
  MatFormFieldModule,
  MatCardModule,
  MatSliderModule
} from "@angular/material";
import { SpinnerModule } from "../../../spinner/spinner.module";
import { PcFilterComponent } from "src/app/cts/pc-filter/pc-filter.component";

@NgModule({
  declarations: [PcListComponent, PcDetailsComponent],
  exports: [PcListComponent, PcDetailsComponent],
  imports: [
    CommonModule,
    MatTableModule,
    ListRoutingModule,
    FormsModule,
    MatIconModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatCardModule,
    SpinnerModule,
    MatInputModule,
    MatButtonModule
  ]
})
export class InformeListModule {}
