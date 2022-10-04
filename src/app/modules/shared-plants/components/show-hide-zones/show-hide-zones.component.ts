import { Component, OnInit } from '@angular/core';

import { ViewReportService } from '@data/services/view-report.service';

@Component({
  selector: 'app-show-hide-zones',
  templateUrl: './show-hide-zones.component.html',
  styleUrls: ['./show-hide-zones.component.css'],
})
export class ShowHideZonesComponent implements OnInit {
  constructor(private viewReportService: ViewReportService) {}

  ngOnInit(): void {}

  changeZonesView() {
    this.viewReportService.viewZones = !this.viewReportService.viewZones;
  }
}
