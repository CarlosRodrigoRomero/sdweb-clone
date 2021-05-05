import { Component, OnInit } from '@angular/core';

import { MatSliderChange } from '@angular/material/slider';

import { FilterService } from '@core/services/filter.service';

import { ModuloBrutoFilter } from '@core/models/moduloBrutoFilter';

@Component({
  selector: 'app-aspect-ratio-filter',
  templateUrl: './aspect-ratio-filter.component.html',
  styleUrls: ['./aspect-ratio-filter.component.css'],
})
export class AspectRatioFilterComponent implements OnInit {
  min = 0;
  max = 1;
  step = 0.1;

  constructor(private filterService: FilterService) {}

  ngOnInit(): void {}

  onChangeSlider(e: MatSliderChange) {
    // crea el filtro
    const filtroConfianza = new ModuloBrutoFilter('aspect-ratio', e.value);

    if (e.value === this.min) {
      // si se selecciona el mínimo desactivamos el filtro ...
      this.filterService.deleteFilter(filtroConfianza);
    } else {
      // ... si no, lo añadimos
      this.filterService.addFilter(filtroConfianza);
    }
  }
}
