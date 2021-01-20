import { Component, OnInit } from '@angular/core';

import { GLOBAL } from '@core/services/global';
import { PcService } from '@core/services/pc.service';
import { FilterService } from '@core/services/filter.service';

import { MatSliderChange } from '@angular/material/slider';

import { GradientFilter } from '@core/models/gradientFilter';
import { Console } from 'console';

@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.css'],
})
export class FiltersComponent implements OnInit {
  public minGradiente: number;
  public maxGradiente: number;
  public valorGradiente: number;
  public filtroGradiente: GradientFilter;

  constructor(private pcService: PcService, private filterService: FilterService) {}

  ngOnInit(): void {
    // Setear min y max gradiente
    this.maxGradiente = GLOBAL.maxGradiente;
    this.minGradiente = GLOBAL.minGradiente;

    // this.pcService.filtroGradiente$.subscribe((e) => (this.valorGradiente = e));
  }

  formatLabel(value: number | null) {
    if (!value) {
      return this.valorGradiente;
    }

    if (value >= 1000) {
      return Math.round(value / 1000) + ' ºC';
    }

    return value;
  }

  onInputFiltroGradiente(event: MatSliderChange) {
    this.valorGradiente = event.value;
  }

  onChangeFiltroGradiente() {
    // this.pcService.PushFiltroGradiente(this.valorGradiente);

    this.filtroGradiente = new GradientFilter(this.valorGradiente);
    this.filterService.addFilter(this.filtroGradiente);
  }
}
