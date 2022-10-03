import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { ViewReportService } from '@data/services/view-report.service';
import { ReportControlService } from '@data/services/report-control.service';

@Component({
  selector: 'app-view-toggle',
  templateUrl: './view-toggle.component.html',
  styleUrls: ['./view-toggle.component.css'],
})
export class ViewToggleComponent implements OnInit, OnDestroy {
  viewSelected: number;
  plantaFija: boolean;

  private subscriptions: Subscription = new Subscription();

  constructor(private viewReportService: ViewReportService, private reportControlService: ReportControlService) {}

  ngOnInit(): void {
    this.plantaFija = this.reportControlService.plantaFija;

    this.subscriptions.add(this.viewReportService.reportViewSelected$.subscribe((view) => (this.viewSelected = view)));
  }

  onToggleChange(value: string) {
    this.viewReportService.reportViewSelected = Number(value);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
