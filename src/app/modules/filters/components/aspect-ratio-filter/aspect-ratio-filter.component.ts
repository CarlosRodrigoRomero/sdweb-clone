import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import { Options, PointerType } from '@angular-slider/ngx-slider';

import { FilterService } from '@data/services/filter.service';
import { StructuresService } from '@data/services/structures.service';

import { ModuloBrutoFilter } from '@core/models/moduloBrutoFilter';

@Component({
  selector: 'app-aspect-ratio-filter',
  templateUrl: './aspect-ratio-filter.component.html',
  styleUrls: ['./aspect-ratio-filter.component.scss'],
})
export class AspectRatioFilterComponent implements OnInit, OnDestroy {
  min = 0;
  max = 10;
  step = 0.01;
  minValue = 0;
  maxValue = 10;
  multiplier = 2;
  loadFilter = false;
  options: Options;

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
              if (filters[0].aspectRatioM !== undefined) {
                if (filters[0].aspectRatioM.min !== undefined && filters[0].aspectRatioM.min !== null) {
                  this.minValue = filters[0].aspectRatioM.min;
                }
                if (filters[0].aspectRatioM.max !== undefined && filters[0].aspectRatioM.max !== null) {
                  this.maxValue = filters[0].aspectRatioM.max;
                }
              }
            }

            return this.structuresService.allRawModules$;
          })
        )
        .subscribe((rawMods) => {
          const aspectRatios = rawMods.map((rawMod) => rawMod.aspectRatio);
          const median = this.structuresService.getMedian(aspectRatios);

          if (!isNaN(median)) {
            this.max = Number((median * this.multiplier).toFixed(2));

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
    // crea el filtro
    const filtroAspectRatio = new ModuloBrutoFilter('aspectRatioM', lowValue, highValue);

    if (lowValue === this.min && highValue === this.max) {
      // si se selecciona el mínimo y máximo desactivamos el filtro ...
      this.filterService.deleteFilter(filtroAspectRatio);

      // eliminamos el filtro de la DB
      this.structuresService.deleteFilter('aspectRatioM');
    } else {
      // ... si no, lo añadimos
      this.filterService.addFilter(filtroAspectRatio);

      // guardamos el filtro en la DB
      this.structuresService.addFilter('aspectRatioM', {
        min: lowValue,
        max: highValue,
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
