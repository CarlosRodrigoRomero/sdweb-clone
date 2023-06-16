import { Component, OnInit } from '@angular/core';

import { take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { MatButtonToggleChange } from '@angular/material/button-toggle';

import { FilterService } from '@data/services/filter.service';
import { FilterControlService } from '@data/services/filter-control.service';

import { ReparableFilter } from '@core/models/reparableFilter';

interface Reparable {
  label?: string;
  completed?: boolean;
}

@Component({
  selector: 'app-reparable-filter',
  templateUrl: './reparable-filter.component.html',
  styleUrls: ['./reparable-filter.component.css']
})
export class ReparableFilterComponent implements OnInit {

  reparableElems: Reparable[] = [];
  allComplete: boolean;
  filtroReparable: ReparableFilter;
  private labels = ['Reparable', 'No reparable'];

  public reparableSelected: boolean[] = undefined;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private filterService: FilterService,
    private filterControlService: FilterControlService,
  ) {}

  ngOnInit(): void {
    this.labels.forEach((label) => {
      this.reparableElems.push({
        label,
        completed: false,
      });
    });

    this.subscriptions.add(
      this.filterControlService.reparableSelected$.subscribe((sel) => (this.reparableSelected = sel))
    );
  }

  onChangeReparableFilter(event: MatButtonToggleChange) {
    const indexSelected = Number(event.source.id) - 1;
    const reparableSelected: boolean = indexSelected === 0;

    if (event.source.checked) {
      this.filtroReparable = new ReparableFilter(indexSelected.toString(), 'reparable', reparableSelected);

      this.filterService.addFilter(this.filtroReparable);
      this.filterControlService.reparableSelected[indexSelected] = true;
      // Como es un filtro simple, hacemos uncheck del otro botón
      this.filterControlService.reparableSelected[Math.abs(indexSelected - 1)] = false;
    } else {
      this.filterService.filters$.pipe(take(1)).subscribe((filters) =>
        this.filterService.deleteFilter(
          filters.filter((filter) => filter.type === 'reparable')[0]
        ));
      this.filterControlService.reparableSelected[indexSelected] = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

}
