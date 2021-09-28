import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '@shared/shared.module';

import { GlobalCoordAreasComponent } from './components/global-coord-areas/global-coord-areas.component';
import { DownloadPdfComponent } from './components/download-pdf/download-pdf.component';
import { ProgressBarPdfComponent } from './components/progress-bar-pdf/progress-bar-pdf.component';
import { DownloadReportComponent } from './components/download-report/download-report.component';
import { DialogFilteredReportComponent } from './components/dialog-filtered-report/dialog-filtered-report.component';
import { DownloadExcelComponent } from './components/download-excel/download-excel.component';

@NgModule({
  declarations: [
    GlobalCoordAreasComponent,
    DownloadPdfComponent,
    ProgressBarPdfComponent,
    DownloadReportComponent,
    DialogFilteredReportComponent,
    DownloadExcelComponent,
  ],
  imports: [CommonModule, SharedModule ],
  exports: [GlobalCoordAreasComponent, DownloadReportComponent, ProgressBarPdfComponent],
})
export class PlantaAmbasModule {}
