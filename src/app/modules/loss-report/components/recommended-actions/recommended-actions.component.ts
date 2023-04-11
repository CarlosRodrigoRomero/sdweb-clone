import { Component, ChangeDetectionStrategy, Input, EventEmitter, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { ShareReportDialogComponent } from '@modules/shared-plants/components/share-report-dialog/share-report-dialog.component';

import { RecomendedAction } from '@core/models/recomendedAction';

@Component({
  selector: 'app-recommended-actions',
  templateUrl: './recommended-actions.component.html',
  styleUrls: ['./recommended-actions.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecommendedActionsComponent {
  @Input() recomendedActions: RecomendedAction[];
  @Input() tipos: number[];
  @Output() changeRecommendedActions = new EventEmitter<RecomendedAction[]>();
  @Output() navigateToMapFiltered = new EventEmitter();

  constructor(public dialog: MatDialog) {}

  fixableFilter(actions: RecomendedAction[]): RecomendedAction[] {
    return actions.filter((action) => action.fixable);
  }

  notFixableFilter(actions: RecomendedAction[]): RecomendedAction[] {
    return actions.filter((action) => !action.fixable);
  }

  emitChangedActions() {
    this.changeRecommendedActions.emit(this.recomendedActions);
  }

  openDialog() {
    this.dialog.open(ShareReportDialogComponent, {
      data: {
        tipos: this.tipos,
      },
    });
  }

  createFilters() {}
}
