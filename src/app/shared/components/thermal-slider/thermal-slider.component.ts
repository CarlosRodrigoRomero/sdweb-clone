import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';

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

@Component({
  selector: 'app-thermal-slider',
  templateUrl: './thermal-slider.component.html',
  styleUrls: ['./thermal-slider.component.scss'],
})
export class ThermalSliderComponent implements OnInit, OnChanges, OnDestroy {
  private thermalLayers: TileLayer[] = [];
  private thermalLayersDB: ThermalLayerInterface[] = [];
  private indexSelected: number;

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
    private reportControlService: ReportControlService
  ) {}

  ngOnInit(): void {
    // capas termicas del mapa
    combineLatest([
      this.olMapService.getThermalLayers(),
      this.thermalService.getPlantThermalLayerDB(this.reportControlService.plantaId),
    ])
      .pipe(take(1))
      .subscribe(([layers, layersDB]) => {
        this.thermalLayers = layers;
        this.thermalLayersDB = layersDB;

        if (this.thermalLayers.length > 0 && this.thermalLayersDB.length > 0) {
          // establecemos el indice seleccinado
          this.indexSelected = this.thermalLayersDB.length - 1;

          // le damos el tamaño de la capa termica seleccionada
          this.thermalService.sliderMin = new Array(this.thermalLayersDB.length).fill(null);
          this.thermalService.sliderMax = new Array(this.thermalLayersDB.length).fill(null);

          // iniciamos cada capa
          this.thermalLayersDB.forEach((layerDB) => this.setInitialValues(layerDB.informeId));
        }
      });

    this.subscriptions.add(
      this.thermalService.sliderMin$.subscribe((value) => {
        const minValue = value[this.indexSelected];

        if (minValue) {
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
      const index = this.thermalLayersDB.findIndex((layerDB) => layerDB.informeId === this.informeId);

      if (index !== -1) {
        this.indexSelected = index;

        const selectedThermalLayer = this.thermalLayersDB[this.indexSelected];

        this.optionsTemp = {
          floor: selectedThermalLayer.rangeTempMin,
          ceil: selectedThermalLayer.rangeTempMax,
          translate: this.optionsTemp.translate,
        };

        this.setInitialValues(this.informeId);

        // this.refreshNonSelectedLayers();
      }
    }
  }

  setInitialValues(informeId: string) {
    const indexInforme = this.thermalLayersDB.findIndex((layerDB) => layerDB.informeId === informeId);
    const layerInforme = this.thermalLayers.find((layer) => layer.getProperties().informeId === informeId);

    // asignamos los valores de forma automatica
    const { tempMin, tempMax } = this.getInitialTempsLayer(informeId);

    if (informeId === this.informeId) {
      this.lowTemp = tempMin;
      this.highTemp = tempMax;
    }

    this.setSliderMinValue(tempMin, indexInforme);
    this.setSliderMaxValue(tempMax, indexInforme);

    // refrescamos la capa termica selecionada
    if (layerInforme) {
      layerInforme.getSource().changed();
    }
  }

  private refreshNonSelectedLayers() {
    if (this.thermalLayers.length > 0) {
      this.thermalLayers.forEach((layer) => {
        if (layer.getProperties().informeId !== this.informeId) {
          this.setInitialValues(layer.getProperties().informeId);
          layer.getSource().changed();
        }
      });
    }
  }

  private getInitialTempsLayer(informeId: string): any {
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

    return { tempMin, tempMax };
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
