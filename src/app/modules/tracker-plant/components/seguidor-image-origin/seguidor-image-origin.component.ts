import { Component, OnInit } from '@angular/core';

import { ReportControlService } from '@data/services/report-control.service';

import { PlantaInterface } from '@core/models/planta';

@Component({
  selector: 'app-seguidor-image-origin',
  templateUrl: './seguidor-image-origin.component.html',
  styleUrls: ['./seguidor-image-origin.component.css'],
})
export class SeguidorImageOriginComponent implements OnInit {
  private planta: PlantaInterface;
  origin = 'tL';

  constructor(private reportControlService: ReportControlService) {}

  ngOnInit(): void {
    this.planta = this.reportControlService.planta;

    this.checkOrigin();
  }

  private checkOrigin(): void {
    if (this.planta.hasOwnProperty('columnaDchaPrimero') && this.planta.columnaDchaPrimero) {
      if (this.planta.alturaBajaPrimero) {
        this.origin = 'bR';
      } else {
        this.origin = 'tR';
      }
    } else {
      if (this.planta.alturaBajaPrimero) {
        this.origin = 'bL';
      }
    }
  }
}
