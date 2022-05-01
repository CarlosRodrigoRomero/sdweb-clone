import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { LabelType, Options, PointerType } from '@angular-slider/ngx-slider';

import { FilterService } from '@data/services/filter.service';
import { FilterControlService } from '@data/services/filter-control.service';

import { TempMaxFilter } from '@core/models/tempMaxFilter';

@Component({
  selector: 'app-temp-max-filter',
  templateUrl: './temp-max-filter.component.html',
  styleUrls: ['./temp-max-filter.component.css'],
})
export class TempMaxFilterComponent implements OnInit, OnDestroy {
  minTemp = 50;
  maxTemp = 120;
  rangoMinTemp: number;
  rangoMaxTemp: number;
  filtroTempMax: TempMaxFilter;
  options: Options;

  private subscriptions: Subscription = new Subscription();

  constructor(private filterService: FilterService, private filterControlService: FilterControlService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.filterControlService.minTempMaxSource.subscribe((value) => (this.rangoMinTemp = value))
    );
    this.subscriptions.add(
      this.filterControlService.maxTempMaxSource.subscribe((value) => (this.rangoMaxTemp = value))
    );

    this.options = {
      floor: this.minTemp,
      ceil: this.maxTemp,
      step: 2,
      translate: (value: number, label: LabelType): string => {
        switch (label) {
          case LabelType.Low:
            return value + 'ºC';
          case LabelType.High:
            return value + 'ºC';
          default:
            return value + 'ºC';
        }
      },
      getSelectionBarColor: (minValue: number, maxValue: number): string => {
        if (minValue === this.minTemp && maxValue === this.maxTemp) {
          return '#c4c4c4';
        }
        return '#455a64';
      },
      getPointerColor: (value: number, pointerType: PointerType.Min | PointerType.Max): string => {
        if (value !== this.minTemp) {
          if (value !== this.maxTemp) {
            return '#455a64';
          }
        }
      },
    };
  }

  onChangeFiltroTempMax(lowValue: number, highValue: number) {
    // crea el fitro
    this.filtroTempMax = new TempMaxFilter('tempMax', lowValue, highValue);

    // se asocian los valores al control para acceder a ellos desde otras partes
    this.filterControlService.minTempMax = lowValue;
    this.filterControlService.maxTempMax = highValue;

    if (this.rangoMinTemp === this.minTemp && this.rangoMaxTemp === this.maxTemp) {
      // si se selecciona el mínimo desactivamos el filtro ...
      this.filterService.deleteFilter(this.filtroTempMax);
    } else {
      // ... si no, lo añadimos
      this.filterService.addFilter(this.filtroTempMax);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
