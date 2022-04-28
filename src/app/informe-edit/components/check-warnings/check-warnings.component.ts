import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { catchError, switchMap, take } from 'rxjs/operators';

import { AnomaliaService } from '@core/services/anomalia.service';
import { InformeService } from '@core/services/informe.service';
import { PlantaService } from '@core/services/planta.service';
import { SeguidorService } from '@core/services/seguidor.service';
import { WarningService } from '@core/services/warning.service';

import { InformeInterface } from '@core/models/informe';
import { PlantaInterface } from '@core/models/planta';
import { Anomalia } from '@core/models/anomalia';
import { LocationAreaInterface } from '@core/models/location';
import { Warning } from '@shared/components/warnings-menu/warnings';

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
  private seguidoresIndex = 0;

  constructor(
    private anomaliaService: AnomaliaService,
    private router: Router,
    private informeService: InformeService,
    private plantaService: PlantaService,
    private seguidorService: SeguidorService,
    private http: HttpClient,
    private warningService: WarningService
  ) {}

  ngOnInit(): void {
    this.informeId = this.router.url.split('/')[this.router.url.split('/').length - 1];

    this.informeService
      .getInforme(this.informeId)
      .pipe(
        take(1),
        switchMap((informe) => {
          this.informe = informe;

          return this.plantaService.getPlanta(informe.plantaId);
        }),
        take(1),
        switchMap((planta) => {
          this.planta = planta;

          return this.plantaService.getLocationsArea(planta.id);
        })
      )
      .subscribe((locAreas) => {
        this.locAreas = locAreas;

        // indice que corresponde a los seguidores en las globalCoords
        this.seguidoresIndex = this.seguidorService.getIndiceGlobalCoordsSeguidores(locAreas);

        this.anomaliaService.initService(this.planta.id).then(() => {
          this.anomaliaService
            .getAnomalias$(this.informeId, 'pcs')
            .subscribe((anoms) => (this.anomalias = this.anomaliaService.getRealAnomalias(anoms)));
        });
      });

    this.warningService.getWarnings(this.informeId).subscribe((warnings) => (this.warnings = warnings));
  }

  checkWarnings() {
    this.warningService.checkTiposAnoms(this.informe, this.anomalias, this.warnings);
    this.warningService.checkNumsCoA(this.informe, this.anomalias, this.warnings);
    this.warningService.checkNumsCriticidad(this.informe, this.anomalias, this.warnings);
    this.warningService.checkFilsColsPlanta(this.planta, this.informe, this.warnings);
    this.warningService.checkFilsColsAnoms(this.planta, this.anomalias, this.informe, this.warnings);
    this.warningService.checkZonesWarnings(this.locAreas, this.informe, this.warnings, this.planta, this.anomalias);
    this.warningService.checkAerialLayer(this.informe.id, this.warnings);
  }
}
