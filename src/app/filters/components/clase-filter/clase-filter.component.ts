import { Component, OnInit } from '@angular/core';

import { MatButtonToggleChange } from '@angular/material/button-toggle';

import { GLOBAL } from '@core/services/global';
import { FilterService } from '@core/services/filter.service';
import { FilterControlService } from '@core/services/filter-control.service';

import { SeveridadFilter } from '@core/models/clasePcFilter';
import { take } from 'rxjs/operators';

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

  constructor(private filterService: FilterService, private filterControlService: FilterControlService) {}

  ngOnInit(): void {
    GLOBAL.labels_severidad.forEach((label, index) =>
      this.severidadElems.push({
        label,
        completed: false,
      })
    );

    this.coloresSeveridad = GLOBAL.colores_severidad;

    this.filterControlService.severidadSelected$.subscribe((sel) => {
      this.severidadSelected = sel;
    });
  }

  onChangeClaseFilter(event: MatButtonToggleChange) {
    if (event.source.checked) {
      console.log('checked');
      this.filtroClase = new SeveridadFilter(
        event.source.id,
        'clase',
        GLOBAL.labels_severidad.indexOf(event.source.name) + 1
      );
      this.filterService.addFilter(this.filtroClase);
      this.filterControlService.severidadSelected[parseInt(event.source.id.replace('CoA_', '')) - 1] = true;
    } else {
      console.log('unchecked');
      this.filterService.filters$.pipe(take(1)).subscribe((filters) =>
        filters
          .filter((filter) => filter.type === 'clase')
          .forEach((filter) => {
            if (filter.id === event.source.id) {
              this.filterService.deleteFilter(filter);
            }
          })
      );
      this.filterControlService.severidadSelected[parseInt(event.source.id.replace('CoA_', '')) - 1] = false;
    }
  }
}
