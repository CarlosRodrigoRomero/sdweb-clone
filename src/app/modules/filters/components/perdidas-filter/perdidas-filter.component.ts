import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { LabelType, Options, PointerType } from '@angular-slider/ngx-slider';

import { FilterService } from '@data/services/filter.service';
import { FilterControlService } from '@data/services/filter-control.service';

import { PerdidasFilter } from '@core/models/perdidasFilter';

import { COLOR } from '@data/constants/color';

@Component({
  selector: 'app-perdidas-filter',
  templateUrl: './perdidas-filter.component.html',
  styleUrls: ['./perdidas-filter.component.scss'],
})
export class PerdidasFilterComponent implements OnInit, OnDestroy {
  minPerdidas = 0;
  maxPerdidas = 100;
  rangoMinPerdidas: number;
  rangoMaxPerdidas: number;
  filtroPerdidas: PerdidasFilter;
  options: Options;

  private subscriptions: Subscription = new Subscription();

  constructor(private filterService: FilterService, private filterControlService: FilterControlService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.filterControlService.minPerdidasSource.subscribe((value) => (this.rangoMinPerdidas = value))
    );

    this.subscriptions.add(
      this.filterControlService.maxPerdidasSource.subscribe((value) => (this.rangoMaxPerdidas = value))
    );

    this.options = {
      floor: this.minPerdidas,
      ceil: this.maxPerdidas,
      step: this.maxPerdidas / 100,
      translate: (value: number, label: LabelType): string => {
        switch (label) {
          case LabelType.Low:
            return value + '%';
          case LabelType.High:
            return value + '%';
          default:
            return value + '%';
        }
      },
      getSelectionBarColor: (minValue: number, maxValue: number): string => {
        if (minValue === this.minPerdidas && maxValue === this.maxPerdidas) {
          return '#c4c4c4';
        }
        return COLOR.color_rojo_interfaz;
      },
      getPointerColor: (value: number, pointerType: PointerType.Min | PointerType.Max): string => {
        if (value !== this.minPerdidas) {
          if (value !== this.maxPerdidas) {
            return COLOR.color_rojo_interfaz;
          }
        }
      },
    };
  }

  onChangeFiltroPerdidas(lowValue: number, highValue: number) {
    // crea el fitro
    this.filtroPerdidas = new PerdidasFilter('perdidas', lowValue, highValue);

    // se asocian los valores al control para acceder a ellos desde otras partes
    this.filterControlService.minPerdidas = lowValue;
    this.filterControlService.maxPerdidas = highValue;

    if (this.rangoMinPerdidas === this.minPerdidas && this.rangoMaxPerdidas === this.maxPerdidas) {
      // si se selecciona el mínimo desactivamos el filtro ...
      this.filterService.deleteFilter(this.filtroPerdidas);
    } else {
      // ... si no, lo añadimos
      this.filterService.addFilter(this.filtroPerdidas);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
