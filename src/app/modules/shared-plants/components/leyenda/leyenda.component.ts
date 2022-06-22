import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { ViewReportService } from '@data/services/view-report.service';
import { ReportControlService } from '@data/services/report-control.service';
import { ZonesService } from '@data/services/zones.service';

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
  viewsCCsLabels: string[] = ['10ºC < ΔT', '10ºC ≤ ΔT < 40ºC', '40ºC ≤ ΔT'];
  plantaFija: boolean;
  thereAreZones: boolean;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private viewReportService: ViewReportService,
    private reportControlService: ReportControlService,
    private zonesService: ZonesService
  ) {}

  ngOnInit(): void {
    this.viewsLabels = [
      ['Bueno', 'Medio', 'Alto'],
      ['Bueno', 'Medio', 'Alto'],
      ['10ºC < ΔT', '10ºC ≤ ΔT < 40ºC', '40ºC ≤ ΔT'],
    ];

    this.subscriptions.add(this.viewReportService.reportViewSelected$.subscribe((view) => (this.viewSelected = view)));

    this.plantaFija = this.reportControlService.plantaFija;
    this.thereAreZones = this.zonesService.thereAreZones;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
