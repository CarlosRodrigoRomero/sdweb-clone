import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import {
  MatTableModule,
  MatIconModule,
  MatPaginatorModule,
  MatInputModule,
  MatButtonModule,
  MatSortModule
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
    MatButtonModule,
    MatSliderModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule
  ]
})
export class InformeListModule {}
