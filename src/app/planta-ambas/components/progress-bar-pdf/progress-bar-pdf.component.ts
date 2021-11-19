import { Component, OnDestroy, OnInit } from '@angular/core';

import { ThemePalette } from '@angular/material/core';

import { Subscription } from 'rxjs';

import { DownloadReportService } from '@core/services/download-report.service';

@Component({
  selector: 'app-progress-bar-pdf',
  templateUrl: './progress-bar-pdf.component.html',
  styleUrls: ['./progress-bar-pdf.component.css'],
})
export class ProgressBarPdfComponent implements OnInit, OnDestroy {
  generatingPDF = false;
  endingPDF = false;
  progressBarColor: ThemePalette = 'primary';
  progressBarValue = 0;

  private subscriptions: Subscription = new Subscription();

  constructor(private downloadReportService: DownloadReportService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.downloadReportService.generatingPDF$.subscribe((value) => (this.generatingPDF = value))
    );

    this.subscriptions.add(this.downloadReportService.endingPDF$.subscribe((value) => (this.endingPDF = value)));

    this.subscriptions.add(
      this.downloadReportService.progressBarValue$.subscribe((value) => (this.progressBarValue = value))
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
