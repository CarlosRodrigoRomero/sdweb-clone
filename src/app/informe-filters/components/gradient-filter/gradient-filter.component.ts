import { Component, OnInit } from '@angular/core';

import { MatSliderChange } from '@angular/material/slider';

import { FilterService } from '@core/services/filter.service';

import { GradientFilter } from '@core/models/gradientFilter';

@Component({
  selector: 'app-gradient-filter',
  templateUrl: './gradient-filter.component.html',
  styleUrls: ['./gradient-filter.component.css'],
})
export class GradientFilterComponent implements OnInit {
  minGradiente: number;
  maxGradiente: number;
  rangoMinGradiente: number;
  filtroGradiente: GradientFilter;

  constructor(private filterService: FilterService) {}

  ngOnInit(): void {}

  formatLabel(value: number | null) {
    if (!value) {
      return this.rangoMinGradiente;
    }
    return value + 'ºC';
  }

  onInputFiltroGradiente(event: MatSliderChange) {
    this.rangoMinGradiente = event.value;
  }

  onChangeFiltroGradiente() {
    this.filtroGradiente = new GradientFilter('gradient', this.rangoMinGradiente, this.maxGradiente);
    if (this.rangoMinGradiente === this.minGradiente) {
      // si se selecciona el mínimo desactivamos el filtro ...
      this.filterService.deleteFilter(this.filtroGradiente);
    } else {
      // ... si no, lo añadimos
      this.filterService.addFilter(this.filtroGradiente);
    }
  }
}
