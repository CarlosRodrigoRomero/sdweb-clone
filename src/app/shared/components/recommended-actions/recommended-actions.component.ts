import { Component, ChangeDetectionStrategy, Input, EventEmitter, Output } from '@angular/core';

import { RecomendedAction } from '@core/models/recomendedAction';

@Component({
  selector: 'app-recommended-actions',
  templateUrl: './recommended-actions.component.html',
  styleUrls: ['./recommended-actions.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecommendedActionsComponent {
  @Input() recomendedActions: RecomendedAction[];
  @Output() changeRecommendedActions = new EventEmitter<RecomendedAction[]>();

  constructor() {}

  emitChangedActions() {
    this.changeRecommendedActions.emit(this.recomendedActions);
  }
}
