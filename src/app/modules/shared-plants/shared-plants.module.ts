import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '@shared/shared.module';

import { ZonesSelectorComponent } from './components/zones-selector/zones-selector.component';
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
import { GroupByZonesViewComponent } from './components/group-by-zones-view/group-by-zones-view.component';
import { LeyendaContainerComponent } from './containers/leyenda-container/leyenda-container.component';
import { ZonesSelectorContainerComponent } from './containers/zones-selector-container/zones-selector-container.component';

@NgModule({
  declarations: [
    ZonesSelectorComponent,
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
    GroupByZonesViewComponent,
    LeyendaContainerComponent,
    ZonesSelectorContainerComponent,
  ],
  imports: [CommonModule, SharedModule],
  exports: [
    ZonesSelectorContainerComponent,
    DownloadReportComponent,
    ProgressBarPdfComponent,
    ShareReportComponent,
    DownloadExcelComponent,
    ZonesComponent,
    SliderTemporalComponent,
    ViewControlComponent,
    ViewToggleComponent,
    CommentsComponent,
    GroupByZonesViewComponent,
    LeyendaContainerComponent,
  ],
})
export class SharedPlantsModule {}
