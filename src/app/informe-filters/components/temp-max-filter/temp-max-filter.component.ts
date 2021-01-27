import { Component, OnInit } from '@angular/core';

import { PcService } from '@core/services/pc.service';
import { FilterService } from '@core/services/filter.service';

import { TempMaxFilter } from '@core/models/tempMaxFilter';

import { Options } from '@angular-slider/ngx-slider';

@Component({
  selector: 'app-temp-max-filter',
  templateUrl: './temp-max-filter.component.html',
  styleUrls: ['./temp-max-filter.component.css'],
})
export class TempMaxFilterComponent implements OnInit {
  minTemp: number;
  maxTemp: number;
  rangoMinTemp: number;
  rangoMaxTemp: number;
  filtroTempMax: TempMaxFilter;
  options: Options;

  constructor(private pcService: PcService, private filterService: FilterService) {
    this.minTemp = 0;
    this.maxTemp = this.pcService.getTempMaxAllPcs();
    this.rangoMinTemp = this.minTemp;
    this.rangoMaxTemp = this.maxTemp;
    this.options = { floor: this.minTemp, ceil: this.maxTemp };
  }

  ngOnInit(): void {}

  onChangeFiltroTempMax() {
    this.filtroTempMax = new TempMaxFilter('tempMax', this.rangoMinTemp, this.rangoMaxTemp);
    if (this.rangoMinTemp === this.minTemp && this.rangoMaxTemp === this.maxTemp) {
      // si se selecciona el mínimo desactivamos el filtro ...
      this.filterService.deleteFilter(this.filtroTempMax);
    } else {
      // ... si no, lo añadimos
      this.filterService.addFilter(this.filtroTempMax);
    }
  }
}
