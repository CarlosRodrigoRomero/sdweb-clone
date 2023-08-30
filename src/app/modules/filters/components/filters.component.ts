import { Component } from '@angular/core';

import { Subscription } from 'rxjs';

import { FilterService } from '@data/services/filter.service';

@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.css'],
})
export class FiltersComponent {
  numFiltros = 0;

  private subscriptions: Subscription = new Subscription();

  constructor(private filterService: FilterService) {}

  ngOnInit() {
    this.subscriptions.add(
      this.filterService.filters$.subscribe((filters) => {
        this.numFiltros = filters.length;
      })
    );
  }
}
