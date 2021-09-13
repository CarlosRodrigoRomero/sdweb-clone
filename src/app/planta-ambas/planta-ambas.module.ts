import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '@shared/shared.module';

import { GlobalCoordAreasComponent } from './components/global-coord-areas/global-coord-areas.component';
import { DownloadPdfComponent } from './components/download-pdf/download-pdf.component';

@NgModule({
  declarations: [GlobalCoordAreasComponent, DownloadPdfComponent],
  imports: [CommonModule, SharedModule],
  exports: [GlobalCoordAreasComponent, DownloadPdfComponent],
})
export class PlantaAmbasModule {}
