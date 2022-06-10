import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { ViewReportService } from '@data/services/view-report.service';
import { SeguidorViewService } from '../../services/seguidor-view.service';

@Component({
  selector: 'app-seguidor-view-toggle',
  templateUrl: './seguidor-view-toggle.component.html',
  styleUrls: ['./seguidor-view-toggle.component.css'],
})
export class SeguidorViewToggleComponent implements OnInit, OnDestroy {
  viewSelected: number;

  private subscriptions: Subscription = new Subscription();

  constructor(private viewReportService: ViewReportService, private seguidorViewService: SeguidorViewService) {}

  ngOnInit(): void {
    this.subscriptions.add(this.viewReportService.reportViewSelected$.subscribe((view) => (this.viewSelected = view)));
  }

  onToggleChange(value) {
    this.seguidorViewService.seguidorViewSelected = value;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
