import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription, combineLatest } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import { ReportControlService } from '@data/services/report-control.service';
import { AnomaliaService } from '@data/services/anomalia.service';
import { PcService } from '@data/services/pc.service';
import { PlantaService } from '@data/services/planta.service';
import { OlMapService } from '@data/services/ol-map.service';
import { ZonesService } from '@data/services/zones.service';
import { InformeService } from '@data/services/informe.service';

import { InformeInterface } from '@core/models/informe';
import { Anomalia } from '@core/models/anomalia';
import { GLOBAL } from '@data/constants/global';
import { EstructuraConPcs } from '@core/models/estructura';
import { LocationAreaInterface } from '@core/models/location';

@Component({
  selector: 'app-report-recalc',
  templateUrl: './report-recalc.component.html',
  styleUrls: ['./report-recalc.component.css'],
})
export class ReportRecalcComponent implements OnInit, OnDestroy {
  private selectedInforme: InformeInterface;
  informeS2EAntiguo = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private reportControlService: ReportControlService,
    private http: HttpClient,
    private anomaliaService: AnomaliaService,
    private pcService: PcService,
    private plantaService: PlantaService,
    private olMapService: OlMapService,
    private zonesService: ZonesService,
    private informeService: InformeService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe((informeId) => {
        this.selectedInforme = this.reportControlService.informes.find((informe) => informe.id === informeId);

        // si es una planta de S2E antigua
        if (!this.reportControlService.plantaFija && this.selectedInforme?.fecha <= GLOBAL.dateS2eAnomalias) {
          this.informeS2EAntiguo = true;
        }
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
        const zonas = this.zonesService.getRealZones(locAreas);

        this.reportControlService.allAnomalias
          .filter((anom) => anom.informeId === this.reportControlService.selectedInformeId)
          .forEach((anom) => {
            const anomCentroid = this.olMapService.getCentroid((anom as Anomalia).featureCoords);
            const newGlobalCoords = this.plantaService.getGlobalCoordsFromLocationAreaOl(anomCentroid, zonas);

            if (this.reportControlService.plantaFija || this.selectedInforme.fecha > GLOBAL.dateS2eAnomalias) {
              if (anom.globalCoords.toString() !== newGlobalCoords.toString()) {
                this.anomaliaService.updateAnomaliaField(anom.id, 'globalCoords', newGlobalCoords);
              }
            } else {
              this.pcService.updatePcField(anom.id, 'globalCoords', newGlobalCoords);
            }
          });
      });
  }

  recalGlobalCoordsS2E() {
    let zonas: LocationAreaInterface[] = [];
    // nos traemos de nuevo las locAreas por si hay nuevas o se han modificado en localizaciones
    this.plantaService
      .getLocationsArea(this.reportControlService.plantaId)
      .pipe(
        take(1),
        switchMap((locAreas) => {
          zonas = this.zonesService.getRealZones(locAreas);

          const allEstructuras$ = this.informeService.getAllEstructuras(this.reportControlService.selectedInformeId);
          const allAutoEstructuras$ = this.informeService.getAllAutoEstructuras(
            this.reportControlService.selectedInformeId
          );
          const allPcs$ = this.pcService.getPcsInformeEdit(this.reportControlService.selectedInformeId);

          return combineLatest([allEstructuras$, allAutoEstructuras$, allPcs$]);
        }),
        take(1)
      )
      .subscribe(([ests, autoests, pcs]) => {
        const estConPcs = ests.map((est) => {
          const pcsEst = pcs.filter((pc) => {
            return pc.archivo === est.archivo;
          });
          return { estructura: est, pcs: pcsEst };
        });
        estConPcs.push(
          ...autoests.map((est) => {
            const pcsAutoest = pcs.filter((pc) => {
              return pc.archivo === est.archivo;
            });
            return { estructura: est, pcs: pcsAutoest };
          })
        );

        estConPcs.forEach(async (estConPcs: EstructuraConPcs) => {
          const estructura = estConPcs.estructura;

          const estCoords = this.olMapService.latLonLiteralToLonLat([estructura.getLatLng()]);
          const estCentroid = this.olMapService.getCentroid(estCoords[0]);
          const newGlobalCoords = this.plantaService.getGlobalCoordsFromLocationAreaOl(estCentroid, zonas);

          estConPcs.pcs.forEach((pc) => {
            this.pcService.updatePcField(pc.id, 'globalCoords', newGlobalCoords);
          });
        });
      });
  }

  corregirHoraAnomalias() {
    const anomaliasInforme = this.reportControlService.allAnomalias.filter(
      (anom) => anom.informeId === this.selectedInforme.id
    );

    // Convertir timestamp a objeto Date de JavaScript
    const fechaJS = new Date(this.selectedInforme.fecha * 1000);

    // Configurar la fecha a las 12:00
    fechaJS.setHours(12, 0, 0, 0);

    // Convertir el objeto Date de nuevo a timestamp (en segundos)
    const fechaCorregida = fechaJS.getTime() / 1000;

    anomaliasInforme.forEach((anom) => this.anomaliaService.updateAnomaliaField(anom.id, 'datetime', fechaCorregida));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
