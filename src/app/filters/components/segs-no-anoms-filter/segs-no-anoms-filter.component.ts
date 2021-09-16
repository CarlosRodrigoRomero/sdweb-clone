import { Component, OnInit } from '@angular/core';

import { MatCheckboxChange } from '@angular/material/checkbox';

import { filter, take } from 'rxjs/operators';

import { FilterService } from '@core/services/filter.service';

import { SegsNoAnomsFilter } from '@core/models/segsNoAmosFilter';

@Component({
  selector: 'app-segs-no-anoms-filter',
  templateUrl: './segs-no-anoms-filter.component.html',
  styleUrls: ['./segs-no-anoms-filter.component.css'],
})
export class SegsNoAnomsFilterComponent implements OnInit {
  checked = true;
  disabled = false;

  constructor(private filterService: FilterService) {}

  ngOnInit(): void {
    this.filterService.filters$.subscribe((filters) => {
      if (filters.filter((fil) => fil.type !== 'segsNoAnoms').length > 0) {
        this.disabled = true;
      } else {
        this.disabled = false;
      }
    });
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
      const filtroSegsNoAmos = new SegsNoAnomsFilter(event.source.id, 'segsNoAnoms');

      this.filterService.addFilter(filtroSegsNoAmos);
    }
  }
}
