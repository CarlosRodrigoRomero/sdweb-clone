import { Component, OnDestroy, OnInit } from '@angular/core';

import { FilterService } from '@data/services/filter.service';
import { FilterControlService } from '@data/services/filter-control.service';
import { AnomaliaService } from '@data/services/anomalia.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-filters-panel-container',
  templateUrl: './filters-panel-container.component.html',
  styleUrls: ['./filters-panel-container.component.css'],
})
export class FiltersPanelContainerComponent implements OnInit, OnDestroy {
  filtrosActivos = false;
  hasCriticidad = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private filterService: FilterService,
    private filterControlService: FilterControlService,
    private anomaliaService: AnomaliaService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.filterService.filters$.subscribe((filters) => {
        if (filters.length > 0) {
          this.filtrosActivos = true;
        } else {
          this.filtrosActivos = false;
        }
      })
    );

    this.subscriptions.add(this.anomaliaService.hasCriticidad$.subscribe((value) => (this.hasCriticidad = value)));
  }

  cleanFilters() {
    // borra todos los filtros
    this.filterService.deleteAllFilters();

    // reseteamos los parametros
    this.filterControlService.resetFilters();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
