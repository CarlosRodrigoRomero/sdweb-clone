import { Component } from '@angular/core';

import { ViewReportService } from '@data/services/view-report.service';

@Component({
  selector: 'app-group-by-zones-view',
  templateUrl: './group-by-zones-view.component.html',
  styleUrls: ['./group-by-zones-view.component.css'],
})
export class GroupByZonesViewComponent {
  constructor(private viewReportService: ViewReportService) {}

  changeZonesView() {
    this.viewReportService.groupByZonesView = !this.viewReportService.groupByZonesView;
  }
}
