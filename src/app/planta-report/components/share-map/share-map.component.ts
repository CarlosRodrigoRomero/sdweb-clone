import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { MatSnackBar } from '@angular/material/snack-bar';

import { ClipboardService } from 'ngx-clipboard';

import { Observable } from 'rxjs';

import { ShareReportService } from '@core/services/share-report.service';
import { ReportControlService } from '@core/services/report-control.service';

@Component({
  selector: 'app-share-map',
  templateUrl: './share-map.component.html',
  styleUrls: ['./share-map.component.css'],
})
export class ShareMapComponent implements OnInit {
  items: Observable<any[]>;
  public filterableCheck = false;
  private selectedInformeId: string;

  constructor(
    private shareReportService: ShareReportService,
    private clipboardService: ClipboardService,
    private snackBar: MatSnackBar,
    private router: Router,
    private reportControlService: ReportControlService
  ) {}

  ngOnInit(): void {
    // this.reportControlService.selectedInformeId$.subscribe((informeId) => (this.selectedInformeId = informeId));
  }

  getShareLink(): string {
    this.selectedInformeId = this.reportControlService.selectedInformeId;
    console.log(this.selectedInformeId);

    // primero guarda los params en la DB
    this.shareReportService.setSelectedInformeId(this.reportControlService.selectedInformeId);
    this.shareReportService.saveParams();

    // luego recibimos el ID donde se han guardado
    const id = this.shareReportService.getParamsDbId();

    let sharedType = '/shared/';
    if (this.filterableCheck) {
      sharedType = '/filterable-shared/';
    }

    const currentUrl = this.router.url.split('/');

    let url;
    if (currentUrl[0] !== '') {
      url = currentUrl[0] + sharedType + id;
    } else {
      url = 'localhost:4200' + sharedType + id;
    }

    return url;
  }

  copyLink() {
    this.clipboardService.copy(this.getShareLink());
    this.openSnackBar();
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
