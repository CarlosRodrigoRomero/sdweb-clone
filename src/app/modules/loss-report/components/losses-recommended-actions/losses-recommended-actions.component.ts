import { Component, ChangeDetectionStrategy, Input, EventEmitter, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { FilterService } from '@data/services/filter.service';
import { FilterControlService } from '@data/services/filter-control.service';

import { ShareReportDialogComponent } from '@modules/shared-plants/components/share-report-dialog/share-report-dialog.component';

import { RecomendedAction } from '@core/models/recomendedAction';
import { TipoElemFilter } from '@core/models/tipoPcFilter';

import { GLOBAL } from '@data/constants/global';

@Component({
  selector: 'app-losses-recommended-actions',
  templateUrl: './losses-recommended-actions.component.html',
  styleUrls: ['./losses-recommended-actions.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LossesRecommendedActionsComponent {
  @Input() recomendedActions: RecomendedAction[];
  @Input() tipos: number[];
  @Input() numFixableAnoms: number;
  @Input() numUnfixableAnoms: number;
  @Input() fixableLossesPercentage: number;
  @Output() changeRecommendedActions = new EventEmitter<RecomendedAction[]>();
  @Output() modifiedType = new EventEmitter<string>();
  anyCheckboxSelected = false;

  constructor(
    public dialog: MatDialog,
    private filterService: FilterService,
    private filterControlService: FilterControlService,
    private router: Router
  ) {}

  fixableFilter(actions: RecomendedAction[]): RecomendedAction[] {
    return actions.filter((action) => action.fixable);
  }

  unfixableFilter(actions: RecomendedAction[]): RecomendedAction[] {
    return actions.filter((action) => !action.fixable);
  }

  changeCheckbox(event: any, type: string) {
    let newRecomendedActions: RecomendedAction[] = [];
    if (type === 'fixable') {
      newRecomendedActions = this.unfixableFilter(this.recomendedActions);
    } else {
      newRecomendedActions = this.fixableFilter(this.recomendedActions);
    }

    this.changeRecommendedActions.emit([...event, ...newRecomendedActions]);

    // Actualiza anyCheckboxSelected según si hay algún checkbox seleccionado.
    this.anyCheckboxSelected = this.recomendedActions.some((action) => action.active);
  }

  openDialog() {
    this.dialog.open(ShareReportDialogComponent, {
      data: {
        tipos: this.tipos,
      },
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
