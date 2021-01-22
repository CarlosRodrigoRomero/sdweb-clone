import { Component, OnInit } from '@angular/core';

import { GLOBAL } from '@core/services/global';
import { PcService } from '@core/services/pc.service';
import { FilterService } from '@core/services/filter.service';

import { MatSliderChange } from '@angular/material/slider';

import { GradientFilter } from '@core/models/gradientFilter';
import { TempMaxFilter } from '@core/models/tempMaxFilter';
import { PerdidasFilter } from '@core/models/perdidasFilter';

export interface TipoPc {
  label: string;
  completed: boolean;
  tiposPcs?: TipoPc[];
}

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

  tiposTask: TipoPc;
  tiposPcs: TipoPc[];
  allComplete: boolean;

  constructor(private pcService: PcService, private filterService: FilterService) {
    console.log(this.pcService.getLabelsTipoPcs());
  }

  ngOnInit(): void {
    // Setear datos min y max
    this.maxGradiente = GLOBAL.maxGradiente;
    this.minGradiente = GLOBAL.minGradiente;
    this.maxTemp = this.pcService.getTempMaxAllPcs();
    this.minTemp = 0;
    this.pcService.getLabelsTipoPcs().forEach((label) =>
      this.tiposPcs.push({
        label,
        completed: false,
      })
    );
    this.tiposTask = {
      label: 'Todos',
      completed: false,
      tiposPcs: this.tiposPcs,
    };

    this.allComplete = false;
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
    if (this.rangoMinGradiente === this.minGradiente) {
      // si se selecciona el mínimo desactivamos el filtro ...
      this.filterService.deleteFilter(this.filtroGradiente);
    } else {
      // ... si no, lo añadimos
      this.filterService.addFilter(this.filtroGradiente);
    }
  }

  onInputFiltroTempMax(event: MatSliderChange) {
    this.rangoMinTemp = event.value;
  }

  onChangeFiltroTempMax() {
    this.filtroTempMax = new TempMaxFilter('tempMax', this.rangoMinTemp, this.maxTemp);
    if (this.rangoMinTemp === this.minTemp) {
      // si se selecciona el mínimo desactivamos el filtro ...
      this.filterService.deleteFilter(this.filtroTempMax);
    } else {
      // ... si no, lo añadimos
      this.filterService.addFilter(this.filtroTempMax);
    }
  }

  onInputFiltroPerdidas(event: MatSliderChange) {
    this.rangoMinPerdidas = event.value;
  }

  onChangeFiltroPerdidas() {
    this.filtroPerdidas = new PerdidasFilter('perdidas', this.rangoMinPerdidas, 100);
    if (this.rangoMinPerdidas === 0) {
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

  /* FILTROS DE TIPO DE ANOMALÍA */

  /* someComplete(): boolean {
    if (this.task.subtasks == null) {
      return false;
    }
    return this.task.subtasks.filter((t) => t.completed).length > 0 && !this.allComplete;
  }

  updateAllComplete() {
    this.allComplete = this.tiposPcs != null && this.tiposPcs.every((t) => t.completed);
  } */
}
