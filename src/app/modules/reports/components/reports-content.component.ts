import { Component, OnInit } from '@angular/core';

import { ReportControlService } from '@data/services/report-control.service';

@Component({
  selector: 'app-reports-content',
  templateUrl: './reports-content.component.html',
  styleUrls: ['./reports-content.component.css'],
})
export class ReportsContentComponent implements OnInit {
  anomaliasLoaded = false;
  numInformes = 1;

  constructor(private reportControlService: ReportControlService) {}

  ngOnInit(): void {
    this.reportControlService.initService().then((res) => {
      this.anomaliasLoaded = res;

      this.numInformes = this.reportControlService.informes.length;
    });
  }
}
