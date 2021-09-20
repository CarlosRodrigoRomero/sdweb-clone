import { Component, OnInit } from '@angular/core';

import { DownloadReportService } from '@core/services/download-report.service';

@Component({
  selector: 'app-dialog-filtered-report',
  templateUrl: './dialog-filtered-report.component.html',
  styleUrls: ['./dialog-filtered-report.component.css'],
})
export class DialogFilteredReportComponent implements OnInit {
  constructor(private downloadReportService: DownloadReportService) {}

  ngOnInit(): void {}

  selectFiltered(value: boolean) {
    this.downloadReportService.filteredPDF = value;
  }
}
