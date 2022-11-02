import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '@shared/shared.module';

import { GlobalCoordAreasComponent } from './components/global-coord-areas/global-coord-areas.component';
import { ProgressBarPdfComponent } from './components/download-progress-bar/download-progress-bar.component';
import { DownloadReportComponent } from './components/download-report/download-report.component';
import { DialogFilteredReportComponent } from './components/dialog-filtered-report/dialog-filtered-report.component';
import { ShareReportComponent } from './components/share-report/share-report.component';
import { SelectLanguageComponent } from './components/select-language/select-language.component';
import { DownloadExcelComponent } from './components/download-excel/download-excel.component';
import { ZonesComponent } from './components/zones/zones.component';
import { SliderTemporalComponent } from './components/slider-temporal/slider-temporal.component';
import { ViewControlComponent } from './components/view-control/view-control.component';
import { ViewToggleComponent } from './components/view-toggle/view-toggle.component';
import { LeyendaComponent } from './components/leyenda/leyenda.component';
import { CommentsComponent } from './components/comments/comments.component';
import { CommentComponent } from './components/comment/comment.component';
import { PdfComponent } from './components/pdf/pdf.component';
import { PdfDialogComponent } from './components/pdf-dialog/pdf-dialog.component';
import { PdfEmailSelectComponent } from './components/pdf-email-select/pdf-email-select.component';
import { SimplifiedViewComponent } from './components/simplified-view/simplified-view.component';

@NgModule({
  declarations: [
    GlobalCoordAreasComponent,
    ProgressBarPdfComponent,
    DownloadReportComponent,
    DialogFilteredReportComponent,
    ShareReportComponent,
    SelectLanguageComponent,
    DownloadExcelComponent,
    ZonesComponent,
    SliderTemporalComponent,
    ViewControlComponent,
    ViewToggleComponent,
    LeyendaComponent,
    CommentsComponent,
    CommentComponent,
    PdfComponent,
    PdfDialogComponent,
    PdfEmailSelectComponent,
    SimplifiedViewComponent,
  ],
  imports: [CommonModule, SharedModule],
  exports: [
    GlobalCoordAreasComponent,
    DownloadReportComponent,
    ProgressBarPdfComponent,
    ShareReportComponent,
    DownloadExcelComponent,
    ZonesComponent,
    SliderTemporalComponent,
    ViewControlComponent,
    ViewToggleComponent,
    LeyendaComponent,
    CommentsComponent,
    SimplifiedViewComponent,
  ],
})
export class SharedPlantsModule {}
