import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { ReportControlService } from '@data/services/report-control.service';
import { ViewReportService } from '@data/services/view-report.service';
import { ThermalService } from '@data/services/thermal.service';

@Component({
  selector: 'app-thermal-layer-selector',
  templateUrl: './thermal-layer-selector.component.html',
  styleUrls: ['./thermal-layer-selector.component.css'],
})
export class ThermalLayerSelectorComponent implements OnInit, OnDestroy {
  selectedInformeId: string;
  initialState: boolean;
  paletteSelected = 'grayscale';

  private subscriptions: Subscription = new Subscription();

  constructor(
    private viewReportService: ViewReportService,
    private reportControlService: ReportControlService,
    private thermalService: ThermalService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe((informeId) => (this.selectedInformeId = informeId))
    );

    this.initialState = this.viewReportService.thermalLayerVisible;

    this.subscriptions.add(
      this.thermalService.paletteSelected$.subscribe((palette) => (this.paletteSelected = palette))
    );
  }

  setThermalLayerStatus(event: any) {
    this.viewReportService.thermalLayerVisible = event.checked;
  }

  changePalette() {
    if (this.thermalService.paletteSelected === 'iron') {
      this.thermalService.paletteSelected = 'grayscale';
    } else {
      this.thermalService.paletteSelected = 'iron';
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
