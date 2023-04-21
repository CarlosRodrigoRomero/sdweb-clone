import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ReportControlService } from '@data/services/report-control.service';
import { FilterService } from '@data/services/filter.service';
import { FilterControlService } from '@data/services/filter-control.service';

import { Anomalia } from '@core/models/anomalia';
import { RecomendedAction } from '@core/models/recomendedAction';
import { InformeInterface } from '@core/models/informe';
import { TipoElemFilter } from '@core/models/tipoPcFilter';

import { GLOBAL } from '@data/constants/global';

@Component({
  selector: 'app-recommended-actions-prediction-container',
  templateUrl: './recommended-actions-prediction-container.component.html',
  styleUrls: ['./recommended-actions-prediction-container.component.css'],
})
export class RecommendedActionsPredictionContainerComponent implements OnInit {
  recomendedActions: RecomendedAction[] = [];
  private lastReport: InformeInterface;
  tipos: number[];

  constructor(
    private reportControlService: ReportControlService,
    private filterService: FilterService,
    private filterControlService: FilterControlService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.lastReport = this.reportControlService.informes[this.reportControlService.informes.length - 1];

    const anomaliasLastReport = this.reportControlService.allAnomalias.filter(
      (anom) => anom.informeId === this.lastReport.id
    );

    const fixableAnoms = anomaliasLastReport.filter((anom) => GLOBAL.fixableTypes.includes(anom.tipo));

    const nextYearNotFixableAnoms = fixableAnoms.filter((anom) => {
      if (anom.hasOwnProperty('tipoNextYear')) {
        return !GLOBAL.fixableTypes.includes(anom.tipoNextYear);
      }
    });

    // this.calculatePredictionRecommendedActions(nextYearNotFixableAnoms);
    this.recomendedActions = this.calculatePredictionRecommendedActions(fixableAnoms).sort((a, b) => b.loss - a.loss);
  }

  calculatePredictionRecommendedActions(anomalias: Anomalia[]): RecomendedAction[] {
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
        losses.push(Number(this.getTypeLosses(quantity, index).toFixed(2)));
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

  private getTypeLosses(quantity: number, index: number): number {
    const totalLoss = quantity * GLOBAL.pcPerdidas[index];

    const lossPercentage = totalLoss / this.lastReport.numeroModulos;

    return lossPercentage * this.reportControlService.planta.potencia;
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
    const filters: TipoElemFilter[] = [];
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
