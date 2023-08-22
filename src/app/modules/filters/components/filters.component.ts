import { Component, ViewChild } from '@angular/core';

import { FiltersPanelContainerComponent } from '../containers/filters-panel-container/filters-panel-container.component';

import { DynamicFiltersDirective } from '../directives/dynamic-filters.directive';

@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.css'],
})
export class FiltersComponent {
  @ViewChild(DynamicFiltersDirective) dynamicFilters: DynamicFiltersDirective;

  constructor() {}

  loadFilters() {
    this.dynamicFilters.viewContainerRef.clear();
    this.dynamicFilters.viewContainerRef.createComponent(FiltersPanelContainerComponent);
  }
}
