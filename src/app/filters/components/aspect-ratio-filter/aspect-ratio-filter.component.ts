import { Component, OnInit } from '@angular/core';

import { MatSliderChange } from '@angular/material/slider';

import { FilterService } from '@core/services/filter.service';
import { StructuresService } from '@core/services/structures.service';

import { ModuloBrutoFilter } from '@core/models/moduloBrutoFilter';

@Component({
  selector: 'app-aspect-ratio-filter',
  templateUrl: './aspect-ratio-filter.component.html',
  styleUrls: ['./aspect-ratio-filter.component.css'],
})
export class AspectRatioFilterComponent implements OnInit {
  min = 0;
  max = 10;
  step = 1;
  value = 0;

  constructor(private filterService: FilterService, private structuresService: StructuresService) {}

  ngOnInit(): void {
    this.structuresService.getFiltersParams().subscribe((filters) => {
      if (filters.length > 0) {
        // comprobamos si hay filtros en la DB y seteamos los parámetros
        if (filters[0].aspectRatioM !== undefined) {
          this.value = this.max - filters[0].aspectRatioM;
        }
      }
    });
  }

  onChangeSlider(e: MatSliderChange) {
    // crea el filtro
    const filtroAspectRatio = new ModuloBrutoFilter(
      'aspectRatioM',
      this.max - e.value,
      this.structuresService.aspectRatioAverage,
      this.structuresService.aspectRatioStdDev
    );

    if (e.value === this.min) {
      // si se selecciona el mínimo desactivamos el filtro ...
      this.filterService.deleteFilter(filtroAspectRatio);

      // eliminamos el filtro de la DB
      this.structuresService.deleteFilter('aspectRatioM');

      // ponemos el label fuerza a 0
      this.value = 0;
    } else {
      // ... si no, lo añadimos
      this.filterService.addFilter(filtroAspectRatio);

      // guardamos el filtro en la DB
      this.structuresService.addFilter('aspectRatioM', this.max - e.value);
    }
  }

  formatLabel(value: number) {
    return value;
  }
}
