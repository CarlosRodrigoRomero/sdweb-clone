import { Component, OnInit } from '@angular/core';

import { MatSliderChange } from '@angular/material/slider';

import { FilterService } from '@core/services/filter.service';

import { ConfianzaFilter } from '@core/models/confianzaFilter';

@Component({
  selector: 'app-confianza-filter',
  templateUrl: './confianza-filter.component.html',
  styleUrls: ['./confianza-filter.component.css'],
})
export class ConfianzaFilterComponent implements OnInit {
  min: number;
  max: number;

  constructor(private filterService: FilterService) {}

  ngOnInit(): void {}

  onChangeSlider(e: MatSliderChange) {
    // crea el filtro
    const filtroConfianza = new ConfianzaFilter('confianza', e.value);

    if (e.value === this.min) {
      // si se selecciona el mínimo desactivamos el filtro ...
      this.filterService.deleteFilter(filtroConfianza);
    } else {
      // ... si no, lo añadimos
      this.filterService.addFilter(filtroConfianza);
    }
  }
}
