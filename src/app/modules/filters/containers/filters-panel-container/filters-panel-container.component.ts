import { Component, OnDestroy, OnInit } from '@angular/core';

import { FilterService } from '@data/services/filter.service';
import { FilterControlService } from '@data/services/filter-control.service';
import { AnomaliaService } from '@data/services/anomalia.service';
import { Subscription } from 'rxjs';
import { ReportControlService } from '@data/services/report-control.service';

@Component({
  selector: 'app-filters-panel-container',
  templateUrl: './filters-panel-container.component.html',
  styleUrls: ['./filters-panel-container.component.css'],
})
export class FiltersPanelContainerComponent implements OnInit, OnDestroy {
  filtrosActivos = false;
  mostrarFiltroModelo = false;
  hasCriticidad = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private filterService: FilterService,
    private filterControlService: FilterControlService,
    private anomaliaService: AnomaliaService,
    private reportControlService: ReportControlService
  ) {}

  ngOnInit(): void {
      this.subscriptions.add(
      this.filterService.filters$.subscribe((filters) => {
        if (filters.length > 0) {
          this.filtrosActivos = true;
        } else {
          this.filtrosActivos = false;
        }
        // Comprobamos si hay anomalías en más de un modelo de módulo, y si sólo hay uno no mostramos el filtro
        const anomalias = this.anomaliaService.getRealAnomalias(this.reportControlService.allAnomalias);
        const modelos = [...new Set(anomalias.map((anomalia) => `${anomalia.modulo.marca} (${anomalia.modulo.potencia}W)`))];
        if (modelos.length > 1) {
          this.mostrarFiltroModelo = true;
        } else {
          this.mostrarFiltroModelo = false;
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
