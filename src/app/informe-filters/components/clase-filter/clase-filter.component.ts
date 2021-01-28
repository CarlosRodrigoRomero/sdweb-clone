import { Component, OnInit } from '@angular/core';

import { MatCheckboxChange } from '@angular/material/checkbox';

import { GLOBAL } from '@core/services/global';
import { FilterService } from '@core/services/filter.service';

import { ClasePcFilter } from '@core/models/clasePcFilter';

interface ClasePc {
  label?: string;
  completed?: boolean;
  clasesPcs?: ClasePc[];
}

@Component({
  selector: 'app-clase-filter',
  templateUrl: './clase-filter.component.html',
  styleUrls: ['./clase-filter.component.css'],
})
export class ClaseFilterComponent implements OnInit {
  clasesTask: ClasePc;
  clasesPcs: ClasePc[] = [];
  allComplete: boolean;
  filtroClase: ClasePcFilter;
  coloresSeveridad: string[];

  constructor(private filterService: FilterService) {}

  ngOnInit(): void {
    GLOBAL.labels_severidad.forEach((label) =>
      this.clasesPcs.push({
        label,
        completed: false,
      })
    );
    this.clasesTask = {
      clasesPcs: this.clasesPcs,
    };
    this.coloresSeveridad = GLOBAL.colores_severidad;
  }

  onChangeFiltroClase(event: MatCheckboxChange) {
    if (event.checked) {
      this.filtroClase = new ClasePcFilter(
        event.source.id,
        'clase',
        GLOBAL.labels_severidad.indexOf(event.source.name) + 1
      );
      this.filterService.addFilter(this.filtroClase);
    } else {
      this.filterService.filters
        .filter((filter) => filter.type === 'clase')
        .forEach((filter) => {
          if (filter.id === event.source.id) {
            this.filterService.deleteFilter(filter);
          }
        });
    }
  }
}
