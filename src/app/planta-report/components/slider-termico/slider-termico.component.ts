import { Component, OnInit } from '@angular/core';

import { LabelType, Options } from '@angular-slider/ngx-slider';

import TileLayer from 'ol/layer/Tile';

import { OlMapService } from '@core/services/ol-map.service';
import { MapControlService } from '../../services/map-control.service';

@Component({
  selector: 'app-slider-termico',
  templateUrl: './slider-termico.component.html',
  styleUrls: ['./slider-termico.component.scss'],
})
export class SliderTermicoComponent implements OnInit {
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

  constructor(private mapControlService: MapControlService, private olMapService: OlMapService) {}

  ngOnInit(): void {
    this.olMapService.getThermalLayers().subscribe((layers) => (this.thermalLayers = layers));

    this.mapControlService.sliderMaxSource.subscribe(() => {
      this.thermalLayers.forEach((tl) => {
        tl.getSource().changed();
      });
    });
    this.mapControlService.sliderMinSource.subscribe(() => {
      this.thermalLayers.forEach((tl) => {
        tl.getSource().changed();
      });
    });
  }

  onChangeTemperatureSlider(lowValue: number, highValue: number) {
    this.mapControlService.sliderMax = highValue;
    this.mapControlService.sliderMin = lowValue;
  }
}
