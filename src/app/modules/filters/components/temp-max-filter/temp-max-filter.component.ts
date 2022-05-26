import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { LabelType, Options, PointerType } from '@angular-slider/ngx-slider';

import { FilterService } from '@data/services/filter.service';
import { FilterControlService } from '@data/services/filter-control.service';
import { ReportControlService } from '@data/services/report-control.service';

import { TempMaxFilter } from '@core/models/tempMaxFilter';
import { Anomalia } from '@core/models/anomalia';
import { Seguidor } from '@core/models/seguidor';

@Component({
  selector: 'app-temp-max-filter',
  templateUrl: './temp-max-filter.component.html',
  styleUrls: ['./temp-max-filter.component.css'],
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
    let anomalias: Anomalia[] = [];
    if (this.reportControlService.plantaFija) {
      anomalias = this.reportControlService.allFilterableElements as Anomalia[];
    } else {
      this.reportControlService.allFilterableElements.forEach((elem) => {
        const seguidor = elem as Seguidor;
        if (seguidor.anomaliasCliente.length > 0) {
          anomalias.push(...seguidor.anomaliasCliente);
        }
      });
    }
    anomalias = anomalias.sort((a, b) => a.temperaturaMax - b.temperaturaMax);
    this.floor = Math.round(anomalias[0].temperaturaMax);
    this.ceil = Math.round(anomalias[anomalias.length - 1].temperaturaMax);

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
        return '#455a64';
      },
      getPointerColor: (value: number, pointerType: PointerType.Min | PointerType.Max): string => {
        if (value !== this.floor) {
          if (value !== this.ceil) {
            return '#455a64';
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
