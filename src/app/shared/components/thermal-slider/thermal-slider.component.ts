import { Component, OnInit } from '@angular/core';

import { LabelType, Options } from '@angular-slider/ngx-slider';

import TileLayer from 'ol/layer/Tile';

import { OlMapService } from '@core/services/ol-map.service';
import { ThermalService } from '@core/services/thermal.service';

@Component({
  selector: 'app-thermal-slider',
  templateUrl: './thermal-slider.component.html',
  styleUrls: ['./thermal-slider.component.scss'],
})
export class ThermalSliderComponent implements OnInit {
  private thermalLayers: TileLayer[];

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
    this.olMapService.getThermalLayers().subscribe((layers) => (this.thermalLayers = layers));

    this.thermalService.sliderMaxSource.subscribe(() => {
      this.thermalLayers.forEach((tl) => {
        tl.getSource().changed();
      });
    });
    this.thermalService.sliderMinSource.subscribe(() => {
      this.thermalLayers.forEach((tl) => {
        tl.getSource().changed();
      });
    });
  }

  onChangeTemperatureSlider(lowValue: number, highValue: number) {
    this.thermalService.sliderMax = highValue;
    this.thermalService.sliderMin = lowValue;
  }
}
