import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Subscription } from 'rxjs';

import { ReportControlService } from '@data/services/report-control.service';
import { FilterService } from '@data/services/filter.service';
import { FilterControlService } from '@data/services/filter-control.service';

import { RecomendedAction } from '@core/models/recomendedAction';
import { Anomalia } from '@core/models/anomalia';
import { GLOBAL } from '@data/constants/global';
import { Seguidor } from '@core/models/seguidor';
import { FilterInterface } from '@core/models/filter';
import { TipoElemFilter } from '@core/models/tipoPcFilter';

@Component({
  selector: 'app-recommended-actions-container',
  templateUrl: './recommended-actions-container.component.html',
  styleUrls: ['./recommended-actions-container.component.css'],
})
export class RecommendedActionsContainerComponent implements OnInit {
  recomendedActions: RecomendedAction[] = [];
  tipos: number[];

  private subcriptions = new Subscription();

  constructor(
    private filterService: FilterService,
    private reportControlService: ReportControlService,
    private router: Router,
    private filterControlService: FilterControlService
  ) {}

  ngOnInit(): void {
    this.subcriptions.add(
      this.filterService.filteredElements$.subscribe((elems) => {
        let anomalias: Anomalia[] = [];
        if (this.reportControlService.plantaFija) {
          anomalias = elems as Anomalia[];
        } else {
          elems.forEach((elem) => {
            anomalias = anomalias.concat((elem as Seguidor).anomaliasCliente);
          });
        }

        this.recomendedActions = this.calculateRecomendedActions(anomalias).sort((a, b) => b.loss - a.loss);
      })
    );
  }

  calculateRecomendedActions(anomalias: Anomalia[]): RecomendedAction[] {
    let fixables: boolean[] = [];
    let types: number[] = [];
    let titles: string[] = [];
    let quantities: number[] = [];
    let losses: number[] = [];

    GLOBAL.pcDescripcion.forEach((label, index) => {
      if (!GLOBAL.tipos_no_utilizados.includes(index)) {
        const quantity = anomalias.filter((anomalia) => anomalia.tipo === index).length;
        if (quantity === 0) return;
        fixables.push(GLOBAL.fixableTypes.includes(index));
        types.push(index);
        titles.push(label);
        quantities.push(quantity);
        losses.push(Number((quantity * GLOBAL.pcPerdidas[index]).toFixed(2)));
      }
    });

    const maxLoss = Math.max(...losses);

    const recomendedActions: RecomendedAction[] = [];
    fixables.forEach((fixable, index) => {
      const recomendedAction: RecomendedAction = {
        fixable,
        type: types[index],
        title: titles[index],
        quantity: quantities[index],
        loss: losses[index],
        barPercentage: `${(losses[index] / maxLoss) * 100}%`,
        active: false,
      };
      recomendedActions.push(recomendedAction);
    });

    return recomendedActions;
  }

  changeActions(event: any) {
    this.recomendedActions = event;

    // seteamos los tipos para compartir el informe
    this.setTipos();
  }

  setTipos() {
    if (this.tipos === undefined) {
      this.tipos = new Array(this.recomendedActions.length).fill(null);
    }

    this.recomendedActions.forEach((action, index) => {
      if (action.active) {
        this.tipos[index] = action.type;
      } else {
        this.tipos[index] = null;
      }
    });
  }

  navigateToMapFiltered() {
    this.createTipoFilters();

    this.navigateToMap();
  }

  private createTipoFilters() {
    const filters: FilterInterface[] = [];
    let tiposSelected = new Array(GLOBAL.labels_tipos.length).fill(false);
    this.tipos.forEach((tipo, index, tipos) => {
      if (tipo !== null) {
        const filter = new TipoElemFilter(`tipo_${tipo}`, 'tipo', tipo, tipos.length, index);
        filters.push(filter);

        // marcamos para que se active el filtro en el mapa
        tiposSelected[tipo] = true;
      }
    });
    this.filterService.addFilters(filters);

    this.filterControlService.tiposSelected = tiposSelected;
  }

  private navigateToMap() {
    const url = this.router.url.split('/');
    url[url.length - 1] = 'map';
    this.router.navigate(url);
  }
}
