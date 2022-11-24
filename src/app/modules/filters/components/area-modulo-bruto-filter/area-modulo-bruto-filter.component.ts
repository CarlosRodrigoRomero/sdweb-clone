import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { Options, PointerType } from '@angular-slider/ngx-slider';

import { FilterService } from '@data/services/filter.service';
import { StructuresService } from '@data/services/structures.service';

import { ModuloBrutoFilter } from '@core/models/moduloBrutoFilter';
import { switchMap, take } from 'rxjs/operators';

@Component({
  selector: 'app-area-modulo-bruto-filter',
  templateUrl: './area-modulo-bruto-filter.component.html',
  styleUrls: ['./area-modulo-bruto-filter.component.scss'],
})
export class AreaModuloBrutoFilterComponent implements OnInit, OnDestroy {
  min = 0;
  max = 10;
  step = 0.01;
  minValue = 0;
  maxValue = 10;
  multiplier = 2.5;
  options: Options;
  loadFilter = false;

  private subscriptions: Subscription = new Subscription();

  constructor(private filterService: FilterService, private structuresService: StructuresService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.structuresService
        .getFiltersParams()
        .pipe(
          take(1),
          switchMap((filters) => {
            if (filters.length > 0) {
              // comprobamos si hay filtros en la DB y seteamos los parámetros
              if (filters[0].areaM !== undefined) {
                if (filters[0].areaM.min !== undefined && filters[0].areaM.min !== null) {
                  this.minValue = filters[0].areaM.min;
                }
                if (filters[0].areaM.max !== undefined && filters[0].areaM.max !== null) {
                  this.maxValue = filters[0].areaM.max;
                }
              }
            }

            return this.structuresService.loadedRawModules$;
          })
        )
        .subscribe((rawMods) => {
          const areas = rawMods.map((rawMod) => rawMod.area);
          const median = this.structuresService.getMedian(areas);

          if (!isNaN(median)) {
            this.max = Math.round(median * this.multiplier);

            this.options = {
              floor: this.min,
              ceil: this.max,
              step: this.step,
              getSelectionBarColor: (minValue: number, maxValue: number): string => {
                if (minValue === this.minValue && maxValue === this.maxValue) {
                  return '#c4c4c4';
                }
                return '#455a64';
              },
              getPointerColor: (value: number, pointerType: PointerType.Min | PointerType.Max): string => {
                if (value !== this.min) {
                  if (value !== this.max) {
                    return '#455a64';
                  }
                }
              },
            };

            this.loadFilter = true;
          }
        })
    );
  }

  onChangeSlider(lowValue: number, highValue: number) {
    const filtroArea = new ModuloBrutoFilter('areaM', lowValue, highValue);

    if (lowValue === this.min && highValue === this.max) {
      // si se selecciona el mínimo desactivamos el filtro ...
      this.filterService.deleteFilter(filtroArea);

      // eliminamos el filtro de la DB
      this.structuresService.deleteFilter('areaM');
    } else {
      // ... si no, lo añadimos
      this.filterService.addFilter(filtroArea);

      // guardamos el filtro en la DB
      this.structuresService.addFilter('areaM', { min: lowValue, max: highValue });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
