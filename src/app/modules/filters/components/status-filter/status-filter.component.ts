import { Component, OnDestroy, OnInit } from '@angular/core';

import { take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { MatButtonToggleChange } from '@angular/material/button-toggle';

import { FilterService } from '@data/services/filter.service';
import { FilterControlService } from '@data/services/filter-control.service';

import { StatusFilter } from '@core/models/statusFilter';


interface Clase {
  label?: string;
  completed?: boolean;
}
@Component({
  selector: 'app-status-filter',
  templateUrl: './status-filter.component.html',
  styleUrls: ['./status-filter.component.css']
})
export class StatusFilterComponent implements OnInit {

  statusElems: Clase[] = [];
  allComplete: boolean;
  filtroStatus: StatusFilter;
  public statusSelected: boolean[] = [false, false, false];
  labels = ['pendiente', 'revisada', 'reparada']

  private subscriptions: Subscription = new Subscription();

  constructor(private filterService: FilterService, private filterControlService: FilterControlService) {}

  ngOnInit(): void {
    this.labels.forEach((label) =>
      this.statusElems.push({
        label,
        completed: false,
      })
    );
    this.subscriptions.add(
      this.filterControlService.statusSelected$.subscribe((sel) => {
        this.statusSelected = sel;
      })
    );
  }

  onChangeStatusFilter(event: MatButtonToggleChange) {
    const indexSelected = Number(event.source.id) - 1;
    if (event.source.checked) {
      this.filtroStatus = new StatusFilter(event.source.id, 'status', event.source.name, indexSelected);
      this.filterService.addFilter(this.filtroStatus);
      this.filterControlService.statusSelected[indexSelected] = true;
    } else {
      this.filterService.filters$.pipe(take(1)).subscribe((filters) =>
        filters
          .filter((filter) => filter.type === 'status')
          .forEach((filter) => {
            if (filter.id === event.source.id) {
              this.filterService.deleteFilter(filter);
            }
          })
      );
      this.filterControlService.statusSelected[indexSelected] = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

}
