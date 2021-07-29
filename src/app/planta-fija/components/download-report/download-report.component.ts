import { Component, OnInit } from '@angular/core';

import { ReportControlService } from '@core/services/report-control.service';

@Component({
  selector: 'app-download-report',
  templateUrl: './download-report.component.html',
  styleUrls: ['./download-report.component.css'],
})
export class DownloadReportComponent implements OnInit {
  plantaDemo = false;

  constructor(private reportControlService: ReportControlService) {}

  ngOnInit(): void {
    if (this.reportControlService.plantaId === 'egF0cbpXnnBnjcrusoeR') {
      this.plantaDemo = true;
    }
  }
}
