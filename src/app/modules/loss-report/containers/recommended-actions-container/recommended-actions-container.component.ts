import { Component, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { ReportControlService } from '@data/services/report-control.service';
import { FilterService } from '@data/services/filter.service';

import { RecomendedAction } from '@core/models/recomendedAction';
import { Anomalia } from '@core/models/anomalia';
import { GLOBAL } from '@data/constants/global';
import { Seguidor } from '@core/models/seguidor';

@Component({
  selector: 'app-recommended-actions-container',
  templateUrl: './recommended-actions-container.component.html',
  styleUrls: ['./recommended-actions-container.component.css'],
})
export class RecommendedActionsContainerComponent implements OnInit {
  recomendedActions: RecomendedAction[] = [];

  private subcriptions = new Subscription();

  constructor(private filterService: FilterService, private reportControlService: ReportControlService) {}

  ngOnInit(): void {
    this.subcriptions.add(
      this.filterService.filteredElements$.subscribe((elems) => {
        console.log(elems.length);
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
    let titles: string[] = [];
    let quantities: number[] = [];
    let losses: number[] = [];

    GLOBAL.pcDescripcion.forEach((label, index) => {
      if (!GLOBAL.tipos_no_utilizados.includes(index)) {
        const quantity = anomalias.filter((anomalia) => anomalia.tipo === index).length;
        if (quantity === 0) return;
        fixables.push(GLOBAL.fixableTypes.includes(index));
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
        title: titles[index],
        quantity: quantities[index],
        loss: losses[index],
        barPercentage: `${(losses[index] / maxLoss) * 100}%`,
      };
      recomendedActions.push(recomendedAction);
    });

    return recomendedActions;
  }
}
