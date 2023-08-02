import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { switchMap, take } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

import { AnomaliaService } from '@data/services/anomalia.service';
import { InformeService } from '@data/services/informe.service';
import { PlantaService } from '@data/services/planta.service';
import { WarningService } from '@data/services/warning.service';
import { ReportControlService } from '@data/services/report-control.service';

import { Warning } from '@shared/components/warnings-menu/warnings';

import { InformeInterface } from '@core/models/informe';
import { PlantaInterface } from '@core/models/planta';
import { Anomalia } from '@core/models/anomalia';
import { LocationAreaInterface } from '@core/models/location';
import { Seguidor } from '@core/models/seguidor';

@Component({
  selector: 'app-check-warnings',
  templateUrl: './check-warnings.component.html',
  styleUrls: ['./check-warnings.component.css'],
})
export class CheckWarningsComponent implements OnInit {
  private informeId: string;
  private informe: InformeInterface;
  private planta: PlantaInterface;
  private anomalias: Anomalia[];
  private warnings: Warning[] = [];
  private locAreas: LocationAreaInterface[] = [];
  checked = true;

  constructor(
    private anomaliaService: AnomaliaService,
    private router: Router,
    private informeService: InformeService,
    private plantaService: PlantaService,
    private warningService: WarningService,
    private reportControlService: ReportControlService
  ) {}

  ngOnInit(): void {
    this.informeId = this.router.url.split('/')[this.router.url.split('/').length - 1];
  }

  loadDataAndCheck() {
    this.checked = false;

    combineLatest([this.informeService.getInforme(this.informeId), this.warningService.getWarnings(this.informeId)])
      .pipe(
        take(1),
        switchMap(([informe, warnings]) => {
          this.informe = informe;
          this.warnings = warnings;

          return this.plantaService.getPlanta(informe.plantaId);
        }),
        take(1),
        switchMap((planta) => {
          this.planta = planta;

          return this.plantaService.getLocationsArea(planta.id);
        }),
        take(1)
      )
      .subscribe((locAreas) => {
        this.locAreas = locAreas;

        this.anomalias = this.reportControlService.allAnomalias.filter((anom) => anom.informeId === this.informeId);

        if (this.reportControlService.plantaFija) {
          this.checked = this.warningService.checkWarnings(
            this.informe,
            this.anomalias,
            this.warnings,
            this.planta,
            this.locAreas
          );
        } else {
          const seguidoresInforme = this.reportControlService.allFilterableElements.filter(
            (segs) => segs.informeId === this.informe.id
          ) as Seguidor[];

          this.checked = this.warningService.checkWarnings(
            this.informe,
            this.anomalias,
            this.warnings,
            this.planta,
            this.locAreas,
            seguidoresInforme
          );
        }
      });
  }
}
