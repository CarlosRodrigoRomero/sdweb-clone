import { Component, ChangeDetectionStrategy, Input, SimpleChanges } from '@angular/core';

import { RecomendedAction } from '@core/models/recomendedAction';

@Component({
  selector: 'app-recommended-actions',
  templateUrl: './recommended-actions.component.html',
  styleUrls: ['./recommended-actions.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecommendedActionsComponent {
  @Input() recomendedActions: RecomendedAction[];

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes) {
      console.log(changes);
    }
  }

  fixableFilter(actions: RecomendedAction[]): RecomendedAction[] {
    return actions.filter((action) => action.fixable);
  }

  notFixableFilter(actions: RecomendedAction[]): RecomendedAction[] {
    return actions.filter((action) => !action.fixable);
  }
}
