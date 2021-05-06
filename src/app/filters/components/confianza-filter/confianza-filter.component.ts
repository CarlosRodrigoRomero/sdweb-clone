import { Component, OnInit } from '@angular/core';

import { switchMap, take } from 'rxjs/operators';

import { MatSliderChange } from '@angular/material/slider';

import { FilterService } from '@core/services/filter.service';
import { StructuresService } from '@core/services/structures.service';
import { InformeService } from '@core/services/informe.service';

import { ModuloBrutoFilter } from '@core/models/moduloBrutoFilter';
import { ThermalLayerInterface } from '@core/models/thermalLayer';

@Component({
  selector: 'app-confianza-filter',
  templateUrl: './confianza-filter.component.html',
  styleUrls: ['./confianza-filter.component.css'],
})
export class ConfianzaFilterComponent implements OnInit {
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
        if (filters[0].confianzaM !== undefined) {
          this.value = filters[0].confianzaM;
        }
      });
  }

  onChangeSlider(e: MatSliderChange) {
    // crea el filtro
    const filtroConfianza = new ModuloBrutoFilter('confianzaM', e.value);

    if (e.value === this.min) {
      // si se selecciona el mínimo desactivamos el filtro ...
      this.filterService.deleteFilter(filtroConfianza);

      // eliminamos el filtro de la DB
      this.structuresService.deleteFilter(this.thermalLayer.id, 'confianzaM');
    } else {
      // ... si no, lo añadimos
      this.filterService.addFilter(filtroConfianza);

      // guardamos el filtro en la DB
      this.structuresService.saveFilter(this.thermalLayer.id, 'confianzaM', e.value);
    }
  }
}
