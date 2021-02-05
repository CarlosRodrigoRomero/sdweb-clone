import { Component, OnInit } from '@angular/core';
import { MapControlService } from '../services/map-control.service';
import { LabelType, Options } from '@angular-slider/ngx-slider';
import { MatSliderChange } from '@angular/material/slider';

@Component({
  selector: 'app-map-control',
  templateUrl: './map-control.component.html',
  styleUrls: ['./map-control.component.scss'],
})
export class MapControlComponent implements OnInit {
  temporalValue: number = 100;
  lowValue: number = 25;
  highValue: number = 75;
  options: Options = {
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
  optionsTemporalSlider: Options = {
    floor: 0,
    ceil: 100,
  };

  constructor(private mapControlService: MapControlService) {}

  ngOnInit(): void {}
  onChangeSlider(highValue: number, lowValue: number) {
    this.mapControlService.sliderMax = highValue;
    this.mapControlService.sliderMin = lowValue;
  }
  onChangeThermalOpacitySlider(e: MatSliderChange) {
    this.mapControlService.sliderThermalOpacity = e.value;
  }
  onChangeTemporalSlider(value: number) {
    this.mapControlService.sliderTemporal = value;
  }
}
