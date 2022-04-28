import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { switchMap, take } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

import { AnomaliaService } from '@core/services/anomalia.service';
import { InformeService } from '@core/services/informe.service';
import { PlantaService } from '@core/services/planta.service';
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
  checking = false;

  constructor(
    private anomaliaService: AnomaliaService,
    private router: Router,
    private informeService: InformeService,
    private plantaService: PlantaService,
    private warningService: WarningService
  ) {}

  ngOnInit(): void {
    this.informeId = this.router.url.split('/')[this.router.url.split('/').length - 1];
  }

  loadDataAndCheck() {
    this.checking = true;

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

        this.anomaliaService.initService(this.planta.id).then(() => {
          this.anomaliaService
            .getAnomalias$(this.informeId, 'pcs')
            .pipe(take(1))
            .subscribe((anoms) => {
              this.anomalias = this.anomaliaService.getRealAnomalias(anoms);

              this.checkWarnings();
            });
        });
      });
  }

  checkWarnings() {
    const tiposAnomsChecked = this.warningService.checkTiposAnoms(this.informe, this.anomalias, this.warnings);
    const numsCoAChecked = this.warningService.checkNumsCoA(this.informe, this.anomalias, this.warnings);
    const numsCritChecked = this.warningService.checkNumsCriticidad(this.informe, this.anomalias, this.warnings);
    const maeChecked = this.warningService.checkMAE(this.informe, this.warnings);
    const ccChecked = this.warningService.checkCC(this.informe, this.warnings);
    const filsColsPlantaChecked = this.warningService.checkFilsColsPlanta(this.planta, this.informe, this.warnings);
    const filsColsAnomsChecked = this.warningService.checkFilsColsAnoms(
      this.planta,
      this.anomalias,
      this.informe,
      this.warnings
    );
    const zonesChecked = this.warningService.checkZonesWarnings(
      this.locAreas,
      this.informe,
      this.warnings,
      this.planta,
      this.anomalias
    );
    const aerialLayerChecked = this.warningService.checkAerialLayer(this.informe.id, this.warnings);
    const imgPortadaChecked = this.warningService.checkImagePortada(this.informe.id, this.warnings);
    const imgSuciedadChecked = this.warningService.checkImageSuciedad(this.informe.id, this.warnings);

    if (
      tiposAnomsChecked &&
      numsCoAChecked &&
      numsCritChecked &&
      maeChecked &&
      ccChecked &&
      filsColsPlantaChecked &&
      filsColsAnomsChecked &&
      zonesChecked &&
      aerialLayerChecked &&
      imgPortadaChecked &&
      imgSuciedadChecked
    ) {
      this.checking = false;
    }
  }
}
