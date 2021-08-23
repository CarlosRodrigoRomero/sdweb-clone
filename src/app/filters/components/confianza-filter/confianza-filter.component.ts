import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { MatSliderChange } from '@angular/material/slider';

import { FilterService } from '@core/services/filter.service';
import { StructuresService } from '@core/services/structures.service';

import { ModuloBrutoFilter } from '@core/models/moduloBrutoFilter';

@Component({
  selector: 'app-confianza-filter',
  templateUrl: './confianza-filter.component.html',
  styleUrls: ['./confianza-filter.component.css'],
})
export class ConfianzaFilterComponent implements OnInit, OnDestroy {
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
          if (filters[0].confianzaM !== undefined) {
            this.value = filters[0].confianzaM.fuerza;
          }
        }
      })
    );

    this.subscriptions.add(this.structuresService.createRawModMode$.subscribe((mode) => (this.createMode = mode)));
    this.subscriptions.add(this.structuresService.deleteRawModMode$.subscribe((mode) => (this.deleteMode = mode)));
  }

  onChangeSlider(e: MatSliderChange) {
    const rangeMinConfianza =
      this.structuresService.confianzaAverage -
      ((this.max - e.value) / this.divisor) * this.structuresService.confianzaStdDev;
    const rangeMaxConfianza =
      this.structuresService.confianzaAverage +
      ((this.max - e.value) / this.divisor) * this.structuresService.confianzaStdDev;

    // crea el filtro
    const filtroConfianza = new ModuloBrutoFilter('confianzaM', rangeMinConfianza, rangeMaxConfianza);

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
      this.structuresService.addFilter('confianzaM', {
        fuerza: e.value,
        min: rangeMinConfianza,
        max: rangeMaxConfianza,
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
