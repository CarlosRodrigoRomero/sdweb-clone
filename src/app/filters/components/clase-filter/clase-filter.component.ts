import { Component, OnInit } from '@angular/core';

import { take } from 'rxjs/operators';

import { MatButtonToggleChange } from '@angular/material/button-toggle';

import { GLOBAL } from '@core/services/global';
import { FilterService } from '@core/services/filter.service';
import { FilterControlService } from '@core/services/filter-control.service';

import { ClaseFilter } from '@core/models/claseFilter';

interface Clase {
  label?: string;
  completed?: boolean;
}

@Component({
  selector: 'app-clase-filter',
  templateUrl: './clase-filter.component.html',
  styleUrls: ['./clase-filter.component.css'],
})
export class ClaseFilterComponent implements OnInit {
  claseElems: Clase[] = [];
  allComplete: boolean;
  filtroClase: ClaseFilter;
  coloresClase: string[];
  public claseSelected: boolean[] = [false, false, false];

  constructor(private filterService: FilterService, private filterControlService: FilterControlService) {}

  ngOnInit(): void {
    GLOBAL.labels_clase.forEach((label, index) =>
      this.claseElems.push({
        label,
        completed: false,
      })
    );

    this.coloresClase = GLOBAL.colores_clase;

    this.filterControlService.claseSelected$.subscribe((sel) => {
      this.claseSelected = sel;
    });
  }

  onChangeClaseFilter(event: MatButtonToggleChange) {
    if (event.source.checked) {
      this.filtroClase = new ClaseFilter(event.source.id, 'clase', GLOBAL.labels_clase.indexOf(event.source.name) + 1);
      this.filterService.addFilter(this.filtroClase);
      this.filterControlService.claseSelected[parseInt(event.source.id.replace('CoA_', '')) - 1] = true;
    } else {
      this.filterService.filters$.pipe(take(1)).subscribe((filters) =>
        filters
          .filter((filter) => filter.type === 'clase')
          .forEach((filter) => {
            console.log(filter);
            console.log(event.source.id);
            if (filter.id === event.source.id) {
              this.filterService.deleteFilter(filter);
            }
          })
      );
      this.filterControlService.claseSelected[parseInt(event.source.id.replace('CoA_', '')) - 1] = false;
    }
  }
}
