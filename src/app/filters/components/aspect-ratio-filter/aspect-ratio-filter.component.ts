import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { MatSliderChange } from '@angular/material/slider';

import { FilterService } from '@core/services/filter.service';
import { StructuresService } from '@core/services/structures.service';

import { ModuloBrutoFilter } from '@core/models/moduloBrutoFilter';

@Component({
  selector: 'app-aspect-ratio-filter',
  templateUrl: './aspect-ratio-filter.component.html',
  styleUrls: ['./aspect-ratio-filter.component.css'],
})
export class AspectRatioFilterComponent implements OnInit, OnDestroy {
  min = 0;
  max = 10;
  step = 1;
  value = 0;
  divisor = 3;
  createMode = false;
  deleteMode = false;

  private subscriptions: Subscription = new Subscription();

  constructor(private filterService: FilterService, private structuresService: StructuresService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.structuresService.getFiltersParams().subscribe((filters) => {
        if (filters.length > 0) {
          // comprobamos si hay filtros en la DB y seteamos los parámetros
          if (filters[0].aspectRatioM !== undefined) {
            this.value = filters[0].aspectRatioM.fuerza;
          }
        }
      })
    );

    this.subscriptions.add(this.structuresService.createRawModMode$.subscribe((mode) => (this.createMode = mode)));
    this.subscriptions.add(this.structuresService.deleteRawModMode$.subscribe((mode) => (this.deleteMode = mode)));
  }

  onChangeSlider(e: MatSliderChange) {
    const rangeMinAspectRatio =
      this.structuresService.aspectRatioAverage -
      ((this.max - e.value) / this.divisor) * this.structuresService.aspectRatioStdDev;
    const rangeMaxAspectRatio =
      this.structuresService.aspectRatioAverage +
      ((this.max - e.value) / this.divisor) * this.structuresService.aspectRatioStdDev;

    // crea el filtro
    const filtroAspectRatio = new ModuloBrutoFilter('aspectRatioM', rangeMinAspectRatio, rangeMaxAspectRatio);

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
      this.structuresService.addFilter('aspectRatioM', {
        fuerza: e.value,
        min: rangeMinAspectRatio,
        max: rangeMaxAspectRatio,
      });
    }
  }

  formatLabel(value: number) {
    return value;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
