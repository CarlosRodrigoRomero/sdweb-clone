import { Component, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { Observable } from 'rxjs';

import { ShareReportDialogComponent } from '../share-report-dialog/share-report-dialog.component';

@Component({
  selector: 'app-share-report',
  templateUrl: './share-report.component.html',
  styleUrls: ['./share-report.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class ShareReportComponent {
  items: Observable<any[]>;
  onlyFiltered = true;
  versionTecnicos = false;

  constructor(public dialog: MatDialog) {}

  openDialog() {
    this.dialog.open(ShareReportDialogComponent);
  }
}
