import { Component, Inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { ClipboardService } from 'ngx-clipboard';

import { ShareReportService } from '@data/services/share-report.service';
import { ReportControlService } from '@data/services/report-control.service';
import { ParamsFilterShare } from '@core/models/paramsFilterShare';

@Component({
  selector: 'app-share-report-dialog',
  templateUrl: './share-report-dialog.component.html',
  styleUrls: ['./share-report-dialog.component.css'],
})
export class ShareReportDialogComponent {
  onlyFiltered = true;
  versionTecnicos = false;

  tipos: number[];

  constructor(
    private clipboardService: ClipboardService,
    private shareReportService: ShareReportService,
    private reportControlService: ReportControlService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data) {
      this.tipos = data.tipos;
    }
  }

  copyLink() {
    this.clipboardService.copy(this.getShareLink());

    this.openSnackBar();
  }

  private getShareLink(): string {
    // primero comprobamos si hemos recibido un filtro
    if (this.tipos) {
      const params: ParamsFilterShare = this.shareReportService.createRecommendedActionsParams(this.tipos);
      params.informeId = this.reportControlService.selectedInformeId;
      params.plantaId = this.reportControlService.plantaId;
      params.fechaCreacion = this.shareReportService.getCreateDate();
      this.shareReportService.saveParams(params);
    } else {
      this.shareReportService.setSelectedInformeId(this.reportControlService.selectedInformeId);
      this.shareReportService.setCreatedDate();
      this.shareReportService.saveParams();
    }

    // luego recibimos el ID donde se han guardado
    const id = this.shareReportService.getParamsDbId();

    let sharedType: string;
    if (this.versionTecnicos) {
      if (this.reportControlService.plantaFija) {
        sharedType = '/comments-fixed-shared/';
      } else {
        sharedType = '/comments-tracker-shared/';
      }
    } else {
      if (this.reportControlService.plantaFija) {
        sharedType = '/fixed-filterable-shared/';
        if (this.onlyFiltered) {
          sharedType = '/fixed-shared/';
        }
      } else {
        sharedType = '/tracker-filterable-shared/';
        if (this.onlyFiltered) {
          sharedType = '/tracker-shared/';
        }
      }
    }

    const currentUrl = this.reportControlService.getHostname();

    let url;
    if (currentUrl !== 'localhost') {
      url = 'https://' + currentUrl + sharedType + id;
    } else {
      // añadimos el puerto
      url = currentUrl + ':4200' + sharedType + id;
    }

    return url;
  }

  openSnackBar() {
    this.snackBar.open('Enlace copiado', 'OK', {
      duration: 2000,
    });
  }
}
