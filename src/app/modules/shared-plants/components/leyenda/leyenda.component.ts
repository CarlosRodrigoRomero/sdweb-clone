import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { ViewReportService } from '@data/services/view-report.service';
import { ReportControlService } from '@data/services/report-control.service';
import { ZonesService } from '@data/services/zones.service';
import { OlMapService } from '@data/services/ol-map.service';
import { ZonesControlService } from '@data/services/zones-control.service';

import { COLOR } from '@data/constants/color';
import { GLOBAL } from '@data/constants/global';

@Component({
  selector: 'app-leyenda',
  templateUrl: './leyenda.component.html',
  styleUrls: ['./leyenda.component.css'],
})
export class LeyendaComponent implements OnInit, OnDestroy {
  colors = [COLOR.colores_severity, COLOR.colores_severity, COLOR.colores_severity, COLOR.colores_tipos];
  viewSelected: string;
  viewsData = {
    mae: {
      labelsZone: ['Bueno', 'Medio', 'Alto'],
      labelsAnoms: ['Bajas', 'Medias', 'Altas'],
      titleZone: 'MAE',
      titleAnoms: 'Pérdidas',
      color: COLOR.colores_severity,
    },
    cc: {
      labelsZone: ['Bueno', 'Medio', 'Alto'],
      labelsAnoms: ['10ºC < ΔT', '10ºC ≤ ΔT < 40ºC', '40ºC ≤ ΔT'],
      titleZone: ' % Cels. Calientes',
      titleAnoms: 'Clasificación por ΔTª Max (norm)',
      color: COLOR.colores_severity,
    },
    grad: {
      labelsZone: ['10ºC < ΔT', '10ºC ≤ ΔT < 40ºC', '40ºC ≤ ΔT'],
      labelsAnoms: ['10ºC < ΔT', '10ºC ≤ ΔT < 40ºC', '40ºC ≤ ΔT'],
      titleZone: 'ΔTª Max (norm)',
      titleAnoms: 'ΔTª Max (norm)',
      color: COLOR.colores_severity,
    },
  };
  plantaFija: boolean;
  thereAreZones: boolean;
  tipos: any[] = [];
  simplifiedView: boolean;
  currentZoom: number;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private viewReportService: ViewReportService,
    private reportControlService: ReportControlService,
    private zonesService: ZonesService,
    private olMapService: OlMapService,
    public zonesControlService: ZonesControlService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(this.viewReportService.reportViewSelected$.subscribe((view) => (this.viewSelected = view)));

    this.subscriptions.add(
      this.viewReportService.simplifiedView$.subscribe((simplifiedView) => (this.simplifiedView = simplifiedView))
    );

    this.plantaFija = this.reportControlService.plantaFija;
    this.thereAreZones = this.zonesService.thereAreZones;

    this.reportControlService.selectedInformeId$.subscribe((informeId) => {
      this.tipos = [];
      const anomaliasInforme = this.reportControlService.allAnomalias.filter(
        (anomalia) => anomalia.informeId === informeId
      );
      GLOBAL.labels_tipos.forEach((tipo, index) => {
        if (anomaliasInforme.find((anomalia) => anomalia.tipo === index)) {
          this.tipos.push({
            label: tipo,
            color: COLOR.colores_tipos[index],
          });
        }
      });
    });

    this.subscriptions.add(this.olMapService.currentZoom$.subscribe((zoom) => (this.currentZoom = zoom)));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
