import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { LabelType, Options, PointerType } from '@angular-slider/ngx-slider';

import { FilterService } from '@data/services/filter.service';
import { FilterControlService } from '@data/services/filter-control.service';
import { ReportControlService } from '@data/services/report-control.service';

import { TempMaxFilter } from '@core/models/tempMaxFilter';

import { COLOR } from '@data/constants/color';

@Component({
  selector: 'app-temp-max-filter',
  templateUrl: './temp-max-filter.component.html',
  styleUrls: ['./temp-max-filter.component.scss'],
})
export class TempMaxFilterComponent implements OnInit, OnDestroy {
  floor = 50;
  ceil = 120;
  minTemp: number;
  maxTemp: number;
  filtroTempMax: TempMaxFilter;
  options: Options;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private filterService: FilterService,
    private filterControlService: FilterControlService,
    private reportControlService: ReportControlService
  ) {}

  ngOnInit(): void {
    const anomalias = this.reportControlService.allAnomalias.sort((a, b) => a.temperaturaMax - b.temperaturaMax);
    const calculateFloor = Math.round(anomalias[0].temperaturaMax);
    if (calculateFloor !== undefined && calculateFloor !== null && !isNaN(calculateFloor)) {
      this.floor = calculateFloor;
    }
    const calculateCeil = Math.round(anomalias[anomalias.length - 1].temperaturaMax);
    if (calculateCeil !== undefined && calculateCeil !== null && !isNaN(calculateCeil)) {
      this.ceil = calculateCeil;
    }

    this.filterControlService.minTempMaxDefault = this.floor;
    this.filterControlService.maxTempMaxDefault = this.ceil;
    this.filterControlService.minTempMax = this.floor;
    this.filterControlService.maxTempMax = this.ceil;

    this.options = {
      floor: this.filterControlService.minTempMaxDefault,
      ceil: this.filterControlService.maxTempMaxDefault,
      step: 1,
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
        if (minValue === this.floor && maxValue === this.ceil) {
          return '#c4c4c4';
        }
        return COLOR.color_rojo_interfaz;
      },
      getPointerColor: (value: number, pointerType: PointerType.Min | PointerType.Max): string => {
        if (value !== this.floor) {
          if (value !== this.ceil) {
            return COLOR.color_rojo_interfaz;
          }
        }
      },
    };

    this.subscriptions.add(this.filterControlService.minTempMaxSource.subscribe((value) => (this.minTemp = value)));
    this.subscriptions.add(this.filterControlService.maxTempMaxSource.subscribe((value) => (this.maxTemp = value)));
  }

  onChangeFiltroTempMax(lowValue: number, highValue: number) {
    // crea el fitro
    this.filtroTempMax = new TempMaxFilter('tempMax', lowValue, highValue);

    // se asocian los valores al control para acceder a ellos desde otras partes
    this.filterControlService.minTempMax = lowValue;
    this.filterControlService.maxTempMax = highValue;

    if (this.minTemp === this.floor && this.maxTemp === this.ceil) {
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
