import { Component, OnInit } from '@angular/core';

import { ReportControlService } from '@data/services/report-control.service';

import { PlantaInterface } from '@core/models/planta';

@Component({
  selector: 'app-plant-info',
  templateUrl: './plant-info.component.html',
  styleUrls: ['./plant-info.component.css'],
})
export class PlantInfoComponent implements OnInit {
  planta: PlantaInterface;

  constructor(private reportControlService: ReportControlService) {}

  ngOnInit(): void {
    this.reportControlService.planta$.subscribe((planta) => {
      this.planta = planta;
    });
  }
}
