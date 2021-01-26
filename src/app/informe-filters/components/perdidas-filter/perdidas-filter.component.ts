import { Component, OnInit } from '@angular/core';

import { MatSliderChange } from '@angular/material/slider';

import { PerdidasFilter } from '@core/models/perdidasFilter';

import { FilterService } from '@core/services/filter.service';

import { Options } from '@angular-slider/ngx-slider';

@Component({
  selector: 'app-perdidas-filter',
  templateUrl: './perdidas-filter.component.html',
  styleUrls: ['./perdidas-filter.component.scss'],
})
export class PerdidasFilterComponent implements OnInit {
  rangoMinPerdidas: number;
  rangoMaxPerdidas: number;
  filtroPerdidas: PerdidasFilter;
  options: Options = { floor: 0, ceil: 100 };

  constructor(private filterService: FilterService) {
    this.rangoMinPerdidas = 0;
    this.rangoMaxPerdidas = 100;
  }

  ngOnInit(): void {}

  /* onInputFiltroPerdidas(event: MatSliderChange) {
    this.rangoMinPerdidas = event.value;
  } */

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

  formatLabelPerdidas(value: number | null) {
    if (!value) {
      return this.rangoMinPerdidas;
    }
    return value + ' %';
  }
}
