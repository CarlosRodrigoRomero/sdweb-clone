import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { SeguidoresControlService } from '@data/services/seguidores-control.service';
import { ReportControlService } from '@data/services/report-control.service';
import { AnomaliaInfoService } from '@data/services/anomalia-info.service';

import { Seguidor } from '@core/models/seguidor';

@Component({
  selector: 'app-seguidor-info',
  templateUrl: './seguidor-info.component.html',
  styleUrls: ['./seguidor-info.component.css'],
})
export class SeguidorInfoComponent implements OnInit, OnDestroy {
  numAnomalias: number;
  seguidorHovered: Seguidor;
  localizacion: string;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private seguidoresControlService: SeguidoresControlService,
    private reportControlService: ReportControlService,
    private anomaliaInfoService: AnomaliaInfoService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.seguidoresControlService.seguidorHovered$.subscribe((seguidor) => {
        this.seguidorHovered = seguidor;

        if (this.seguidorHovered !== undefined) {
          this.numAnomalias = this.seguidorHovered.anomaliasCliente.length;
          this.localizacion = this.getLocalizacionLabel(this.seguidorHovered);
        }
      })
    );
  }

  private getLocalizacionLabel(seguidor: Seguidor): string {
    let label = '';

    let globals = seguidor.globalCoords.filter((coord) => coord !== undefined && coord !== null && coord !== '');
    // quitamos la ultima global xq es la del seguidor
    globals = globals.filter((g, index) => index < globals.length - 1);

    globals.forEach((coord, index) => {
      if (coord !== undefined && coord !== null && coord !== '') {
        if (this.reportControlService.nombreGlobalCoords.length > 0) {
          const nombres = this.reportControlService.nombreGlobalCoords;
          label += `${nombres[index]}: ${coord}`;
        } else {
          label += `${coord}`;
        }
      }
      if (index < globals.length - 1) {
        label += ' / ';
      }
    });

    return label;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
