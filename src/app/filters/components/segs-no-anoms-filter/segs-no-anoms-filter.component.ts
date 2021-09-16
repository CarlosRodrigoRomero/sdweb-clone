import { Component, OnDestroy, OnInit } from '@angular/core';

import { MatCheckboxChange } from '@angular/material/checkbox';

import { take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { FilterService } from '@core/services/filter.service';
import { FilterControlService } from '@core/services/filter-control.service';

import { SegsNoAnomsFilter } from '@core/models/segsNoAmosFilter';

@Component({
  selector: 'app-segs-no-anoms-filter',
  templateUrl: './segs-no-anoms-filter.component.html',
  styleUrls: ['./segs-no-anoms-filter.component.css'],
})
export class SegsNoAnomsFilterComponent implements OnInit, OnDestroy {
  checked = true;
  disabled = false;

  private subscriptions: Subscription = new Subscription();

  constructor(private filterService: FilterService, private filterControlService: FilterControlService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.filterService.filters$.subscribe((filters) => {
        if (filters.filter((fil) => fil.type !== 'segsNoAnoms').length > 0) {
          this.disabled = true;
        } else {
          this.disabled = false;
        }
      })
    );

    this.subscriptions.add(this.filterControlService.segsNoAnoms$.subscribe((active) => (this.checked = active)));
  }

  onChange(event: MatCheckboxChange) {
    if (event.checked) {
      this.filterService.filters$.pipe(take(1)).subscribe((filters) =>
        filters
          .filter((filter) => filter.type === 'segsNoAnoms')
          .forEach((filter) => {
            if (filter.id === event.source.id) {
              this.filterService.deleteFilter(filter);
            }
          })
      );
    } else {
      const filtroSegsNoAmos = new SegsNoAnomsFilter(event.source.id, 'segsNoAnoms', event.checked);

      this.filterService.addFilter(filtroSegsNoAmos);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
