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
  public criticidadSelected: boolean[] = [false, false, false, false, false];

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
    // const criticidad = this.criticidadElems.length - parseInt(event.source.id);
    if (event.source.checked) {
      this.filtroCriticidad = new CriticidadFilter(event.source.id, 'criticidad', parseInt(event.source.id));
      this.filterService.addFilter(this.filtroCriticidad);
      this.filterControlService.criticidadSelected[event.source.id] = true;
    } else {
      this.filterService.filters$.pipe(take(1)).subscribe((filters) =>
        filters
          .filter((filter) => filter.type === 'criticidad')
          .forEach((filter) => {
            // tslint:disable-next-line: triple-equals
            if (filter.id == event.source.id) {
              this.filterService.deleteFilter(filter);
            }
          })
      );
      this.filterControlService.criticidadSelected[event.source.id] = false;
    }
  }
}
