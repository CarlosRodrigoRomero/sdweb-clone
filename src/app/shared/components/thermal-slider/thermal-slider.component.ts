import { Component, OnDestroy, OnInit } from '@angular/core';

import { LabelType, Options } from '@angular-slider/ngx-slider';

import { Subscription } from 'rxjs';

import TileLayer from 'ol/layer/Tile';

import { OlMapService } from '@core/services/ol-map.service';
import { ThermalService } from '@core/services/thermal.service';

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

  constructor(private thermalService: ThermalService, private olMapService: OlMapService) {}

  ngOnInit(): void {
    this.subscriptions.add(this.olMapService.getThermalLayers().subscribe((layers) => (this.thermalLayers = layers)));

    this.subscriptions.add(
      this.thermalService.sliderMaxSource.subscribe(() => {
        this.thermalLayers.forEach((tl) => {
          tl.getSource().changed();
        });
      })
    );

    this.subscriptions.add(
      this.thermalService.sliderMinSource.subscribe(() => {
        this.thermalLayers.forEach((tl) => {
          tl.getSource().changed();
        });
      })
    );
  }

  onChangeTemperatureSlider(lowValue: number, highValue: number) {
    this.thermalService.sliderMax = highValue;
    this.thermalService.sliderMin = lowValue;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
