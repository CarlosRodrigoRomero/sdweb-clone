import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { FilterService } from '@data/services/filter.service';
import { FilterControlService } from '@data/services/filter-control.service';

import { ShareReportDialogComponent } from '@modules/shared-plants/components/share-report-dialog/share-report-dialog.component';

import { RecomendedAction } from '@core/models/recomendedAction';
import { TipoElemFilter } from '@core/models/tipoPcFilter';

import { GLOBAL } from '@data/constants/global';

@Component({
  selector: 'app-recommended-actions-prediction',
  templateUrl: './recommended-actions-prediction.component.html',
  styleUrls: ['./recommended-actions-prediction.component.css'],
})
export class RecommendedActionsPredictionComponent {
  @Input() recomendedActions: RecomendedAction[];
  @Input() tipos: number[];
  @Output() changeRecommendedActions = new EventEmitter<RecomendedAction[]>();

  constructor(
    public dialog: MatDialog,
    private filterService: FilterService,
    private filterControlService: FilterControlService,
    private router: Router
  ) {}

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
