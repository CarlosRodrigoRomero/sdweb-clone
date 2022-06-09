import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { ViewReportService } from '@data/services/view-report.service';

@Component({
  selector: 'app-view-toggle',
  templateUrl: './view-toggle.component.html',
  styleUrls: ['./view-toggle.component.css'],
})
export class ViewToggleComponent implements OnInit, OnDestroy {
  viewSelected: number;

  private subscriptions: Subscription = new Subscription();

  constructor(private viewReportService: ViewReportService) {}

  ngOnInit(): void {
    this.subscriptions.add(this.viewReportService.toggleViewSelected$.subscribe((view) => (this.viewSelected = view)));
  }

  onToggleChange(value) {
    this.viewReportService.toggleViewSelected = Number(value);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
