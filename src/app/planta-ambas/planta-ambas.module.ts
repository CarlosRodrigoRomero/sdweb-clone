import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '@shared/shared.module';

import { GlobalCoordAreasComponent } from './components/global-coord-areas/global-coord-areas.component';
import { DownloadPdfComponent } from './components/download-pdf/download-pdf.component';
import { ProgressBarPdfComponent } from './components/progress-bar-pdf/progress-bar-pdf.component';

@NgModule({
  declarations: [GlobalCoordAreasComponent, DownloadPdfComponent, ProgressBarPdfComponent],
  imports: [CommonModule, SharedModule],
  exports: [GlobalCoordAreasComponent, DownloadPdfComponent, ProgressBarPdfComponent],
})
export class PlantaAmbasModule {}
