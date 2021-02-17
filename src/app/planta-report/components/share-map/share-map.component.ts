import { Component, OnInit } from '@angular/core';

import { MatSnackBar } from '@angular/material/snack-bar';

import { ClipboardService } from 'ngx-clipboard';

import { Observable } from 'rxjs';

import { ShareReportService } from '@core/services/share-report.service';

@Component({
  selector: 'app-share-map',
  templateUrl: './share-map.component.html',
  styleUrls: ['./share-map.component.css'],
})
export class ShareMapComponent implements OnInit {
  items: Observable<any[]>;

  constructor(
    private shareReportService: ShareReportService,
    private clipboardService: ClipboardService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {}

  getShareLink(): string {
    // primero guarda los params en la DB
    this.shareReportService.saveParams();

    // luego recibimos el ID donde se han guardado
    const id = this.shareReportService.getParamsDbId();

    const link = 'localhost:4200/shared/' + id;

    return link;
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
