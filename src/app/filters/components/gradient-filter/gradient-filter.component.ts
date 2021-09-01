import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { LabelType, Options, PointerType } from '@angular-slider/ngx-slider';

import { FilterService } from '@core/services/filter.service';
import { FilterControlService } from '@core/services/filter-control.service';

import { GradientFilter } from '@core/models/gradientFilter';

@Component({
  selector: 'app-gradient-filter',
  templateUrl: './gradient-filter.component.html',
  styleUrls: ['./gradient-filter.component.css'],
})
export class GradientFilterComponent implements OnInit, OnDestroy {
  minGradiente = 0;
  maxGradiente = 80;
  rangoMinGradiente: number;
  rangoMaxGradiente: number;
  filtroGradiente: GradientFilter;
  options: Options;

  private subscriptions: Subscription = new Subscription();

  constructor(private filterService: FilterService, private filterControlService: FilterControlService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.filterControlService.minGradienteSource.subscribe((value) => (this.rangoMinGradiente = value))
    );
    this.subscriptions.add(
      this.filterControlService.maxGradienteSource.subscribe((value) => (this.rangoMaxGradiente = value))
    );

    this.options = {
      floor: this.minGradiente,
      ceil: this.maxGradiente,
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
        if (minValue === this.minGradiente && maxValue === this.maxGradiente) {
          return '#c4c4c4';
        }
        return '#455a64';
      },
      getPointerColor: (value: number, pointerType: PointerType.Min | PointerType.Max): string => {
        if (value !== this.minGradiente) {
          if (value !== this.maxGradiente) {
            return '#455a64';
          }
        }
      },
    };
  }

  onChangeFiltroGradiente(lowValue: number, highValue: number) {
    // crea el fitro
    this.filtroGradiente = new GradientFilter('gradient', this.rangoMinGradiente, this.rangoMaxGradiente);

    // se asocian los valores al control para acceder a ellos desde otras partes
    this.filterControlService.minGradiente = lowValue;
    this.filterControlService.maxGradiente = highValue;

    if (this.rangoMinGradiente === this.minGradiente && this.rangoMaxGradiente === this.maxGradiente) {
      // si se selecciona el mínimo desactivamos el filtro ...
      this.filterService.deleteFilter(this.filtroGradiente);
    } else {
      // ... si no, lo añadimos
      this.filterService.addFilter(this.filtroGradiente);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
