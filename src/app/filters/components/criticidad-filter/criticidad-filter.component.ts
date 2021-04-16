import { Component, OnInit } from '@angular/core';

import { take } from 'rxjs/operators';

import { MatButtonToggleChange } from '@angular/material/button-toggle';

import { GLOBAL } from '@core/services/global';
import { FilterService } from '@core/services/filter.service';
import { FilterControlService } from '@core/services/filter-control.service';

import { CriticidadFilter } from '@core/models/criticidad';

interface Criticidad {
  label?: string;
  completed?: boolean;
}

@Component({
  selector: 'app-criticidad-filter',
  templateUrl: './criticidad-filter.component.html',
  styleUrls: ['./criticidad-filter.component.css'],
})
export class CriticidadFilterComponent implements OnInit {
  criticidadElems: Criticidad[] = [];
  allComplete: boolean;
  filtroCriticidad: CriticidadFilter;
  // coloresSeveridad: string[];
  public criticidadSelected: boolean[] = [false, false, false, false, false];

  constructor(private filterService: FilterService, private filterControlService: FilterControlService) {}

  ngOnInit(): void {
    GLOBAL.labels_criticidad.forEach((label, index) =>
      this.criticidadElems.push({
        label,
        completed: false,
      })
    );

    // this.coloresSeveridad = GLOBAL.colores_severidad;

    this.filterControlService.criticidadSelected$.subscribe((sel) => {
      this.criticidadSelected = sel;
    });
  }

  onChangeCriticidadFilter(event: MatButtonToggleChange) {
    if (event.source.checked) {
      this.filtroCriticidad = new CriticidadFilter(
        event.source.id,
        'criticidad',
        GLOBAL.labels_criticidad.indexOf(event.source.name) + 1
      );
      this.filterService.addFilter(this.filtroCriticidad);
      this.filterControlService.severidadSelected[/* parseInt( */event.source.id/* ) */] = true;
    } else {
      this.filterService.filters$.pipe(take(1)).subscribe((filters) =>
        filters
          .filter((filter) => filter.type === 'criticidad')
          .forEach((filter) => {
            if (filter.id === event.source.id) {
              this.filterService.deleteFilter(filter);
            }
          })
      );
      this.filterControlService.severidadSelected[/* parseInt( */event.source.id/* ) */] = false;
    }
  }
}
