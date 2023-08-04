import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { FilterService } from '@data/services/filter.service';
import { FilterControlService } from '@data/services/filter-control.service';
import { AnomaliaService } from '@data/services/anomalia.service';
import { ReportControlService } from '@data/services/report-control.service';

import { ModuloInterface } from '@core/models/modulo';

@Component({
  selector: 'app-filters-panel-container',
  templateUrl: './filters-panel-container.component.html',
  styleUrls: ['./filters-panel-container.component.css'],
})
export class FiltersPanelContainerComponent implements OnInit, OnDestroy {
  filtrosActivos = false;
  showFiltroModelo = false;
  showFiltroZona = false;
  hasCriticidad = false;
  tipoCubierta = false;

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
      })
    );

    // comprobamos si es un autoconsumo
    this.tipoCubierta = this.reportControlService.planta.tipo === 'cubierta';

    // Comprobamos si hay anomalías en más de un modelo de módulo, y si sólo hay uno no mostramos el filtro
    const anomalias = this.anomaliaService.getRealAnomalias(this.reportControlService.allAnomalias);
    const modelosModulos = [...new Set(anomalias.map((anomalia) => this.setModuleLabel(anomalia.modulo)))];
    if (modelosModulos.length > 1) {
      this.showFiltroModelo = true;
    } else {
      this.showFiltroModelo = false;
    }

    if (!this.tipoCubierta) {
      // Comprobamos si las anomalías tienen zonas asociadas; si no existen zonas, no mostramos el filtro
      const zonas = [...new Set(anomalias.map((anomalia) => anomalia.globalCoords[0]))];
      this.showFiltroZona = zonas.length > 1;
    }

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

  setModuleLabel(module: ModuloInterface): string {
    let label: string;
    if (module.marca) {
      label = `${module.marca} (${module.potencia}W)`;
    } else {
      label = `${module.potencia}W`;
    }
    return label;
  }
}
