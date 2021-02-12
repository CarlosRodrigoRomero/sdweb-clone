import { Component, OnInit } from '@angular/core';

import { PerdidasFilter } from '@core/models/perdidasFilter';

import { FilterService } from '@core/services/filter.service';

import { LabelType, Options, PointerType } from '@angular-slider/ngx-slider';

@Component({
  selector: 'app-perdidas-filter',
  templateUrl: './perdidas-filter.component.html',
  styleUrls: ['./perdidas-filter.component.scss'],
})
export class PerdidasFilterComponent implements OnInit {
  minPerdidas = 0;
  maxPerdidas = 100;
  rangoMinPerdidas: number;
  rangoMaxPerdidas: number;
  filtroPerdidas: PerdidasFilter;
  options: Options = {
    floor: this.minPerdidas,
    ceil: this.maxPerdidas,
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
      return '#455a64';
    },
    getPointerColor: (value: number, pointerType: PointerType.Min | PointerType.Max): string => {
      if (value !== this.minPerdidas) {
        if (value !== this.maxPerdidas) {
          return '#455a64';
        }
      }
    },
  };

  constructor(private filterService: FilterService) {
    this.rangoMinPerdidas = this.minPerdidas;
    this.rangoMaxPerdidas = this.maxPerdidas;
  }

  ngOnInit(): void {}

  onChangeFiltroPerdidas() {
    this.filtroPerdidas = new PerdidasFilter('perdidas', this.rangoMinPerdidas, this.rangoMaxPerdidas);

    if (this.rangoMinPerdidas === 0 && this.rangoMaxPerdidas === 100) {
      // si se selecciona el mínimo desactivamos el filtro ...
      this.filterService.deleteFilter(this.filtroPerdidas);
    } else {
      // ... si no, lo añadimos
      this.filterService.addFilter(this.filtroPerdidas);
    }
  }
}
