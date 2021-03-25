import { Component, OnInit } from '@angular/core';

import { MatButtonToggleChange } from '@angular/material/button-toggle';

import { GLOBAL } from '@core/services/global';
import { FilterService } from '@core/services/filter.service';
import { FilterControlService } from '@core/services/filter-control.service';

import { SeveridadFilter } from '@core/models/clasePcFilter';
import { take } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';

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
  filtroClase: SeveridadFilter;
  coloresSeveridad: string[];
  public severidadSelected: boolean[] = [false, false, false];
  public filterLoaded = false;

  constructor(private filterService: FilterService, private filterControlService: FilterControlService) {}

  ngOnInit(): void {
    GLOBAL.labels_severidad.forEach((label, index) =>
      this.severidadElems.push({
        label,
        completed: true,
      })
    );

    this.coloresSeveridad = GLOBAL.colores_severidad;

    this.filterControlService.severidadSelected$.subscribe((sel) => {
      this.severidadSelected = sel;

      this.filterLoaded = true;
    });
  }

  onChangeClaseFilter(event: MatButtonToggleChange) {
    if (event.source.checked) {
      this.filtroClase = new SeveridadFilter(
        event.source.id,
        'clase',
        GLOBAL.labels_severidad.indexOf(event.source.name) + 1
      );
      this.filterService.addFilter(this.filtroClase);
      this.filterControlService.severidadSelected[event.source.id.replace('CoA_', '')] = true;
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
      this.filterControlService.severidadSelected[event.source.id.replace('CoA_', '')] = false;
    }
  }
}
