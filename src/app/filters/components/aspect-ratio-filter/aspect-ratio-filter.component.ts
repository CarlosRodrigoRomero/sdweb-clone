import { Component, OnInit } from '@angular/core';

import { take } from 'rxjs/operators';

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

  constructor(
    private filterService: FilterService,
    private structuresService: StructuresService,
    private informeService: InformeService
  ) {}

  ngOnInit(): void {
    const informeId = this.structuresService.informeId;
    this.informeService
      .getThermalLayer$(informeId)
      .pipe(take(1))
      .subscribe((layers) => (this.thermalLayer = layers[0]));
  }

  onChangeSlider(e: MatSliderChange) {
    // crea el filtro
    const filtroAspectRatio = new ModuloBrutoFilter('aspect-ratio', e.value);

    if (e.value === this.min) {
      // si se selecciona el mínimo desactivamos el filtro ...
      this.filterService.deleteFilter(filtroAspectRatio);
    } else {
      // ... si no, lo añadimos
      this.filterService.addFilter(filtroAspectRatio);
    }

    // guardamos el filtro en la DB
    this.structuresService.saveFilters(this.thermalLayer.id, undefined, undefined, e.value);
  }
}
