import { Component, OnInit } from '@angular/core';

import { GLOBAL } from '@core/services/global';
import { PcService } from '@core/services/pc.service';
import { FilterService } from '@core/services/filter.service';

import { MatSliderChange } from '@angular/material/slider';

import { GradientFilter } from '@core/models/gradientFilter';
import { TempMaxFilter } from '@core/models/tempMaxFilter';
import { PerdidasFilter } from '@core/models/perdidasFilter';

@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.css'],
})
export class FiltersComponent implements OnInit {
  minGradiente: number;
  maxGradiente: number;
  rangoMinGradiente: number;
  filtroGradiente: GradientFilter;

  minTemp: number;
  maxTemp: number;
  rangoMinTemp: number;
  filtroTempMax: TempMaxFilter;

  rangoMinPerdidas: number;
  filtroPerdidas: PerdidasFilter;

  constructor(private pcService: PcService, private filterService: FilterService) {}

  ngOnInit(): void {
    // Setear datos min y max
    this.maxGradiente = GLOBAL.maxGradiente;
    this.minGradiente = GLOBAL.minGradiente;
    this.maxTemp = this.pcService.getTempMaxAllPcs();
    this.minTemp = 0;
  }

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
    this.filterService.addFilter(this.filtroGradiente);
  }

  onInputFiltroTempMax(event: MatSliderChange) {
    this.rangoMinTemp = event.value;
  }

  onChangeFiltroTempMax() {
    this.filtroTempMax = new TempMaxFilter('tempMax', this.rangoMinTemp, this.maxTemp);
    this.filterService.addFilter(this.filtroTempMax);
  }

  onInputFiltroPerdidas(event: MatSliderChange) {
    this.rangoMinPerdidas = event.value;
  }

  onChangeFiltroPerdidas() {
    this.filtroPerdidas = new PerdidasFilter('perdidas', this.rangoMinPerdidas, 100);
    this.filterService.addFilter(this.filtroPerdidas);
  }

  formatLabelPerdidas(value: number | null) {
    if (!value) {
      return this.rangoMinGradiente;
    }

    return value + ' %';
  }
}
