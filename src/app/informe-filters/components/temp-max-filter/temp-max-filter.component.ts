import { Component, OnInit } from '@angular/core';

import { MatSliderChange } from '@angular/material/slider';

import { PcService } from '@core/services/pc.service';
import { FilterService } from '@core/services/filter.service';

import { TempMaxFilter } from '@core/models/tempMaxFilter';

@Component({
  selector: 'app-temp-max-filter',
  templateUrl: './temp-max-filter.component.html',
  styleUrls: ['./temp-max-filter.component.css'],
})
export class TempMaxFilterComponent implements OnInit {
  minTemp: number;
  maxTemp: number;
  rangoMinTemp: number;
  filtroTempMax: TempMaxFilter;

  constructor(private pcService: PcService, private filterService: FilterService) {}

  ngOnInit(): void {
    this.maxTemp = this.pcService.getTempMaxAllPcs();
    this.minTemp = 0;
  }

  formatLabel(value: number | null) {
    if (!value) {
      return this.rangoMinTemp;
    }
    return value + 'ºC';
  }

  onInputFiltroTempMax(event: MatSliderChange) {
    this.rangoMinTemp = event.value;
  }

  onChangeFiltroTempMax() {
    this.filtroTempMax = new TempMaxFilter('tempMax', this.rangoMinTemp, this.maxTemp);
    if (this.rangoMinTemp === this.minTemp) {
      // si se selecciona el mínimo desactivamos el filtro ...
      this.filterService.deleteFilter(this.filtroTempMax);
    } else {
      // ... si no, lo añadimos
      this.filterService.addFilter(this.filtroTempMax);
    }
  }
}
