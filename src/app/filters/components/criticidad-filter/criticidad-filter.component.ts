import { Component, OnInit } from '@angular/core';

import { take } from 'rxjs/operators';

import { MatButtonToggleChange } from '@angular/material/button-toggle';

import { GLOBAL } from '@core/services/global';
import { FilterService } from '@core/services/filter.service';
import { FilterControlService } from '@core/services/filter-control.service';

import { CriticidadFilter } from '@core/models/criticidadFilter';

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
  public criticidadSelected: boolean[] = undefined;

  constructor(private filterService: FilterService, private filterControlService: FilterControlService) {}

  ngOnInit(): void {
    GLOBAL.labels_criticidad.forEach((label) =>
      this.criticidadElems.push({
        label,
        completed: false,
      })
    );

    this.filterControlService.criticidadSelected$.subscribe((sel) => {
      this.criticidadSelected = sel;
    });
  }

  onChangeCriticidadFilter(event: MatButtonToggleChange) {
    const indexSelected = Number(event.source.id) - 1;
    if (event.source.checked) {
      this.filtroCriticidad = new CriticidadFilter(indexSelected.toString(), 'criticidad', indexSelected);

      this.filterService.addFilter(this.filtroCriticidad);
      this.filterControlService.criticidadSelected[indexSelected] = true;
    } else {
      this.filterService.filters$.pipe(take(1)).subscribe((filters) =>
        filters
          .filter((filter) => filter.type === 'criticidad')
          .forEach((filter) => {
            // tslint:disable-next-line: triple-equals
            if (filter.id == indexSelected.toString()) {
              this.filterService.deleteFilter(filter);
            }
          })
      );
      this.filterControlService.criticidadSelected[indexSelected] = false;
    }
  }
}
