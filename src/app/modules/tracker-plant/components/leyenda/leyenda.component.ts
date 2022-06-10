import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { ViewReportService } from '@data/services/view-report.service';

import { GLOBAL } from '@data/constants/global';

@Component({
  selector: 'app-leyenda',
  templateUrl: './leyenda.component.html',
  styleUrls: ['./leyenda.component.css'],
})
export class LeyendaComponent implements OnInit, OnDestroy {
  colors = [GLOBAL.colores_mae, GLOBAL.colores_mae, GLOBAL.colores_grad];
  viewSelected: number;
  viewsLabels: string[][];
  viewsTitle: string[] = ['MAE por seguidor', 'Cels. Calientes por seguidor', 'ΔT Max (norm) por seguidor'];

  private subscriptions: Subscription = new Subscription();

  constructor(private viewReportService: ViewReportService) {}

  ngOnInit(): void {
    this.viewsLabels = [
      ['Muy bueno', 'Correcto', 'Mejorable'],
      ['Muy bueno', 'Correcto', 'Mejorable'],
      ['10ºC < ΔT', '10ºC ≤ ΔT < 40ºC', '40ºC ≤ ΔT'],
    ];

    this.subscriptions.add(
      this.viewReportService.reportViewSelected$.subscribe((view) => (this.viewSelected = view))
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
