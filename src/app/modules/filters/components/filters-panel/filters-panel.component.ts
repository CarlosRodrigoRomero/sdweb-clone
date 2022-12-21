import { Component, ChangeDetectionStrategy, Input, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-filters-panel',
  templateUrl: './filters-panel.component.html',
  styleUrls: ['./filters-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FiltersPanelComponent {
  @Input() filtrosActivos: boolean;
  @Output() cleanFilters = new EventEmitter();

  clickCleanFilters() {
    this.cleanFilters.emit();
  }
}
