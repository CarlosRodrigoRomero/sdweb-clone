import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { ReportControlService } from '@data/services/report-control.service';
import { FilterService } from '@data/services/filter.service';

import { RecomendedAction } from '@core/models/recomendedAction';
import { Anomalia } from '@core/models/anomalia';
import { Seguidor } from '@core/models/seguidor';
import { InformeInterface } from '@core/models/informe';

import { GLOBAL } from '@data/constants/global';

@Component({
  selector: 'app-recommended-actions-container',
  templateUrl: './recommended-actions-container.component.html',
  styleUrls: ['./recommended-actions-container.component.css'],
})
export class RecommendedActionsContainerComponent implements OnInit, OnDestroy {
  recomendedActions: RecomendedAction[] = [];
  tipos: number[];
  private selectedReport: InformeInterface;
  fixableLossesPercentage = 0;

  private subcriptions = new Subscription();

  constructor(
    private filterService: FilterService,
    private reportControlService: ReportControlService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.subcriptions.add(
      this.reportControlService.selectedInformeId$
        .pipe(
          switchMap((id) => {
            this.selectedReport = this.reportControlService.informes.find((informe) => informe.id === id);

            return this.filterService.filteredElements$;
          })
        )
        .subscribe((elems) => {
          let anomalias: Anomalia[] = [];
          if (this.reportControlService.plantaFija) {
            anomalias = elems as Anomalia[];
          } else {
            elems.forEach((elem) => {
              anomalias = anomalias.concat((elem as Seguidor).anomaliasCliente);
            });
          }

          this.recomendedActions = this.calculateRecomendedActions(anomalias).sort((a, b) => b.mae - a.mae);

          // calculamos el porcentaje de pérdidas que se pueden arreglar
          this.calculateFixableLosses();
        })
    );
  }

  calculateRecomendedActions(anomalias: Anomalia[]): RecomendedAction[] {
    let fixables: boolean[] = [];
    let types: number[] = [];
    let titles: string[] = [];
    let quantities: number[] = [];
    let maes: number[] = [];

    GLOBAL.pcDescripcion.forEach((label, index) => {
      if (!GLOBAL.tipos_no_utilizados.includes(index)) {
        const quantity = anomalias.filter((anomalia) => anomalia.tipo === index).length;
        if (quantity === 0) return;
        fixables.push(GLOBAL.fixableTypes.includes(index));
        types.push(index);
        titles.push(label);
        quantities.push(quantity);
        maes.push(Number(this.getTypeLosses(quantity, index)));
      }
    });

    const maxLoss = Math.max(...maes);

    const recomendedActions: RecomendedAction[] = [];
    fixables.forEach((fixable, index) => {
      const recomendedAction: RecomendedAction = {
        fixable,
        type: types[index],
        title: titles[index],
        quantity: quantities[index],
        mae: maes[index],
        barPercentage: `${(maes[index] / maxLoss) * 100}%`,
        active: false,
      };
      recomendedActions.push(recomendedAction);
    });

    return recomendedActions;
  }

  private getTypeLosses(quantity: number, index: number): number {
    const totalLoss = quantity * GLOBAL.pcPerdidas[index];

    const lossPercentage = totalLoss / this.selectedReport.numeroModulos;

    return lossPercentage;
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

  private calculateFixableLosses() {
    let fixableLosses = 0;
    this.recomendedActions.forEach((action) => {
      if (action.fixable) {
        fixableLosses += action.mae;
      }
    });
    const totalLosses = this.recomendedActions.reduce((acc, action) => acc + action.mae, 0);

    this.fixableLossesPercentage = fixableLosses / totalLosses;
  }

  ngOnDestroy() {
    this.subcriptions.unsubscribe();
  }
}
