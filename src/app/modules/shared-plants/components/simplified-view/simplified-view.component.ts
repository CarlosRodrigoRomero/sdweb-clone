import { Component } from '@angular/core';

import { ViewReportService } from '@data/services/view-report.service';

@Component({
  selector: 'app-simplified-view',
  templateUrl: './simplified-view.component.html',
  styleUrls: ['./simplified-view.component.css'],
})
export class SimplifiedViewComponent {
  constructor(private viewReportService: ViewReportService) {}

  changeZonesView() {
    this.viewReportService.simplifiedView = !this.viewReportService.simplifiedView;
  }
}
