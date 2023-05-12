import { Component, OnInit } from '@angular/core';

import { PlantaService } from '@data/services/planta.service';
import { ReportControlService } from '@data/services/report-control.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-chart-losses-by-modules',
  templateUrl: './chart-losses-by-modules.component.html',
  styleUrls: ['./chart-losses-by-modules.component.css'],
})
export class ChartLossesByModulesComponent implements OnInit {
  constructor(private plantaService: PlantaService, private reportControlService: ReportControlService) {}

  ngOnInit(): void {
    this.plantaService
      .getLocationsArea(this.reportControlService.plantaId)
      .pipe(take(1))
      .subscribe((locAreas) => {
        console.log(
          locAreas.filter(
            (locArea) => locArea.modulo !== undefined && locArea.modulo !== null && locArea.modulo !== null
          ).length
        );
      });
  }
}
