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
  viewSelected: string;

  private subscriptions: Subscription = new Subscription();

  constructor(private viewReportService: ViewReportService, private seguidorViewService: SeguidorViewService) {}

  ngOnInit(): void {
    this.viewSelected = this.viewReportService.reportViewSelected;
  }

  onToggleChange(view: string) {
    this.viewSelected = view;
    this.seguidorViewService.seguidorViewSelected = view;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
