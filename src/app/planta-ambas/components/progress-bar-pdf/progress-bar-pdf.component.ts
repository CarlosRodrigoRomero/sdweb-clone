import { Component, OnDestroy, OnInit } from '@angular/core';

import { ThemePalette } from '@angular/material/core';
import { ProgressBarMode } from '@angular/material/progress-bar';

import { Subscription } from 'rxjs';

import { DownloadReportService } from '@core/services/download-report.service';
import { ReportControlService } from '@core/services/report-control.service';

@Component({
  selector: 'app-progress-bar-pdf',
  templateUrl: './progress-bar-pdf.component.html',
  styleUrls: ['./progress-bar-pdf.component.css'],
})
export class ProgressBarPdfComponent implements OnInit, OnDestroy {
  plantaFija = this.reportControlService.plantaFija;
  generatingPDF = false;
  endingPDF = false;
  progressBarColor: ThemePalette = 'primary';
  progressBarMode: ProgressBarMode = 'determinate';
  progressBarValue = 0;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private downloadReportService: DownloadReportService,
    private reportControlService: ReportControlService
  ) {}

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
