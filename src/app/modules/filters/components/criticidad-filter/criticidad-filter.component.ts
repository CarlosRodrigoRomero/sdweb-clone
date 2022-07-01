import { Component, OnDestroy, OnInit } from '@angular/core';

import { take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { MatButtonToggleChange } from '@angular/material/button-toggle';

import { FilterService } from '@data/services/filter.service';
import { FilterControlService } from '@data/services/filter-control.service';
import { AnomaliaService } from '@data/services/anomalia.service';

import { CriticidadFilter } from '@core/models/criticidadFilter';

interface Criticidad {
  label?: string;
  completed?: boolean;
}

@Component({
  selector: 'app-criticidad-filter',
  templateUrl: './criticidad-filter.component.html',
  styleUrls: ['./criticidad-filter.component.scss'],
})
export class CriticidadFilterComponent implements OnInit, OnDestroy {
  criticidadElems: Criticidad[] = [];
  allComplete: boolean;
  filtroCriticidad: CriticidadFilter;
  public criticidadSelected: boolean[] = undefined;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private filterService: FilterService,
    private filterControlService: FilterControlService,
    private anomaliaService: AnomaliaService
  ) {}

  ngOnInit(): void {
    this.anomaliaService.criterioCriticidad.labels.forEach((label) => {
      this.criticidadElems.push({
        label,
        completed: false,
      });
    });

    this.subscriptions.add(
      this.filterControlService.criticidadSelected$.subscribe((sel) => (this.criticidadSelected = sel))
    );
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

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
