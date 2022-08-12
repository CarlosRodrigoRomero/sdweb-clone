import { Component, ViewEncapsulation } from '@angular/core';

import { Observable } from 'rxjs';

import { MatSnackBar } from '@angular/material/snack-bar';

import { ClipboardService } from 'ngx-clipboard';

import { ShareReportService } from '@data/services/share-report.service';
import { ReportControlService } from '@data/services/report-control.service';

@Component({
  selector: 'app-share-report',
  templateUrl: './share-report.component.html',
  styleUrls: ['./share-report.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class ShareReportComponent {
  items: Observable<any[]>;
  onlyFiltered = false;
  versionTecnicos = false;

  constructor(
    private shareReportService: ShareReportService,
    private clipboardService: ClipboardService,
    private snackBar: MatSnackBar,
    private reportControlService: ReportControlService
  ) {}

  copyLink() {
    this.clipboardService.copy(this.getShareLink());

    this.openSnackBar();
  }

  private getShareLink(): string {
    // primero guarda los params en la DB
    this.shareReportService.setSelectedInformeId(this.reportControlService.selectedInformeId);
    this.shareReportService.saveParams();

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

  stopPropagation(event) {
    event.stopPropagation();
  }

  openSnackBar() {
    this.snackBar.open('Enlace copiado', 'OK', {
      duration: 2000,
    });
  }
}
