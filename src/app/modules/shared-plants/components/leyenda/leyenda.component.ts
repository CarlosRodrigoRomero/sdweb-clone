import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { ViewReportService } from '@data/services/view-report.service';

import { COLOR } from '@data/constants/color';

@Component({
  selector: 'app-leyenda',
  templateUrl: './leyenda.component.html',
  styleUrls: ['./leyenda.component.css'],
})
export class LeyendaComponent implements OnInit, OnDestroy {
  colors = [COLOR.colores_severity, COLOR.colores_severity, COLOR.colores_severity];
  viewSelected: number;
  viewsLabels: string[][];
  viewsTitle: string[] = ['MAE por seguidor', 'Cels. Calientes por seguidor', 'ΔT Max (norm) por seguidor'];

  private subscriptions: Subscription = new Subscription();

  constructor(private viewReportService: ViewReportService) {}

  ngOnInit(): void {
    this.viewsLabels = [
      ['Bueno', 'Medio', 'Alto'],
      ['Bueno', 'Medio', 'Alto'],
      ['10ºC < ΔT', '10ºC ≤ ΔT < 40ºC', '40ºC ≤ ΔT'],
    ];

    this.subscriptions.add(this.viewReportService.reportViewSelected$.subscribe((view) => (this.viewSelected = view)));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
