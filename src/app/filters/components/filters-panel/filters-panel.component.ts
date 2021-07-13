import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { FilterService } from '@core/services/filter.service';
import { FilterControlService } from '@core/services/filter-control.service';
import { AnomaliaService } from '@core/services/anomalia.service';

@Component({
  selector: 'app-filters-panel',
  templateUrl: './filters-panel.component.html',
  styleUrls: ['./filters-panel.component.css'],
})
export class FiltersPanelComponent implements OnInit {
  private tipoSeguidores = 'tracker';
  public esTipoSeguidores = false;
  public filtrosActivos = false;
  public hasCriticidad = false;

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

    this.filterService.filters$.subscribe((filters) => {
      if (filters.length > 0) {
        this.filtrosActivos = true;
      } else {
        this.filtrosActivos = false;
      }
    });

    this.anomaliaService.hasCriticidad$.subscribe((value) => (this.hasCriticidad = value));
  }

  cleanFilters() {
    // borra todos los filtros
    this.filterService.deleteAllFilters();

    this.filterControlService.resetFilters();
  }
}