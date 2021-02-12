import { Component, OnInit } from '@angular/core';

import { FilterService } from '@core/services/filter.service';
import { PcService } from '@core/services/pc.service';

import { GradientFilter } from '@core/models/gradientFilter';

import { LabelType, Options, PointerType } from '@angular-slider/ngx-slider';

@Component({
  selector: 'app-gradient-filter',
  templateUrl: './gradient-filter.component.html',
  styleUrls: ['./gradient-filter.component.css'],
})
export class GradientFilterComponent implements OnInit {
  minGradiente: number;
  maxGradiente: number;
  rangoMinGradiente: number;
  rangoMaxGradiente: number;
  filtroGradiente: GradientFilter;
  options: Options;

  constructor(private filterService: FilterService, private pcService: PcService) {
    // this.minGradiente = this.pcService.getMinGradienteNormalizado();
    this.minGradiente = 0;
    // this.maxGradiente = this.pcService.getMaxGradienteNormalizado();
    this.maxGradiente = 50;
    this.rangoMinGradiente = this.minGradiente;
    this.rangoMaxGradiente = this.maxGradiente;
  }

  ngOnInit(): void {
    this.options = {
      floor: this.minGradiente,
      ceil: this.maxGradiente,
      translate: (value: number, label: LabelType): string => {
        switch (label) {
          case LabelType.Low:
            return value + 'ºC';
          case LabelType.High:
            return value + 'ºC';
          default:
            return value + 'ºC';
        }
      },
      getSelectionBarColor: (minValue: number, maxValue: number): string => {
        if (minValue === this.minGradiente && maxValue === this.maxGradiente) {
          return '#c4c4c4';
        }
        return '#455a64';
      },
      getPointerColor: (value: number, pointerType: PointerType.Min | PointerType.Max): string => {
        if (value !== this.minGradiente) {
          if (value !== this.maxGradiente) {
            return '#455a64';
          }
        }
      },
    };
  }

  onChangeFiltroGradiente() {
    this.filtroGradiente = new GradientFilter('gradient', this.rangoMinGradiente, this.rangoMaxGradiente);
    if (this.rangoMinGradiente === this.minGradiente && this.rangoMaxGradiente === this.maxGradiente) {
      // si se selecciona el mínimo desactivamos el filtro ...
      this.filterService.deleteFilter(this.filtroGradiente);
    } else {
      // ... si no, lo añadimos
      this.filterService.addFilter(this.filtroGradiente);
    }
  }
}
