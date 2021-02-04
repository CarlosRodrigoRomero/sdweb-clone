import { Component, OnInit } from '@angular/core';

import { PerdidasFilter } from '@core/models/perdidasFilter';

import { FilterService } from '@core/services/filter.service';

import { LabelType, Options } from '@angular-slider/ngx-slider';

@Component({
  selector: 'app-perdidas-filter',
  templateUrl: './perdidas-filter.component.html',
  styleUrls: ['./perdidas-filter.component.scss'],
})
export class PerdidasFilterComponent implements OnInit {
  rangoMinPerdidas: number;
  rangoMaxPerdidas: number;
  filtroPerdidas: PerdidasFilter;
  options: Options = {
    floor: 0,
    ceil: 100,
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
  };

  constructor(private filterService: FilterService) {
    this.rangoMinPerdidas = 0;
    this.rangoMaxPerdidas = 100;
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
