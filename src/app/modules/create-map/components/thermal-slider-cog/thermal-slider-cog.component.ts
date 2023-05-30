import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';

import { LabelType, Options } from '@angular-slider/ngx-slider';

import { Subscription } from 'rxjs';

import { CreateMapService } from '@data/services/create-map.service';

@Component({
  selector: 'app-thermal-slider-cog',
  templateUrl: './thermal-slider-cog.component.html',
  styleUrls: ['./thermal-slider-cog.component.scss'],
})
export class ThermalSliderCogComponent implements OnInit, OnDestroy {
  /* Valores de inicio */
  lowTemp = 25;
  highTemp = 75;
  optionsTemp: Options = {
    floor: 0,
    ceil: 120,
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

  private subscriptions: Subscription = new Subscription();

  constructor(private createMapService: CreateMapService) {}

  ngOnInit(): void {
    this.subscriptions.add(this.createMapService.sliderMin$.subscribe((value) => (this.lowTemp = value)));

    this.subscriptions.add(this.createMapService.sliderMax$.subscribe((value) => (this.highTemp = value)));
  }

  setInitialValues() {
    let [tempMin, tempMax] = [25, 75];

    this.setSliderMinValue(tempMin);
    this.setSliderMaxValue(tempMax);
  }

  onChangeTemperatureSlider(lowValue: number, highValue: number) {
    this.setSliderMinValue(lowValue);
    this.setSliderMaxValue(highValue);
  }

  private setSliderMinValue(lowValue: number) {
    this.createMapService.sliderMin = lowValue;
  }

  private setSliderMaxValue(highValue: number) {
    this.createMapService.sliderMax = highValue;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
