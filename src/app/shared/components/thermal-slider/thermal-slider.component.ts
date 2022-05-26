import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';

import { LabelType, Options } from '@angular-slider/ngx-slider';

import { take } from 'rxjs/operators';
import { combineLatest, Subscription } from 'rxjs';

import TileLayer from 'ol/layer/Tile';

import { OlMapService } from '@data/services/ol-map.service';
import { ThermalService } from '@data/services/thermal.service';
import { ReportControlService } from '@data/services/report-control.service';
import { InformeService } from '@data/services/informe.service';

import { ThermalLayerInterface } from '@core/models/thermalLayer';
import { MathOperations } from '@core/classes/math-operations';

@Component({
  selector: 'app-thermal-slider',
  templateUrl: './thermal-slider.component.html',
  styleUrls: ['./thermal-slider.component.scss'],
})
export class ThermalSliderComponent implements OnInit, OnChanges, OnDestroy {
  private thermalLayers: TileLayer[];
  private selectedThermalLayer: ThermalLayerInterface;

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
    private router: Router,
    private informeService: InformeService
  ) {}

  ngOnInit(): void {
    // capas termicas del mapa
    this.subscriptions.add(this.olMapService.getThermalLayers().subscribe((layers) => (this.thermalLayers = layers)));

    this.subscriptions.add(
      this.thermalService.sliderMax$.subscribe((value) => {
        this.highTemp = value;
        this.thermalLayers.forEach((tl) => {
          tl.getSource().changed();
        });
      })
    );

    this.subscriptions.add(
      this.thermalService.sliderMin$.subscribe((value) => {
        this.lowTemp = value;
        this.thermalLayers.forEach((tl) => {
          tl.getSource().changed();
        });
      })
    );

    this.setInitialValues();

    // PLANTA NUEVO CLIENTE
    const informeId = this.router.url.split('/')[this.router.url.split('/').length - 1];
    if (this.reportControlService.plantaId === '3JXI01XmcE3G1d4WNMMd' || informeId === 'EQKwnkexFVUJ5YLZfHsM') {
      this.optionsTemp.floor = 0;
      this.thermalService.sliderMin = 0;
      this.thermalService.sliderMax = 50;
      this.lowTemp = 0;
      this.highTemp = 50;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.informeId) {
      this.thermalService
        .getReportThermalLayerDB(this.informeId)
        .pipe(take(1))
        .subscribe((layers) => {
          this.selectedThermalLayer = layers[0];

          this.optionsTemp = {
            floor: this.selectedThermalLayer.rangeTempMin,
            ceil: this.selectedThermalLayer.rangeTempMax,
            translate: this.optionsTemp.translate,
          };
        });
    }
  }

  setInitialValues() {
    this.informeService
      .getInforme(this.informeId)
      .pipe(take(1))
      .subscribe((informe) => {
        // const anomaliasInforme = this.reportControlService.allAnomalias.filter(
        //   (anom) => anom.informeId === this.informeId
        // );
        // const tempRefMedia = Math.round(MathOperations.average(anomaliasInforme.map((anom) => anom.temperaturaRef)));

        // asignamos los valores de forma automatica
        if (informe.temperatura /* tempRefMedia */ - 10 < this.optionsTemp.floor) {
          this.thermalService.sliderMin = this.optionsTemp.floor;
        } else {
          this.thermalService.sliderMin = informe.temperatura /* tempRefMedia */ - 10;
        }
        if (informe.temperatura /* tempRefMedia */ + 40 > this.optionsTemp.ceil) {
          this.thermalService.sliderMax = this.optionsTemp.ceil;
        } else {
          this.thermalService.sliderMax = informe.temperatura /* tempRefMedia */ + 40;
        }
      });
  }

  onChangeTemperatureSlider(lowValue: number, highValue: number) {
    this.thermalService.sliderMax = highValue;
    this.thermalService.sliderMin = lowValue;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
