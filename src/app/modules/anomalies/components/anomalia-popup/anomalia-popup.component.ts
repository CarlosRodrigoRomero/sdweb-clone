import { Component, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { AnomaliasControlService } from '@data/services/anomalias-control.service';
import { ReportControlService } from '@data/services/report-control.service';
import { AnomaliaInfoService } from '@data/services/anomalia-info.service';

import { Anomalia } from '@core/models/anomalia';

import { GLOBAL } from '@data/constants/global';

@Component({
  selector: 'app-anomalia-popup',
  templateUrl: './anomalia-popup.component.html',
  styleUrls: ['./anomalia-popup.component.css'],
})
export class AnomaliaPopupComponent implements OnInit {
  numAnomalias: number;
  anomaliaHovered: Anomalia;
  localizacion: string;
  posicion: string;
  tipoLabel: string;
  showAnomaliaInfo = false;
  showSuciedadInfo = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private anomaliasControlService: AnomaliasControlService,
    private reportControlService: ReportControlService,
    private anomaliaInfoService: AnomaliaInfoService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.anomaliasControlService.anomaliaHover$.subscribe((anomalia) => {
        this.anomaliaHovered = anomalia;
        if (this.anomaliaHovered !== undefined) {
          this.showAnomaliaInfo = true;
          this.showSuciedadInfo = false;
          this.tipoLabel = GLOBAL.labels_tipos[this.anomaliaHovered.tipo];
          this.localizacion = this.anomaliaInfoService.getLocalizacionTranslateLabel(
            this.anomaliaHovered,
            this.reportControlService.planta
          );
          this.posicion = this.anomaliaInfoService.getPosicionModuloTranslateLabel(
            this.anomaliaHovered,
            this.reportControlService.planta
          );
        } else {
          this.showAnomaliaInfo = false;
          this.showSuciedadInfo = false;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
