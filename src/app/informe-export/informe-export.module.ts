import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExportComponent } from './export/export.component';
import { SpinnerModule } from '../spinner/spinner.module';
import { FormsModule } from '@angular/forms';
import { ExportRoutingModule } from './export-routing.module';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';

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
    MatSortModule,
    ExportRoutingModule,
    MatButtonModule,
  ],
})
export class InformeExportModule {}
