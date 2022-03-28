import { Component, OnDestroy, OnInit } from '@angular/core';

import { LabelType, Options } from '@angular-slider/ngx-slider';

import { Subscription } from 'rxjs';

import TileLayer from 'ol/layer/Tile';

import { OlMapService } from '@core/services/ol-map.service';
import { ThermalService } from '@core/services/thermal.service';
import { ReportControlService } from '@core/services/report-control.service';

@Component({
  selector: 'app-thermal-slider',
  templateUrl: './thermal-slider.component.html',
  styleUrls: ['./thermal-slider.component.scss'],
})
export class ThermalSliderComponent implements OnInit, OnDestroy {
  private thermalLayers: TileLayer[];
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
    this.subscriptions.add(this.olMapService.getThermalLayers().subscribe((layers) => (this.thermalLayers = layers)));

    this.subscriptions.add(
      this.thermalService.sliderMax$.subscribe(() => {
        this.thermalLayers.forEach((tl) => {
          tl.getSource().changed();
        });
      })
    );

    this.subscriptions.add(
      this.thermalService.sliderMin$.subscribe(() => {
        this.thermalLayers.forEach((tl) => {
          tl.getSource().changed();
        });
      })
    );

    // PLANTA NUEVO CLIENTE
    if (this.reportControlService.plantaId === '3JXI01XmcE3G1d4WNMMd') {
      this.optionsTemp.floor = 0;
      this.thermalService.sliderMin = 0;
      this.thermalService.sliderMax = 50;
      this.lowTemp = 0;
      this.highTemp = 50;
    }
  }

  onChangeTemperatureSlider(lowValue: number, highValue: number) {
    this.thermalService.sliderMax = highValue;
    this.thermalService.sliderMin = lowValue;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
