import { Component, OnInit } from '@angular/core';

import { GLOBAL } from '@core/services/global';
import { PcService } from '@core/services/pc.service';
import { FilterService } from '@core/services/filter.service';

import { MatSliderChange } from '@angular/material/slider';

import { GradientFilter } from '@core/models/gradientFilter';
import { TempMaxFilter } from '@core/models/tempMaxFilter';
import { PerdidasFilter } from '@core/models/perdidasFilter';
import { TipoPcFilter } from '@core/models/tipoPcFilter';
import { MatCheckboxChange } from '@angular/material/checkbox';

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
  tiposPcs: TipoPc[] = [];
  allComplete: boolean;
  filtroTipo: TipoPcFilter;

  constructor(private pcService: PcService, private filterService: FilterService) {}

  ngOnInit(): void {
    // Setear datos min y max
    this.maxGradiente = GLOBAL.maxGradiente;
    this.minGradiente = GLOBAL.minGradiente;
    this.maxTemp = this.pcService.getTempMaxAllPcs();
    this.minTemp = 0;
    this.pcService.getLabelsTipoPcs().forEach((label) =>
      this.tiposPcs.push({
        label,
        completed: true,
      })
    );
    console.log(this.tiposPcs);
    this.tiposTask = {
      label: 'Todos',
      completed: true,
      tiposPcs: this.tiposPcs,
    };

    this.allComplete = true;
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

  someComplete(): boolean {
    if (this.tiposTask.tiposPcs == null) {
      return false;
    }
    return this.tiposTask.tiposPcs.filter((t) => t.completed).length > 0 && !this.allComplete;
  }

  updateAllComplete() {
    this.allComplete = this.tiposTask.tiposPcs != null && this.tiposTask.tiposPcs.every((t) => t.completed);
  }

  setAll(completed: boolean) {
    this.allComplete = completed;
    if (this.tiposTask.tiposPcs == null) {
      return;
    }
    this.tiposTask.tiposPcs.forEach((t) => {
      t.completed = completed;
      /* this.filtroTipo = new TipoPcFilter('tipo', GLOBAL.labels_tipos.indexOf(t.label));
      this.filterService.addFilter(this.filtroTipo); */
    });
  }

  onChangeFiltroTipo(event: MatCheckboxChange) {
    console.log(event.source.id);

    if (event.checked) {
      this.filtroTipo = new TipoPcFilter(event.source.id, 'tipo', GLOBAL.labels_tipos.indexOf(event.source.name));
      this.filterService.addFilter(this.filtroTipo);
    } else {
      this.filterService.filters
        .filter((filter) => (filter.type = 'tipo'))
        .forEach((filter) => {
          if (filter.id === event.source.id) {
            this.filterService.deleteFilter(filter);
          }
        });
    }
  }
}
