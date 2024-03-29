import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';

import { LabelType, Options } from '@angular-slider/ngx-slider';

import { take } from 'rxjs/operators';
import { combineLatest, Subscription } from 'rxjs';

import TileLayer from 'ol/layer/Tile';

import { OlMapService } from '@data/services/ol-map.service';
import { ThermalService } from '@data/services/thermal.service';
import { ReportControlService } from '@data/services/report-control.service';

import { ThermalLayerInterface } from '@core/models/thermalLayer';
import { MathOperations } from '@core/classes/math-operations';
import { THERMAL } from '@data/constants/thermal';
import { InformeInterface } from '@core/models/informe';
import { Patches } from '@core/classes/patches';

@Component({
  selector: 'app-thermal-slider',
  templateUrl: './thermal-slider.component.html',
  styleUrls: ['./thermal-slider.component.scss'],
})
export class ThermalSliderComponent implements OnInit, OnChanges, OnDestroy {
  private thermalLayers: TileLayer<any>[] = [];
  private thermalLayersDB: ThermalLayerInterface[] = [];
  private indexSelected: number;
  private thermalLayersLoaded = false;
  private informes: InformeInterface[] = [];

  @Input() informeId: string;

  private subscriptions: Subscription = new Subscription();

  /* Valores de inicio */
  lowTemp = 25;
  highTemp = 75;
  optionsTemp: Options = {
    floor: 25,
    ceil: 100,
    translate: (value: number, label: LabelType): string => {
      switch (label) {
        case LabelType.Low:
          return '<b>' + value + '</b> ºC';
        case LabelType.High:
          return '<b>' + value + '</b> ºC';
        default:
          return value + 'ºC';
      }
    },
  };

  constructor(
    private thermalService: ThermalService,
    private olMapService: OlMapService,
    private reportControlService: ReportControlService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.informes = this.reportControlService.informes;

    this.loadThermalLayers();

    this.subscriptions.add(
      this.thermalService.sliderMin$.subscribe((value) => {
        const minValue = value[this.indexSelected];
        if (minValue !== undefined && minValue !== null && !isNaN(minValue)) {
          this.lowTemp = minValue;
          if (this.thermalLayers.length > 0) {
            this.thermalLayers[this.indexSelected].getSource().changed();
          }
        }
      })
    );

    this.subscriptions.add(
      this.thermalService.sliderMax$.subscribe((value) => {
        const maxValue = value[this.indexSelected];
        if (maxValue !== undefined && maxValue !== null && !isNaN(maxValue)) {
          this.highTemp = maxValue;
          if (this.thermalLayers.length > 0) {
            this.thermalLayers[this.indexSelected].getSource().changed();
          }
        }
      })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.informeId && this.thermalLayersLoaded) {
      const index = this.informes.findIndex((informe) => informe.id === this.informeId);

      if (index !== -1) {
        this.indexSelected = index;

        const selectedThermalLayer = this.thermalLayersDB[this.indexSelected];

        this.optionsTemp = {
          floor: selectedThermalLayer.rangeTempMin,
          ceil: selectedThermalLayer.rangeTempMax,
          translate: this.optionsTemp.translate,
        };

        this.setInitialValues(this.informeId);
      }
    }
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

          const selectedThermalLayer = this.thermalLayersDB[this.indexSelected];

          this.optionsTemp = {
            floor: selectedThermalLayer.rangeTempMin,
            ceil: selectedThermalLayer.rangeTempMax,
            translate: this.optionsTemp.translate,
          };

          // le damos el tamaño de la capa termica seleccionada
          this.thermalService.sliderMin = new Array(this.thermalLayersDB.length).fill(null);
          this.thermalService.sliderMax = new Array(this.thermalLayersDB.length).fill(null);

          // iniciamos cada capa
          this.thermalLayersDB.forEach((layerDB, index) => {
            this.setInitialValues(layerDB.informeId);
            if (index === this.thermalLayersDB.length - 1) {
              this.thermalLayersLoaded = true;
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
      const [tMin, tMax] = this.getInitialTempsLayer(informeId);
      if (tMin !== undefined && tMin !== null && !isNaN(tMin) && tMax !== undefined && tMax !== null && !isNaN(tMax)) {
        [tempMin, tempMax] = [tMin, tMax];
      }
    }

    if (informeId === this.informeId) {
      this.lowTemp = tempMin;
      this.highTemp = tempMax;
    }

    this.setSliderMinValue(tempMin, indexInforme);
    this.setSliderMaxValue(tempMax, indexInforme);
  }

  private getInitialTempsLayer(informeId: string): number[] {
    const tempRefMedia = this.getTempRefMedia(informeId);
    const thermalLayerDB = this.thermalLayersDB.find((layer) => layer.informeId === informeId);

    let tempMin = tempRefMedia - THERMAL.rangeMin;
    let tempMax = this.getTempMax(tempRefMedia, informeId);
    // let tempMax = tempRefMedia + THERMAL.rangeMax;
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
    const anomaliasInformeSinSombras = this.reportControlService.allAnomalias
      .filter((anom) => anom.tipo !== 15)
      .filter((anom) => anom.informeId === informeId);
    const tempRefMedia = Math.round(
      MathOperations.average(anomaliasInformeSinSombras.map((anom) => anom.temperaturaRef))
    );
    return tempRefMedia;
  }

  private getTempMax(tempRefMedia: number, informeId: string) {
    const tempMax = tempRefMedia + THERMAL.rangeMax;
    const tempMaxAnom = this.reportControlService.allAnomalias.reduce((maxTemp, anom) => {
      if (anom.informeId === informeId) {
        return Math.max(maxTemp, anom.temperaturaMax);
      }
      return maxTemp;
    }, Number.NEGATIVE_INFINITY);

    return Math.max(tempMax, tempMaxAnom);
  }

  onChangeTemperatureSlider(lowValue: number, highValue: number) {
    this.setSliderMinValue(lowValue);
    this.setSliderMaxValue(highValue);
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

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
