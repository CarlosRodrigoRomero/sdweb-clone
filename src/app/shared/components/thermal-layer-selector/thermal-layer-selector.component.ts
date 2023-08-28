import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { ReportControlService } from '@data/services/report-control.service';
import { ViewReportService } from '@data/services/view-report.service';

@Component({
  selector: 'app-thermal-layer-selector',
  templateUrl: './thermal-layer-selector.component.html',
  styleUrls: ['./thermal-layer-selector.component.css'],
})
export class ThermalLayerSelectorComponent implements OnInit, OnDestroy {
  selectedInformeId: string;

  private subscriptions: Subscription = new Subscription();

  constructor(private viewReportService: ViewReportService, private reportControlService: ReportControlService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe((informeId) => (this.selectedInformeId = informeId))
    );
  }

  setThermalLayerStatus(event: any) {
    this.viewReportService.thermalLayerVisible = event.checked;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
