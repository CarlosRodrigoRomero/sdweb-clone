import { Component, OnDestroy, OnInit } from '@angular/core';

import { ThemePalette } from '@angular/material/core';

import { Subscription } from 'rxjs';

import { DownloadReportService } from '@core/services/download-report.service';

@Component({
  selector: 'app-download-progress-bar',
  templateUrl: './download-progress-bar.component.html',
  styleUrls: ['./download-progress-bar.component.css'],
})
export class ProgressBarPdfComponent implements OnInit, OnDestroy {
  generatingDownload = false;
  endingDownload = false;
  progressBarColor: ThemePalette = 'primary';
  progressBarValue = 0;
  typeDownload: string;

  private subscriptions: Subscription = new Subscription();

  constructor(private downloadReportService: DownloadReportService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.downloadReportService.generatingDownload$.subscribe((value) => (this.generatingDownload = value))
    );

    this.subscriptions.add(
      this.downloadReportService.endingDownload$.subscribe((value) => (this.endingDownload = value))
    );

    this.subscriptions.add(
      this.downloadReportService.progressBarValue$.subscribe((value) => (this.progressBarValue = value))
    );

    this.subscriptions.add(this.downloadReportService.typeDownload$.subscribe((value) => (this.typeDownload = value)));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
