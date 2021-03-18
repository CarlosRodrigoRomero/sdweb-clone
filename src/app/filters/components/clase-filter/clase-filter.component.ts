import { Component, OnInit } from '@angular/core';

import { MatButtonToggleChange } from '@angular/material/button-toggle';

import { GLOBAL } from '@core/services/global';
import { FilterService } from '@core/services/filter.service';
import { FilterControlService } from '@core/services/filter-control.service';

import { ClasePcFilter } from '@core/models/clasePcFilter';

interface Severidad {
  label?: string;
  completed?: boolean;
}

@Component({
  selector: 'app-clase-filter',
  templateUrl: './clase-filter.component.html',
  styleUrls: ['./clase-filter.component.css'],
})
export class ClaseFilterComponent implements OnInit {
  severidadElems: Severidad[] = [];
  allComplete: boolean;
  filtroClase: ClasePcFilter;
  coloresSeveridad: string[];

  severidadSelected: string[] = undefined;

  constructor(private filterService: FilterService, private filterControlService: FilterControlService) {}

  ngOnInit(): void {
    GLOBAL.labels_severidad.forEach((label) =>
      this.severidadElems.push({
        label,
        completed: false,
      })
    );
    this.coloresSeveridad = GLOBAL.colores_severidad;

    this.filterControlService.severidadSelected$.subscribe((sel) => (this.severidadSelected = sel));
  }

  onChangeClaseFilter(event: MatButtonToggleChange) {
    if (event.source.checked) {
      this.filtroClase = new ClasePcFilter(
        event.source.id,
        'clase',
        GLOBAL.labels_severidad.indexOf(event.source.name) + 1
      );
      this.filterService.addFilter(this.filtroClase);
      this.filterControlService.severidadSelected.push(event.source.name);
    } else {
      this.filterService.filters$.subscribe((filters) =>
        filters
          .filter((filter) => filter.type === 'clase')
          .forEach((filter) => {
            if (filter.id === event.source.id) {
              this.filterService.deleteFilter(filter);
            }
          })
      );
      this.filterControlService.severidadSelected = this.filterControlService.severidadSelected.filter(
        (sel) => sel !== event.source.name
      );
    }
  }
}
