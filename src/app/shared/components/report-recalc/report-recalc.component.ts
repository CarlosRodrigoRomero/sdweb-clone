import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

import { ReportControlService } from '@data/services/report-control.service';
import { AnomaliaService } from '@data/services/anomalia.service';
import { PcService } from '@data/services/pc.service';
import { PlantaService } from '@data/services/planta.service';
import { OlMapService } from '@data/services/ol-map.service';
import { ZonesService } from '@data/services/zones.service';

import { InformeInterface } from '@core/models/informe';
import { Seguidor } from '@core/models/seguidor';
import { Anomalia } from '@core/models/anomalia';
import { GLOBAL } from '@data/constants/global';

@Component({
  selector: 'app-report-recalc',
  templateUrl: './report-recalc.component.html',
  styleUrls: ['./report-recalc.component.css'],
})
export class ReportRecalcComponent implements OnInit, OnDestroy {
  private selectedInforme: InformeInterface;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private reportControlService: ReportControlService,
    private http: HttpClient,
    private anomaliaService: AnomaliaService,
    private pcService: PcService,
    private plantaService: PlantaService,
    private olMapService: OlMapService,
    private zonesService: ZonesService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe((informeId) => {
        this.selectedInforme = this.reportControlService.informes.find((informe) => informe.id === informeId);
      })
    );
  }

  recalMAEyCC() {
    // calculamos MAE
    const anomaliasInforme = this.reportControlService.allAnomalias.filter(
      (anom) => anom.informeId === this.selectedInforme.id
    );
    this.reportControlService.setMae(anomaliasInforme, this.selectedInforme);

    // calculamos MAE reparable
    const fixableAnoms = anomaliasInforme.filter((anom) => GLOBAL.fixableTypes.includes(anom.tipo));
    this.reportControlService.setMae(fixableAnoms, this.selectedInforme, 'fixablePower');

    this.reportControlService.setCC(anomaliasInforme, this.selectedInforme);
  }

  setTipoNextYear() {
    this.http.get('assets/tiposNextYear.json').subscribe((data: any[]) => {
      const anomaliasSelectedInforme = this.reportControlService.allAnomalias.filter(
        (anom) => anom.informeId === this.reportControlService.selectedInformeId
      );

      anomaliasSelectedInforme.forEach((anom, index) => {
        // if (index < 20) {
        const object = data.find((item) => item.id === anom.id);

        if (object) {
          if (this.reportControlService.plantaFija) {
            // this.anomaliaService.updateAnomaliaField(anom.id, 'tipoNextYear', anom.tipo);
          } else {
            // this.pcService.updatePcField(anom.id, 'tipoNextYear', object.tipo2);
          }
          // }
        }
      });
    });
  }

  recalGlobalCoords() {
    // nos traemos de nuevo las locAreas por si hay nuevas o se han modificado en localizaciones
    this.plantaService
      .getLocationsArea(this.reportControlService.plantaId)
      .pipe(take(1))
      .subscribe((locAreas) => {
        const zonas = this.zonesService.getZones(this.reportControlService.planta, locAreas);

        this.reportControlService.allAnomalias
          .filter((anom) => anom.informeId === this.reportControlService.selectedInformeId)
          .forEach((anom) => {
            const anomCentroid = this.olMapService.getCentroid((anom as Anomalia).featureCoords);
            const newGlobalCoords = this.plantaService.getGlobalCoordsFromLocationAreaOl(anomCentroid, zonas);

            if (this.reportControlService.plantaFija) {
              if (anom.globalCoords.toString() !== newGlobalCoords.toString()) {
                this.anomaliaService.updateAnomaliaField(anom.id, 'globalCoords', newGlobalCoords);
              }
            } else {
              this.pcService.updatePcField(anom.id, 'globalCoords', newGlobalCoords);
            }
          });
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
