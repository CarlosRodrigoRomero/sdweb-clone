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
  viewSelected: string;
  plantaFija: boolean;

  private subscriptions: Subscription = new Subscription();

  constructor(private viewReportService: ViewReportService, private reportControlService: ReportControlService) {}

  ngOnInit(): void {
    this.plantaFija = this.reportControlService.plantaNoS2E;

    this.subscriptions.add(this.viewReportService.reportViewSelected$.subscribe((view) => (this.viewSelected = view)));
  }

  onToggleChange(view: string) {
    this.viewReportService.reportViewSelected = view;

    if (view === 'tipo') {
      this.viewReportService.groupByZonesView = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
