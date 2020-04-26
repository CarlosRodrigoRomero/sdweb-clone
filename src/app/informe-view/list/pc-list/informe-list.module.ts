import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatSortModule } from "@angular/material/sort";
import { MatTableModule } from "@angular/material/table";
import { PcListComponent } from "./pc-list.component";
import { PcDetailsComponent } from "../pc-details/pc-details.component";
import { ListRoutingModule } from "./list-routing.module";
import { FormsModule } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSliderModule } from "@angular/material/slider";
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
