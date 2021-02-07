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
  private informesList: string[];
  /* Slider Temperatura */
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

  /* Slider Año */
  currentYear = 100;
  dates = ['Julio 2019', 'Agosto 2020'];
  optionsTemporalSlider: Options = {
    floor: 0,
    ceil: 100,
    showTicksValues: true,
    step: 100,
    translate: (value: number, label: LabelType): string => {
      return this.dates[value / 100];
    },
  };

  constructor(private mapControlService: MapControlService) {}

  ngOnInit(): void {
    this.informesList = ['4ruzdxY6zYxvUOucACQ0', 'vfMHFBPvNFnOFgfCgM9L'];
  }

  onChangeTemperatureSlider(highValue: number, lowValue: number) {
    this.mapControlService.sliderMax = highValue;
    this.mapControlService.sliderMin = lowValue;
  }
  onChangeThermalOpacitySlider(e: MatSliderChange) {
    this.mapControlService.sliderThermalOpacity = e.value;
  }
  onChangeTemporalSlider(value: number) {
    this.mapControlService.sliderTemporal = value;
    const roundedValue = Math.round(value / 100);
    this.mapControlService.selectedInformeId = this.informesList[roundedValue];
  }

  indexToDate(index: number) {}
}
