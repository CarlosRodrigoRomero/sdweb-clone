import { Component, OnInit } from '@angular/core';

import { ReportControlService } from '@data/services/report-control.service';

import { PlantaInterface } from '@core/models/planta';
import { InformeInterface } from '@core/models/informe';

@Component({
  selector: 'app-simple-plant-summary',
  templateUrl: './simple-plant-summary.component.html',
  styleUrls: ['./simple-plant-summary.component.css'],
})
export class SimplePlantSummaryComponent implements OnInit {
  planta: PlantaInterface;
  selectedInforme: InformeInterface;

  constructor(private reportControlService: ReportControlService) {}

  ngOnInit(): void {
    this.planta = this.reportControlService.planta;
    this.selectedInforme = this.reportControlService.informes.find(
      (inf) => inf.id === this.reportControlService.selectedInformeId
    );
  }
}