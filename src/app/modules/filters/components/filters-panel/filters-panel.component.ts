import { Component, ChangeDetectionStrategy, Input, EventEmitter, Output, OnInit } from '@angular/core';
import { AnomaliaService } from '@data/services/anomalia.service';
import { ReportControlService } from '@data/services/report-control.service';

@Component({
  selector: 'app-filters-panel',
  templateUrl: './filters-panel.component.html',
  styleUrls: ['./filters-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FiltersPanelComponent{
  @Input() filtrosActivos: boolean;
  @Input() mostrarFiltroModelo: boolean;
  @Output() cleanFilters = new EventEmitter();

  clickCleanFilters() {
    this.cleanFilters.emit();
  }
}
