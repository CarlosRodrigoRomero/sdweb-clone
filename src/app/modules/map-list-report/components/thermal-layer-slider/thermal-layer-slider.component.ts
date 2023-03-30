import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';

import { LabelType, Options } from '@angular-slider/ngx-slider';

import { switchMap, take } from 'rxjs/operators';
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
  selector: 'app-thermal-layer-slider',
  templateUrl: './thermal-layer-slider.component.html',
  styleUrls: ['./thermal-layer-slider.component.scss'],
})
export class ThermalLayerSliderComponent implements OnInit, OnChanges, OnDestroy {
  private thermalLayers: TileLayer[] = [];
  private thermalLayersDB: ThermalLayerInterface[] = [];
  private indexSelected: number;
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

    this.subscriptions.add(
      this.olMapService
        .getThermalLayers()
        .pipe(
          take(1),
          switchMap((layers) => {
            this.thermalLayers = layers;

            return this.thermalService.thermalLayersDB$;
          }),
          take(1),
          switchMap((thermalLayerDB) => {
            this.thermalLayersDB = thermalLayerDB;

            return this.thermalService.indexSelected$;
          }),
          switchMap((index) => {
            this.indexSelected = index;

            const selectedThermalLayer = this.thermalLayersDB[this.indexSelected];

            this.optionsTemp = {
              floor: selectedThermalLayer.rangeTempMin,
              ceil: selectedThermalLayer.rangeTempMax,
              translate: this.optionsTemp.translate,
            };

            return combineLatest([this.thermalService.sliderMin$, this.thermalService.sliderMax$]);
          })
        )
        .subscribe(([minValues, maxValues]) => {
          const minValue = minValues[this.indexSelected];
          if (minValue) {
            this.lowTemp = minValue;
            if (this.thermalLayers.length > 0) {
              this.thermalLayers[this.indexSelected].getSource().changed();
            }
          }

          const maxValue = maxValues[this.indexSelected];
          if (maxValue) {
            this.highTemp = maxValue;
            if (this.thermalLayers.length > 0) {
              this.thermalLayers[this.indexSelected].getSource().changed();
            }
          }
        })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.informeId) {
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
