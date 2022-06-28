import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';

import { Subscription } from 'rxjs';

import { ReportControlService } from '@data/services/report-control.service';
import { DemoService } from '@data/services/demo.service';

@Component({
  selector: 'app-download-report',
  templateUrl: './download-report.component.html',
  styleUrls: ['./download-report.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class DownloadReportComponent implements OnInit, OnDestroy {
  imagesZipExist = true;
  imagesZipUrl: string;
  excelExist = true;
  excelUrl: string;
  plantaDemo = false;
  pdfDemo: string;

  private subscriptions: Subscription = new Subscription();

  constructor(public reportControlService: ReportControlService, private demoService: DemoService) {}

  ngOnInit(): void {
    this.pdfDemo = this.demoService.pdf;

    // excluimos DEMO
    if (this.reportControlService.plantaId === 'egF0cbpXnnBnjcrusoeR') {
      this.plantaDemo = true;

      this.excelUrl =
        'https://firebasestorage.googleapis.com/v0/b/sdweb-d33ce.appspot.com/o/informes%2F62dvYbGgoMkMNCuNCOEc%2Finforme.xlsx?alt=media&token=05aab4b1-452d-4822-8a50-dc788739a620';

      this.imagesZipExist = false;
    }

    if (this.reportControlService.plantaId === 'egF0cbpXnnBnjcrusoeR') {
      this.plantaDemo = true;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
