import { Component, OnInit } from '@angular/core';

import { switchMap, take } from 'rxjs/operators';

import { MatSliderChange } from '@angular/material/slider';

import { FilterService } from '@core/services/filter.service';
import { StructuresService } from '@core/services/structures.service';
import { InformeService } from '@core/services/informe.service';

import { ModuloBrutoFilter } from '@core/models/moduloBrutoFilter';
import { ThermalLayerInterface } from '@core/models/thermalLayer';

@Component({
  selector: 'app-aspect-ratio-filter',
  templateUrl: './aspect-ratio-filter.component.html',
  styleUrls: ['./aspect-ratio-filter.component.css'],
})
export class AspectRatioFilterComponent implements OnInit {
  private thermalLayer: ThermalLayerInterface;
  min = 0;
  max = 1;
  step = 0.1;
  value = 0;

  constructor(
    private filterService: FilterService,
    private structuresService: StructuresService,
    private informeService: InformeService
  ) {}

  ngOnInit(): void {
    const informeId = this.structuresService.informeId;
    this.informeService
      .getThermalLayer$(informeId)
      .pipe(
        take(1),
        switchMap((layers) => {
          this.thermalLayer = layers[0];

          return this.structuresService.getFiltersParams(this.thermalLayer.id);
        })
      )
      .subscribe((filters) => {
        // comprobamos si hay filtros en la DB y seteamos los parámetros
        if (filters[0].aspectRatioM !== undefined) {
          this.value = filters[0].aspectRatioM;
        }
      });
  }

  onChangeSlider(e: MatSliderChange) {
    // crea el filtro
    const filtroAspectRatio = new ModuloBrutoFilter('aspectRatioM', e.value);

    if (e.value === this.min) {
      // si se selecciona el mínimo desactivamos el filtro ...
      this.filterService.deleteFilter(filtroAspectRatio);

      // eliminamos el filtro de la DB
      this.structuresService.deleteFilter('aspectRatioM');
    } else {
      // ... si no, lo añadimos
      this.filterService.addFilter(filtroAspectRatio);

      // guardamos el filtro en la DB
      this.structuresService.saveFilter(this.thermalLayer.id, 'aspectRatioM', e.value);
    }
  }
}
