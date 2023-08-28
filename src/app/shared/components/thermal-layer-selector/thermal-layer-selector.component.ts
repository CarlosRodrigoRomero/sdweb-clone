import { Component } from '@angular/core';

import { ViewReportService } from '@data/services/view-report.service';

@Component({
  selector: 'app-thermal-layer-selector',
  templateUrl: './thermal-layer-selector.component.html',
  styleUrls: ['./thermal-layer-selector.component.css'],
})
export class ThermalLayerSelectorComponent {
  constructor(private viewReportService: ViewReportService) {}

  setThermalLayerStatus(event: any) {
    this.viewReportService.thermalLayerVisible = event.checked;
  }
}
