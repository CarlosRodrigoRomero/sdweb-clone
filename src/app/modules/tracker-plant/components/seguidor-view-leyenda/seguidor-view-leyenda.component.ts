import { Component, OnDestroy, OnInit } from '@angular/core';
import { Seguidor } from '@core/models/seguidor';

import { Subscription } from 'rxjs';

import { SeguidoresControlService } from '@data/services/seguidores-control.service';
import { SeguidorViewService } from '../../services/seguidor-view.service';
import { ReportControlService } from '@data/services/report-control.service';

import { COLOR } from '@data/constants/color';
import { GLOBAL } from '@data/constants/global';

@Component({
  selector: 'app-seguidor-view-leyenda',
  templateUrl: './seguidor-view-leyenda.component.html',
  styleUrls: ['./seguidor-view-leyenda.component.css'],
})
export class SeguidorViewLeyendaComponent implements OnInit, OnDestroy {
  viewSelected: string;
  private seguidorSelected: Seguidor;
  viewsTitle: string[] = ['Pérdidas', 'Cels. Calientes', 'ΔT Max (norm)'];
  viewsLabels: string[][];
  numCelsCalientes = 0;
  colors = COLOR.colores_severity;
  tipos: any[] = [];

  private subscriptions: Subscription = new Subscription();

  constructor(
    private seguidoresControlService: SeguidoresControlService,
    private seguidorViewService: SeguidorViewService,
    private reportControlService: ReportControlService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.seguidorViewService.seguidorViewSelected$.subscribe((view) => {
        this.viewSelected = view;

        if (this.seguidorSelected !== undefined) {
          this.numCelsCalientes = this.seguidorSelected.anomaliasCliente.filter(
            // tslint:disable-next-line: triple-equals
            (anom) => anom.tipo == 8 || anom.tipo == 9
          ).length;
        }
      })
    );

    this.subscriptions.add(
      this.seguidoresControlService.seguidorSelected$.subscribe((seguidor) => {
        this.seguidorSelected = seguidor;

        if (this.seguidorSelected !== undefined && this.seguidorSelected !== null) {
          this.numCelsCalientes = this.seguidorSelected.anomaliasCliente.filter(
            // tslint:disable-next-line: triple-equals
            (anom) => anom.tipo == 8 || anom.tipo == 9
          ).length;
        }
      })
    );

    this.viewsLabels = [
      ['Bajas', 'Medias', 'Altas'],
      ['10ºC < ΔT', '10ºC ≤ ΔT < 40ºC', '40ºC ≤ ΔT'],
      ['10ºC < ΔT', '10ºC ≤ ΔT < 40ºC', '40ºC ≤ ΔT'],
    ];

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
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
