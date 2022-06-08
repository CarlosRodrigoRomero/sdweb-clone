import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '@shared/shared.module';

import { GlobalCoordAreasComponent } from './components/global-coord-areas/global-coord-areas.component';
import { DownloadPdfComponent } from './components/download-pdf/download-pdf.component';
import { ProgressBarPdfComponent } from './components/download-progress-bar/download-progress-bar.component';
import { DownloadReportComponent } from './components/download-report/download-report.component';
import { DialogFilteredReportComponent } from './components/dialog-filtered-report/dialog-filtered-report.component';
import { ShareReportComponent } from './components/share-report/share-report.component';
import { SelectLanguageComponent } from './components/select-language/select-language.component';
import { DownloadExcelComponent } from './components/download-excel/download-excel.component';
import { ZonesComponent } from './components/zones/zones.component';

@NgModule({
  declarations: [
    GlobalCoordAreasComponent,
    DownloadPdfComponent,
    ProgressBarPdfComponent,
    DownloadReportComponent,
    DialogFilteredReportComponent,
    ShareReportComponent,
    SelectLanguageComponent,
    DownloadExcelComponent,
    ZonesComponent,
  ],
  imports: [CommonModule, SharedModule],
  exports: [
    GlobalCoordAreasComponent,
    DownloadReportComponent,
    ProgressBarPdfComponent,
    ShareReportComponent,
    DownloadExcelComponent,
    ZonesComponent,
  ],
})
export class SharedPlantsModule {}
