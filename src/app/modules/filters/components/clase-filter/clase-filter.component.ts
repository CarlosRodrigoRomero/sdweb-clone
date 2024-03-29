import { Component, OnDestroy, OnInit } from '@angular/core';

import { take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { MatButtonToggleChange } from '@angular/material/button-toggle';

import { FilterService } from '@data/services/filter.service';
import { FilterControlService } from '@data/services/filter-control.service';

import { ClaseFilter } from '@core/models/claseFilter';

import { COLOR } from '@data/constants/color';
import { GLOBAL } from '@data/constants/global';

interface Clase {
  label?: string;
  completed?: boolean;
}

@Component({
  selector: 'app-clase-filter',
  templateUrl: './clase-filter.component.html',
  styleUrls: ['./clase-filter.component.scss'],
})
export class ClaseFilterComponent implements OnInit, OnDestroy {
  claseElems: Clase[] = [];
  allComplete: boolean;
  filtroClase: ClaseFilter;
  coloresClase: string[];
  public claseSelected: boolean[] = [false, false, false];

  private subscriptions: Subscription = new Subscription();

  constructor(private filterService: FilterService, private filterControlService: FilterControlService) {}

  ngOnInit(): void {
    GLOBAL.labels_clase.forEach((label, index) =>
      this.claseElems.push({
        label,
        completed: false,
      })
    );

    this.coloresClase = COLOR.colores_clase;

    this.subscriptions.add(
      this.filterControlService.claseSelected$.subscribe((sel) => {
        this.claseSelected = sel;
      })
    );
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
            if (filter.id === event.source.id) {
              this.filterService.deleteFilter(filter);
            }
          })
      );
      this.filterControlService.claseSelected[parseInt(event.source.id.replace('CoA_', '')) - 1] = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
