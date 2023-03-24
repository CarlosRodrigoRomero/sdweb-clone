import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { take } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

import TileLayer from 'ol/layer/Tile';

import { OlMapService } from '@data/services/ol-map.service';
import { ThermalService } from '@data/services/thermal.service';
import { ReportControlService } from '@data/services/report-control.service';

import { ThermalLayerInterface } from '@core/models/thermalLayer';
import { InformeInterface } from '@core/models/informe';
import { THERMAL } from '@data/constants/thermal';
import { Patches } from '@core/classes/patches';
import { MathOperations } from '@core/classes/math-operations';

@Component({
  selector: 'app-thermal-layers',
  templateUrl: './thermal-layers.component.html',
  styleUrls: ['./thermal-layers.component.css'],
})
export class ThermalLayersComponent implements OnInit {
  private thermalLayers: TileLayer[] = [];
  private thermalLayersDB: ThermalLayerInterface[] = [];
  private indexSelected: number;
  private informes: InformeInterface[] = [];

  constructor(
    private thermalService: ThermalService,
    private olMapService: OlMapService,
    private reportControlService: ReportControlService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.informes = this.reportControlService.informes;

    this.loadThermalLayers();
  }

  private loadThermalLayers() {
    const informeId = this.router.url.split('/')[this.router.url.split('/').length - 1];
    let getLayersDB = this.thermalService.getReportThermalLayerDB(informeId);
    if (!this.checkIfInformeId()) {
      getLayersDB = this.thermalService.getPlantThermalLayerDB(
        this.reportControlService.plantaId,
        this.reportControlService.informes.map((informe) => informe.id)
      );
    }

    // capas termicas del mapa
    combineLatest([this.olMapService.getThermalLayers(), getLayersDB])
      .pipe(take(1))
      .subscribe(([layers, layersDB]) => {
        this.thermalLayers = layers;
        this.thermalLayersDB = layersDB;

        // asignamos las capas al servicio para acceder de otros lados
        this.thermalService.thermalLayersDB = layersDB;

        if (this.thermalLayers.length > 0 && this.thermalLayersDB.length > 0) {
          // establecemos el indice seleccinado
          this.indexSelected = this.thermalLayersDB.length - 1;

          this.thermalService.indexSelected = this.indexSelected;

          // le damos el tamaño de la capa termica seleccionada
          this.thermalService.sliderMin = new Array(this.thermalLayersDB.length).fill(null);
          this.thermalService.sliderMax = new Array(this.thermalLayersDB.length).fill(null);

          // iniciamos cada capa
          this.thermalLayersDB.forEach((layerDB, index) => {
            this.setInitialValues(layerDB.informeId);
            if (index === this.thermalLayersDB.length - 1) {
              // this.thermalLayersLoaded = true;
            }
          });
        }
      });
  }

  private checkIfInformeId(): boolean {
    if (this.router.url.includes('clients') || this.router.url.includes('shared')) {
      return false;
    } else {
      return true;
    }
  }

  setInitialValues(informeId: string) {
    let indexInforme = 0;
    let [tempMin, tempMax] = [25, 75];
    // si estamos en un informe asignamos los valores basados en las temperaturas de referencia
    if (!this.checkIfInformeId()) {
      indexInforme = this.informes.findIndex((informe) => informe.id === informeId);
      [tempMin, tempMax] = this.getInitialTempsLayer(informeId);
    }

    // if (informeId === this.informeId) {
    //   this.lowTemp = tempMin;
    //   this.highTemp = tempMax;
    // }

    this.setSliderMinValue(tempMin, indexInforme);
    this.setSliderMaxValue(tempMax, indexInforme);
  }

  private getInitialTempsLayer(informeId: string): number[] {
    const tempRefMedia = this.getTempRefMedia(informeId);
    const thermalLayerDB = this.thermalLayersDB.find((layer) => layer.informeId === informeId);

    let tempMin = tempRefMedia - THERMAL.rangeMin;
    let tempMax = tempRefMedia + THERMAL.rangeMax;
    if (this.thermalLayersDB) {
      // asignamos los valores de forma automatica
      if (tempMin < thermalLayerDB.rangeTempMin) {
        tempMin = thermalLayerDB.rangeTempMin;
      }

      if (tempMax > thermalLayerDB.rangeTempMax) {
        tempMax = thermalLayerDB.rangeTempMax;
      }
    }

    // aplicamos parches para ciertas plantas
    [tempMin, tempMax] = Patches.thermalTempsPatchs(informeId, tempMin, tempMax);

    return [tempMin, tempMax];
  }

  private getTempRefMedia(informeId: string) {
    const anomaliasInforme = this.reportControlService.allAnomalias.filter((anom) => anom.informeId === informeId);
    const tempRefMedia = Math.round(MathOperations.average(anomaliasInforme.map((anom) => anom.temperaturaRef)));
    return tempRefMedia;
  }

  private setSliderMinValue(lowValue: number, indexInforme?: number) {
    let indexInf = this.indexSelected;
    if (indexInforme !== undefined) {
      indexInf = indexInforme;
    }

    this.thermalService.sliderMin = this.thermalService.sliderMin.map((value, index) => {
      if (index === indexInf) {
        return lowValue;
      } else {
        return value;
      }
    });
  }

  private setSliderMaxValue(highValue: number, indexInforme?: number) {
    let indexInf = this.indexSelected;
    if (indexInforme !== undefined) {
      indexInf = indexInforme;
    }
    this.thermalService.sliderMax = this.thermalService.sliderMax.map((value, index) => {
      if (index === indexInf) {
        return highValue;
      } else {
        return value;
      }
    });
  }
}
