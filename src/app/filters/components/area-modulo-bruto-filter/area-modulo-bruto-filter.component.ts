import { Component, OnInit } from '@angular/core';

import { MatSliderChange } from '@angular/material/slider';

import { FilterService } from '@core/services/filter.service';
import { StructuresService } from '@core/services/structures.service';

import { ModuloBrutoFilter } from '@core/models/moduloBrutoFilter';

@Component({
  selector: 'app-area-modulo-bruto-filter',
  templateUrl: './area-modulo-bruto-filter.component.html',
  styleUrls: ['./area-modulo-bruto-filter.component.css'],
})
export class AreaModuloBrutoFilterComponent implements OnInit {
  min = 0;
  max = 10;
  step = 1;
  value = 0;

  constructor(private filterService: FilterService, private structuresService: StructuresService) {}

  ngOnInit(): void {
    this.structuresService.getFiltersParams().subscribe((filters) => {
      if (filters.length > 0) {
        // comprobamos si hay filtros en la DB y seteamos los parámetros
        if (filters[0].areaM !== undefined) {
          this.value = this.max - filters[0].areaM;
        }
      }
    });
  }

  onChangeSlider(e: MatSliderChange) {
    const filtroArea = new ModuloBrutoFilter(
      'areaM',
      this.max - e.value,
      this.structuresService.areaAverage,
      this.structuresService.areaStdDev
    );

    if (e.value === this.min) {
      // si se selecciona el mínimo desactivamos el filtro ...
      this.filterService.deleteFilter(filtroArea);

      // eliminamos el filtro de la DB
      this.structuresService.deleteFilter('areaM');

      // ponemos el label fuerza a 0
      this.value = 0;
    } else {
      // ... si no, lo añadimos
      this.filterService.addFilter(filtroArea);

      // guardamos el filtro en la DB
      this.structuresService.addFilter('areaM', this.max - e.value);
    }
  }

  formatLabel(value: number) {
    return value;
  }
}
