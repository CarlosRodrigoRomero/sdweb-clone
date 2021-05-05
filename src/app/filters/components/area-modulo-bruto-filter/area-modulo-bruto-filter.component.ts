import { Component, OnInit } from '@angular/core';

import { MatSliderChange } from '@angular/material/slider';

import { FilterService } from '@core/services/filter.service';

import { ModuloBrutoFilter } from '@core/models/moduloBrutoFilter';

@Component({
  selector: 'app-area-modulo-bruto-filter',
  templateUrl: './area-modulo-bruto-filter.component.html',
  styleUrls: ['./area-modulo-bruto-filter.component.css'],
})
export class AreaModuloBrutoFilterComponent implements OnInit {
  min = 0;
  max = 1;
  step = 0.1;

  constructor(private filterService: FilterService) {}

  ngOnInit(): void {}

  onChangeSlider(e: MatSliderChange) {
    // crea el filtro
    const filtroConfianza = new ModuloBrutoFilter('confianza', e.value);

    if (e.value === this.min) {
      // si se selecciona el mínimo desactivamos el filtro ...
      this.filterService.deleteFilter(filtroConfianza);
    } else {
      // ... si no, lo añadimos
      this.filterService.addFilter(filtroConfianza);
    }
  }
}
