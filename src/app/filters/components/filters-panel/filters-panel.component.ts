import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { FilterService } from '@core/services/filter.service';
import { FilterControlService } from '@core/services/filter-control.service';
import { AnomaliaService } from '@core/services/anomalia.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-filters-panel',
  templateUrl: './filters-panel.component.html',
  styleUrls: ['./filters-panel.component.css'],
})
export class FiltersPanelComponent implements OnInit, OnDestroy {
  private tipoSeguidores = 'tracker';
  public esTipoSeguidores = false;
  public filtrosActivos = false;
  public hasCriticidad = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private filterService: FilterService,
    private router: Router,
    private filterControlService: FilterControlService,
    private anomaliaService: AnomaliaService
  ) {}

  ngOnInit(): void {
    if (this.router.url.includes(this.tipoSeguidores)) {
      this.esTipoSeguidores = true;
    }

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
