import { Component, OnInit } from '@angular/core';

import { MatSliderChange } from '@angular/material/slider';

import { FilterService } from '@core/services/filter.service';
import { StructuresService } from '@core/services/structures.service';

import { ModuloBrutoFilter } from '@core/models/moduloBrutoFilter';

@Component({
  selector: 'app-confianza-filter',
  templateUrl: './confianza-filter.component.html',
  styleUrls: ['./confianza-filter.component.css'],
})
export class ConfianzaFilterComponent implements OnInit {
  min = 0;
  max = 1;
  step = 0.01;
  value = 0;

  constructor(private filterService: FilterService, private structuresService: StructuresService) {}

  ngOnInit(): void {
    this.structuresService.getFiltersParams().subscribe((filters) => {
      if (filters.length > 0) {
        // comprobamos si hay filtros en la DB y seteamos los parámetros
        if (filters[0].confianzaM !== undefined) {
          this.value = filters[0].confianzaM;
        }
      }
    });
  }

  onChangeSlider(e: MatSliderChange) {
    // crea el filtro
    const filtroConfianza = new ModuloBrutoFilter(
      'confianzaM',
      e.value,
      this.structuresService.confianzaAverage,
      this.structuresService.confianzaStdDev
    );

    if (e.value === this.min) {
      // si se selecciona el mínimo desactivamos el filtro ...
      this.filterService.deleteFilter(filtroConfianza);

      // eliminamos el filtro de la DB
      this.structuresService.deleteFilter('confianzaM');

      // ponemos el label fuerza a 0
      this.value = 0;
    } else {
      // ... si no, lo añadimos
      this.filterService.addFilter(filtroConfianza);

      // guardamos el filtro en la DB
      this.structuresService.addFilter('confianzaM', e.value);
    }
  }

  formatLabel(value: number) {
    return value * 100;
  }
}
